// Run with: node --test scripts/provider-settings-regression.test.cjs
// Hook-level regression tests without adding a browser/test-framework dependency.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const path = require("node:path");
const { buildSync } = require("esbuild");
const React = require("react");
const ts = require("typescript");
const fs = require("node:fs");

function load(relativePath, mocks = {}) {
    const filename = path.resolve(relativePath);
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
        fileName: filename,
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)((id) => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id} in ${relativePath}`);
    }, module, module.exports);
    return module.exports;
}

function hooks() {
    const slots = [];
    let index = 0;
    let pending = [];
    const changed = (a, b) => !a || !b || a.length !== b.length || a.some((item, i) => item !== b[i]);
    const react = {
        ...React,
        useState(initial) {
            const i = index++;
            if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
            return [slots[i], (next) => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }];
        },
        useMemo(factory, deps) {
            const i = index++;
            if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { deps, value: factory() };
            return slots[i].value;
        },
        useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
        useEffect(effect, deps) {
            const i = index++;
            if (!slots[i] || changed(slots[i], deps)) { slots[i] = deps; pending.push(effect); }
        },
    };
    return {
        react,
        render(Component, props) { index = 0; return Component(props); },
        flush() { const effects = pending; pending = []; effects.forEach((effect) => effect()); },
    };
}

const theme = new Proxy({}, { get: (_, name) => name });
const components = new Proxy({ useTheme: () => theme }, { get: (target, name) => target[name] ?? name });
const i18n = { useTranslation: () => ({ t: (key) => key }) };
function find(node, predicate) {
    if (!node || typeof node !== "object") return undefined;
    if (React.isValidElement(node) && predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children ?? [])) {
        const match = find(child, predicate);
        if (match) return match;
    }
}
const children = (node) => React.Children.toArray(node.props.children);

function providerKeysHarness(initialValues = { "X-OpenAI-Key": "configured-key" }) {
    const h = hooks();
    const { ProviderKeysForm } = load("packages/aihappey-components/src/forms/providers/ProviderKeysForm.tsx", {
        react: h.react, "aihappey-i18n": i18n, "../../theme/ThemeContext": components,
    });
    const calls = [];
    const props = {
        items: [
            { id: "openai", name: "OpenAI", header: "X-OpenAI-Key" },
            { id: "anthropic", name: "Anthropic", header: "X-Anthropic-Key", searchText: "claude console" },
            { id: "google", name: "Google", header: "X-Google-Key" },
        ],
        values: { ...initialValues },
        onChange: async (header, value) => {
            calls.push(["change", header, value]);
            props.values = { ...props.values, [header]: value };
        },
        onRemove: (header) => {
            calls.push(["remove", header]);
            const { [header]: _, ...next } = props.values;
            props.values = next;
        },
    };
    const render = () => {
        const tree = h.render(ProviderKeysForm, props);
        h.flush();
        return tree;
    };
    return { props, calls, render };
}

test("provider keys lists only configured keys, masks by default, and searches unconfigured providers", async () => {
    const { render, calls } = providerKeysHarness({
        "X-OpenAI-Key": "configured-key", "X-Google-Key": "   ",
    });
    let tree = render();
    let input = find(tree, (node) => node.type === "Input");
    assert.equal(input.props.value, "configured-key");
    assert.equal(input.props.type, "password");
    assert.equal(input.props.readOnly, true);
    assert.equal(find(tree, (node) => node.type === "Select"), undefined);
    assert.equal(find(tree, (node) => node.type === "SearchBox"), undefined);

    find(tree, (node) => node.props.icon === "add").props.onClick();
    tree = render();
    let select = find(tree, (node) => node.type === "Select");
    assert.deepEqual(children(select).map((option) => option.props.children), ["Anthropic", "Google"]);
    find(tree, (node) => node.type === "SearchBox").props.onChange(" CLAUDE ");
    tree = render();
    select = find(tree, (node) => node.type === "Select");
    assert.deepEqual(children(select).map((option) => option.props.children), ["Anthropic"]);
    select.props.onChange("X-Anthropic-Key");
    tree = render();
    input = find(tree, (node) => node.type === "Input" && !node.props.readOnly);
    assert.equal(input.props.type, "password");
    assert.equal(find(tree, (node) => node.props.children === "save").props.disabled, true);
    input.props.onChange({ target: { value: "   " } });
    tree = render();
    assert.equal(find(tree, (node) => node.props.children === "save").props.disabled, true);
    find(tree, (node) => node.type === "Input" && !node.props.readOnly).props.onChange({ target: { value: "new-key" } });
    assert.deepEqual(calls, []);
    tree = render();
    await find(tree, (node) => node.props.children === "save").props.onClick();
    tree = render();
    assert.deepEqual(calls, [["change", "X-Anthropic-Key", "new-key"]]);
    assert.equal(find(tree, (node) => node.type === "Select"), undefined);
    assert.equal(find(tree, (node) => node.type === "Input" && node.props.value === "new-key").props.type, "password");
});

test("provider keys supports cancel, explicit edits, reveal, and removal without modifying other keys", async () => {
    const { render, calls, props } = providerKeysHarness({
        "X-OpenAI-Key": "configured-key", "X-Anthropic-Key": "other-key",
    });
    let tree = render();
    find(tree, (node) => node.props.icon === "eye").props.onClick();
    tree = render();
    assert.equal(find(tree, (node) => node.type === "Input").props.type, "text");
    find(tree, (node) => node.props.icon === "edit").props.onClick();
    tree = render();
    assert.equal(find(tree, (node) => node.type === "Select"), undefined);
    let editor = find(tree, (node) => node.type === "Input" && !node.props.readOnly);
    assert.equal(editor.props.type, "password");
    assert.equal(editor.props.value, "configured-key");
    editor.props.onChange({ target: { value: "discarded" } });
    tree = render();
    find(tree, (node) => node.props.children === "cancel").props.onClick();
    assert.deepEqual(calls, []);
    tree = render();
    assert.equal(find(tree, (node) => node.type === "Input" && !node.props.readOnly), undefined);
    find(tree, (node) => node.props.icon === "edit").props.onClick();
    tree = render();
    find(tree, (node) => node.type === "Input" && !node.props.readOnly).props.onChange({ target: { value: "replacement" } });
    tree = render();
    await find(tree, (node) => node.props.children === "save").props.onClick();
    tree = render();
    assert.equal(find(tree, (node) => node.type === "Input").props.type, "password");
    assert.deepEqual(calls, [["change", "X-OpenAI-Key", "replacement"]]);
    assert.equal(props.values["X-Anthropic-Key"], "other-key");
    find(tree, (node) => node.props.icon === "delete").props.onClick();
    tree = render();
    assert.equal(find(tree, (node) => node.type === "Input").props.value, "other-key");
    assert.deepEqual(calls[1], ["remove", "X-OpenAI-Key"]);
    find(tree, (node) => node.props.icon === "add").props.onClick();
    tree = render();
    assert.ok(children(find(tree, (node) => node.type === "Select")).some((option) => option.props.value === "X-OpenAI-Key"));
});

test("provider key editor handles empty lists, unavailable providers, save failures, and locked state", async () => {
    const { render, props, calls } = providerKeysHarness({});
    let tree = render();
    assert.equal(find(tree, (node) => node.type === "Input"), undefined);
    find(tree, (node) => node.props.icon === "add").props.onClick();
    tree = render();
    find(tree, (node) => node.type === "SearchBox").props.onChange("not-a-provider");
    tree = render();
    assert.deepEqual(children(find(tree, (node) => node.type === "Select")), []);
    assert.ok(find(tree, (node) => node.props.children === "noResults"));
    find(tree, (node) => node.type === "SearchBox").props.onChange("");
    tree = render();
    find(tree, (node) => node.type === "Select").props.onChange({ target: { value: "X-OpenAI-Key" } });
    find(tree, (node) => node.type === "Input").props.onChange({ target: { value: "draft-key" } });
    props.onChange = async () => { throw new Error("Storage failed"); };
    tree = render();
    await find(tree, (node) => node.props.children === "save").props.onClick();
    tree = render();
    assert.ok(find(tree, (node) => node.type === "Alert" && node.props.children === "error"));
    assert.equal(find(tree, (node) => node.type === "Input").props.value, "draft-key");
    assert.equal(find(tree, (node) => node.props.children === "save").props.disabled, false);
    props.disabled = true;
    tree = render();
    assert.equal(find(tree, (node) => node.type === "Select"), undefined);
    assert.equal(find(tree, (node) => node.props.icon === "add").props.disabled, true);
    props.disabled = false;
    tree = render();
    assert.equal(find(tree, (node) => node.type === "Input"), undefined);
    props.values = Object.fromEntries(props.items.map((item) => [item.header, "configured"]));
    tree = render();
    assert.equal(find(tree, (node) => node.props.icon === "add").props.disabled, true);
    assert.deepEqual(calls, []);
});

test("provider keys modal preserves encrypted persistence and provider enablement, and unmounts keys on close", async () => {
    const h = hooks();
    const encrypted = [];
    const state = {
        customHeaders: { "X-OpenAI-Key": "old-key", "X-Other": "untouched" },
        encryptedApiKeys: { ciphertext: "existing" },
        apiKeyEncryptionStatus: "unlocked",
        apiKeySessionPassword: "session-password",
        enabledProvidersByType: { language: [], image: [] },
        setEncryptedApiKeys: (value) => { state.encryptedApiKeys = value; },
        addCustomHeader: (header, value) => { state.customHeaders = { ...state.customHeaders, [header]: value }; },
        removeCustomHeader: (header) => { const { [header]: _, ...next } = state.customHeaders; state.customHeaders = next; },
        setEnabledProvidersForType: (type, names) => { state.enabledProvidersByType[type] = names; },
    };
    const { ProviderKeysModal } = load("packages/aihappey-core/src/features/provider-credentials/ProviderKeysModal.tsx", {
        react: { ...h.react, useRef: (value) => h.react.useMemo(() => ({ current: value }), []) },
        "aihappey-components": components, "aihappey-i18n": i18n,
        "aihappey-state": { useAppStore: (selector) => selector(state), PROVIDER_CAPABILITIES: ["language", "image"] },
        "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
        "./providerAuthHeaders": { getProviderApiKeyHeaderName: () => "X-OpenAI-Key" },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => ({ openai: { name: "OpenAI" } }) },
        "./ApiKeyPasswordModal": { ApiKeyPasswordModal: "ApiKeyPasswordModal" },
        "./apiKeyEncryption": {
            decryptApiKeys: async () => state.customHeaders,
            encryptApiKeys: async (headers, password) => {
                encrypted.push({ headers, password });
                return { ciphertext: `encrypted-${encrypted.length}` };
            },
        },
    });
    const render = (open = true) => {
        const tree = h.render(ProviderKeysModal, { open, onClose() {} });
        h.flush();
        return tree;
    };
    let form = find(render(), (node) => node.type === "ProviderKeysForm");
    await form.props.onChange("X-OpenAI-Key", "updated-key");
    assert.deepEqual(encrypted[0], {
        headers: { "X-OpenAI-Key": "updated-key", "X-Other": "untouched" }, password: "session-password",
    });
    assert.deepEqual(state.encryptedApiKeys, { ciphertext: "encrypted-1" });
    assert.deepEqual(state.enabledProvidersByType, { language: ["OpenAI"], image: ["OpenAI"] });
    form = find(render(), (node) => node.type === "ProviderKeysForm");
    await form.props.onRemove("X-OpenAI-Key");
    assert.deepEqual(encrypted[1].headers, { "X-Other": "untouched" });
    assert.deepEqual(state.customHeaders, { "X-Other": "untouched" });
    assert.deepEqual(state.enabledProvidersByType, { language: [], image: [] });
    assert.equal(find(render(false), (node) => node.type === "ProviderKeysForm"), undefined);
    state.apiKeyEncryptionStatus = "locked";
    form = find(render(), (node) => node.type === "ProviderKeysForm");
    assert.equal(form.props.disabled, true);
    await form.props.onChange("X-OpenAI-Key", "blocked-key");
    assert.equal(encrypted.length, 2);
    assert.deepEqual(state.customHeaders, { "X-Other": "untouched" });
});

test("shared rail selects the first tab, preserves selection, and falls back for missing/duplicate icons", () => {
    const h = hooks();
    const { ProviderSettingsTabs } = load("packages/aihappey-components/src/layout/ProviderSettingsTabs.tsx", {
        react: h.react, "../theme/ThemeContext": components,
    });
    const tabs = [
        { id: "models", title: "Models", icon: "brain", content: "model cards" },
        { id: "settings", title: "Settings", icon: "settings", content: "settings form" },
        { id: "file:image", title: "Image", icon: "image", content: "image form" },
    ];
    let rail = h.render(ProviderSettingsTabs, { tabs });
    assert.equal(rail.props.activeKey, "models");
    assert.equal(rail.props.iconOnly, true);
    assert.deepEqual(children(rail).map((tab) => tab.props.title), ["Models", "Settings", "Image"]);
    rail.props.onSelect("file:image");
    rail = h.render(ProviderSettingsTabs, { tabs });
    assert.equal(rail.props.activeKey, "file:image");
    assert.equal(children(rail)[0].props.children, null);
    assert.equal(children(rail)[2].props.children.props.children, "image form");
    rail = h.render(ProviderSettingsTabs, { tabs: tabs.slice(0, 2) });
    assert.equal(rail.props.activeKey, "models");
    assert.equal(h.render(ProviderSettingsTabs, { tabs: [...tabs, { id: "custom", title: "Custom" }] }).props.iconOnly, false);
    assert.equal(h.render(ProviderSettingsTabs, { tabs: [...tabs, { id: "other", title: "Other", icon: "image" }] }).props.iconOnly, false);
    assert.equal(h.render(ProviderSettingsTabs, { tabs: [tabs[1]] }).props.activeKey, "settings");
    assert.equal(h.render(ProviderSettingsTabs, { tabs: [] }), null);
});

test("provider details removes Files and integrates file forms into Language, including file-only providers", () => {
    const h = hooks();
    const { ProviderDetailModal } = load("packages/aihappey-components/src/modals/ProviderDetailModal.tsx", {
        react: h.react, "aihappey-i18n": i18n,
        "aihappey-types": { getModelProviderKey: (id) => id.split("/")[0], getModelTypeIcon: (type) => type, getModelTypeLabelKey: (type) => type },
        "../cards/ModelCard": { ModelCard: "ModelCard" }, "../buttons/OpenLinkButton": { OpenLinkButton: "OpenLinkButton" },
        "../theme/ThemeContext": components, "../layout/ProviderSettingsTabs": { ProviderSettingsTabs: "ProviderSettingsTabs" },
    });
    const fileSettingsTabs = [{ id: "file:image", title: "Image", icon: "image", content: "file form" }];
    const props = { open: true, onClose() {}, providerKey: "openai", providerName: "OpenAI", models: [
        { id: "openai/chat", type: "language" }, { id: "openai/image", type: "image" },
    ], fileSettingsTabs, providerSettingsTypes: ["language"], renderProviderSettings: () => "chat form" };
    let modal = h.render(ProviderDetailModal, props);
    let tabs = children(find(modal, (node) => node.type === "Tabs"));
    assert.deepEqual(tabs.map((tab) => tab.props.eventKey), ["general", "language", "image"]);
    const content = tabs[1].props.children;
    const rail = h.render(content.type, content.props);
    assert.deepEqual(rail.props.tabs.map((tab) => tab.id), ["models", "settings", "file:image"]);
    assert.equal(tabs[2].props.children.props.fileSettingsTabs, undefined);
    modal = h.render(ProviderDetailModal, { ...props, models: [], providerSettingsTypes: [] });
    tabs = children(find(modal, (node) => node.type === "Tabs"));
    assert.deepEqual(tabs.map((tab) => tab.props.eventKey), ["general", "language"]);
    assert.deepEqual(h.render(tabs[1].props.children.type, tabs[1].props.children.props).props.tabs.map((tab) => tab.id), ["models", "file:image"]);
});

test("file-form functional edits preserve other providers, sibling configs, and custom entries", () => {
    const defaults = { openai: [{ id: "image", mediaTypes: ["image/png"], config: {} }, { id: "default", config: {} }] };
    let saved = { openai: [{ ...defaults.openai[0], config: { detail: "low" } }, { id: "custom", config: { keep: true } }], google: [{ id: "video", config: { resolution: "high" } }] };
    const store = (selector) => selector({ providerFileMetadata: saved, setProviderFileMetadata: (update) => { saved = update(saved); } });
    const { useProviderFileSettingsTabs } = load("packages/aihappey-core/src/features/providers/ProviderFileSettings.tsx", {
        react: React, "aihappey-components": components, "aihappey-i18n": i18n,
        "aihappey-state": { defaultProviderFileMetadata: defaults, useAppStore: store },
    });
    const tabs = useProviderFileSettingsTabs("OPENAI");
    assert.deepEqual(tabs.map((tab) => tab.id), ["file:image", "file:default"]);
    const before = structuredClone(saved);
    find(tabs[1].content, (node) => node.type === "OpenAIFileConfigForm").props.updateConfig({ detail: "high" });
    assert.deepEqual(saved.openai.find((entry) => entry.id === "image"), before.openai[0]);
    assert.deepEqual(saved.openai.find((entry) => entry.id === "custom"), before.openai[1]);
    assert.deepEqual(saved.google, before.google);
    assert.deepEqual(saved.openai.find((entry) => entry.id === "default").config, { detail: "high" });
    let draft = structuredClone(saved);
    const controlled = useProviderFileSettingsTabs("openai", { metadata: draft, updateMetadata: (update) => { draft = update(draft); } });
    find(controlled[0].content, (node) => node.type === "OpenAIFileConfigForm").props.updateConfig({ detail: "auto" });
    assert.equal(saved.openai[0].config.detail, "low");
    assert.equal(draft.openai[0].config.detail, "auto");
});

function chatSettingsHarness(overrides = {}, defaults = { openai: [{ id: "image", config: {} }] }) {
    const h = hooks();
    const state = { models: [{ id: "openai/chat" }], selectedModel: "openai/chat", providerFileMetadata: { openai: [{ id: "image", config: { detail: "low" } }] }, ...overrides };
    const calls = {};
    const setters = new Proxy(state, { get: (target, key) => target[key] ?? (String(key).startsWith("set") ? (value) => { calls[key] = value; } : undefined) });
    setters.setProviderFileMetadata = (value) => { state.providerFileMetadata = value; };
    const store = (selector) => selector(setters);
    const local = new Proxy({}, { get: (_, name) => name });
    const fileSettings = load("packages/aihappey-core/src/features/providers/ProviderFileSettings.tsx", {
        react: React, "aihappey-components": components, "aihappey-i18n": i18n,
        "aihappey-state": { useAppStore: store, defaultProviderFileMetadata: defaults },
    });
    const { ChatSettingsModal } = load("packages/aihappey-core/src/features/chat-settings/ChatSettingsModal.tsx", {
        react: h.react, "aihappey-components": components, "aihappey-i18n": i18n,
        "aihappey-state": { useAppStore: store, defaultProviderFileMetadata: defaults, defaultProviderMetadata: {}, defaultProviderHeaders: {} },
        "aihappey-types": load("packages/aihappey-types/src/modelIdentity.ts"),
        "./GeneralTab": local, "./ToolsTab": local, "./ToolConfigurationTab": local, "./ChatSkillsEditor": local, "./ChatPluginsEditor": local,
        "../provider-config/google/GoogleChatConfig": local,
        "../provider-config/openai/openAISkillOptions": { buildOpenAISkillOptions: () => [], createOpenAIShellSkillResolver: () => undefined },
        "aihappey-skills": { useSkills: () => ({ items: [] }) }, "aihappey-plugins": { usePlugins: () => ({ items: [] }) },
        "../chat/context/ChatContext": { useChatContext: () => ({ config: { baseUrl: "", endpoints: { skills: "/skills" } } }) },
        "../../runtime/providers/providerMetadata": { PROVIDERS: { openai: { name: "OpenAI" }, mistral: { name: "Mistral" }, anthropic: { name: "Anthropic" } } },
        "../tools/useTools": { useTools: () => ({ attachedTools: [] }) }, "../skills/connectedMcpSkills": { connectedMcpSkills: () => [] },
        "../providers/ProviderFileSettings": fileSettings,
    });
    let savedChat, savedHeaders;
    const props = { open: true, providerMetadata: {}, providerHeaders: {}, setProviderMetadata: (value) => { savedChat = value; }, setProviderHeaders: (value) => { savedHeaders = value; }, resetDefaults: true, onClose() {} };
    const render = () => { h.render(ChatSettingsModal, props); h.flush(); return h.render(ChatSettingsModal, props); };
    const tabs = (modal) => children(find(modal, (node) => node.type === "Tabs")).filter((node) => node.props.eventKey.startsWith("provider:"));
    const rail = (modal) => {
        const content = find(modal, (node) => node.props.providerKey && typeof node.type === "function");
        return content?.type(content.props);
    };
    const select = (key) => { find(render(), (node) => node.type === "Tabs").props.onSelect(`provider:${key}`); return render(); };
    return { state, calls, props, defaults, render, tabs, rail, select, get savedChat() { return savedChat; }, get savedHeaders() { return savedHeaders; } };
}

test("main chat settings stages file edits, preserves other draft edits, saves on close, and restores defaults in draft only", () => {
    const h = chatSettingsHarness();
    let modal = h.render();
    find(modal, (node) => node.type === "GeneralTab").props.setMaxOutputTokens(123);
    modal = h.select("openai");
    let rail = h.rail(modal);
    assert.deepEqual(rail.props.tabs.map((tab) => tab.id), ["settings", "file:image"]);
    rail.props.tabs[0].content.props.updateConfig({ reasoning: { effort: "high" } });
    find(rail.props.tabs[1].content, (node) => node.type === "OpenAIFileConfigForm").props.updateConfig({ detail: "high" });
    modal = h.render();
    rail = h.rail(modal);
    assert.equal(rail.props.tabs[0].content.props.config.reasoning.effort, "high");
    assert.equal(h.state.providerFileMetadata.openai[0].config.detail, "low");
    modal.props.onHide();
    assert.equal(h.state.providerFileMetadata.openai[0].config.detail, "high");
    assert.equal(h.savedChat.openai.reasoning.effort, "high");
    assert.equal(h.calls.setMaxOutputTokens, 123);

    // Restore only mutates the draft until the next close, including file options.
    modal.props.actions.props.onRestoreDefaults();
    modal = h.render();
    assert.equal(h.state.providerFileMetadata.openai[0].config.detail, "high");
    modal.props.actions.props.onClose();
    assert.deepEqual(h.state.providerFileMetadata, h.defaults);
});

test("multi-model chat settings shows one provider tab in selection order, not the last winner or deciding model", () => {
    const h = chatSettingsHarness({
        models: [{ id: "openai/chat" }, { id: "openai/other" }, { id: "mistral/chat" }, { id: "anthropic/decide", type: "decision" }],
        selectedModel: "mistral/chat", selectedChatModelIds: ["openai/chat", "mistral/chat", "openai/other", "openai/chat"],
        userPreferredDecisionModel: "anthropic/decide",
    });
    assert.deepEqual(h.tabs(h.render()).map((tab) => [tab.props.eventKey, tab.props.title]), [
        ["provider:openai", "OpenAI"], ["provider:mistral", "Mistral"],
    ]);
    assert.deepEqual(h.rail(h.select("openai")).props.tabs.map((tab) => tab.id), ["settings", "file:image"]);
    const mistral = h.rail(h.select("mistral"));
    assert.deepEqual(mistral.props.tabs.map((tab) => tab.id), ["settings"]);
    assert.equal(mistral.props.tabs[0].content.type, "MistralChatConfigForm");
    h.state.selectedModel = "openai/chat";
    assert.deepEqual(h.tabs(h.render()).map((tab) => tab.props.title), ["OpenAI", "Mistral"]);
});

test("provider tabs use explicit normalized identity for direct models and omit unsupported providers", () => {
    const h = chatSettingsHarness({
        models: [
            { id: "alias/chat__direct", route: "direct", sourceProviderKey: " OpenAI ", providerKey: "mistral" },
            { id: "alias/other", providerKey: " MISTRAL " }, { id: "unknown/chat" },
        ],
        selectedChatModelIds: ["alias/chat__direct", "alias/other", "openai/fallback", "unknown/chat"],
    });
    assert.deepEqual(h.tabs(h.render()).map((tab) => tab.props.title), ["OpenAI", "Mistral"]);
    h.state.selectedChatModelIds = undefined;
    h.state.selectedModel = "mistral/fallback";
    assert.deepEqual(h.tabs(h.render()).map((tab) => tab.props.title), ["Mistral"]);
    h.state.selectedChatModelIds = [];
    assert.deepEqual(h.tabs(h.render()), []);
    h.state.selectedChatModelIds = undefined;
    h.state.selectedModel = undefined;
    assert.deepEqual(h.tabs(h.render()), []);
});

test("removing the active provider returns to General; retaining it preserves its stable tab key", () => {
    const h = chatSettingsHarness({ selectedChatModelIds: ["openai/chat", "mistral/chat"] });
    h.select("mistral");
    h.state.selectedChatModelIds = ["mistral/chat", "openai/chat"];
    let modal = h.render();
    assert.equal(find(modal, (node) => node.type === "Tabs").props.activeKey, "provider:mistral");
    h.state.selectedChatModelIds = ["openai/chat"];
    modal = h.render();
    assert.equal(find(modal, (node) => node.type === "Tabs").props.activeKey, "general");
    assert.ok(find(modal, (node) => node.type === "GeneralTab"));
});

test("switching provider tabs preserves isolated chat, header and file drafts and saves all providers on close", () => {
    const defaults = load("packages/aihappey-state/src/slices/defaultProviderFileMetadata.ts").defaultProviderFileMetadata;
    const h = chatSettingsHarness({ selectedChatModelIds: ["openai/chat", "mistral/chat", "anthropic/chat"], providerFileMetadata: structuredClone(defaults) }, defaults);
    h.props.providerMetadata = { unrelated: { keep: true } };
    h.props.providerHeaders = { unrelated: { keep: "true" } };
    let rail = h.rail(h.select("openai"));
    rail.props.tabs[0].content.props.updateConfig({ reasoning: { effort: "high" } });
    rail.props.tabs[0].content.props.updateHeaders({ "OpenAI-Beta": "test" });
    find(rail.props.tabs[1].content, (node) => node.type === "OpenAIFileConfigForm").props.updateConfig({ detail: "high" });
    rail = h.rail(h.select("mistral"));
    rail.props.tabs[0].content.props.updateConfig({ safe_prompt: true });
    rail = h.rail(h.select("anthropic"));
    rail.props.tabs[0].content.props.updateConfig({ thinking: { type: "adaptive" } });
    rail.props.tabs[0].content.props.updateHeaders({ "anthropic-beta": "test" });
    find(rail.props.tabs[1].content, (node) => node.type === "AnthropicImageFileConfigForm").props.updateConfig({ test: "anthropic" });
    let modal = h.select("openai");
    rail = h.rail(modal);
    assert.equal(rail.props.tabs[0].content.props.config.reasoning.effort, "high");
    assert.equal(rail.props.tabs[0].content.props.headers["OpenAI-Beta"], "test");
    assert.equal(find(rail.props.tabs[1].content, (node) => node.type === "OpenAIFileConfigForm").props.config.detail, "high");
    assert.deepEqual(h.state.providerFileMetadata, defaults);
    assert.equal(h.savedChat, undefined);
    assert.equal(h.savedHeaders, undefined);
    modal.props.onHide();
    assert.deepEqual(h.savedChat, { unrelated: { keep: true }, openai: { reasoning: { effort: "high" } }, mistral: { safe_prompt: true }, anthropic: { thinking: { type: "adaptive" } } });
    assert.deepEqual(h.savedHeaders, { unrelated: { keep: "true" }, openai: { "OpenAI-Beta": "test" }, anthropic: { "anthropic-beta": "test" } });
    assert.equal(h.state.providerFileMetadata.openai[0].config.detail, "high");
    assert.equal(h.state.providerFileMetadata.anthropic[0].config.test, "anthropic");
    assert.deepEqual(h.state.providerFileMetadata.openai[1], defaults.openai[1]);
    assert.deepEqual(h.state.providerFileMetadata.google, defaults.google);
    modal.props.actions.props.onRestoreDefaults();
    modal = h.render();
    assert.equal(h.savedChat.mistral.safe_prompt, true);
    modal.props.onHide();
    assert.deepEqual(h.savedChat, {});
    assert.deepEqual(h.savedHeaders, {});
    assert.deepEqual(h.state.providerFileMetadata, defaults);
});

test("new file parts use latest saved options after async extraction; sent parts remain immutable", async () => {
    const metadataModule = { exports: {} };
    const code = buildSync({ entryPoints: ["packages/aihappey-state/src/slices/providerFileMetadata.ts"], bundle: true, platform: "node", format: "cjs", write: false }).outputFiles[0].text;
    new Function("module", "exports", code)(metadataModule, metadataModule.exports);
    const { withFileProviderMetadata } = metadataModule.exports;
    let saved = { openai: [{ id: "image", mediaTypes: ["image/png"], config: { detail: "low" } }, { id: "default", config: { detail: "auto" } }] };
    const store = (selector) => selector({ sendRawAttachments: true, maxAttachmentsSize: 1024, providerFileMetadata: saved });
    store.getState = () => ({ providerFileMetadata: saved });
    const resource = { type: "file", mediaType: "application/pdf", providerMetadata: { custom: { keep: true } }, url: "resource" };
    const { useUserMessageBuilder } = load("packages/aihappey-core/src/features/chat/messages/useUserMessageBuilder.ts", {
        react: { useCallback: (fn) => fn }, "aihappey-types": {}, "aihappey-state": { useAppStore: store, store, withFileProviderMetadata }, exifr: {},
        "../files/markdown": { toMarkdownLinkSmart() {} }, "../files/file": { fileToDataUrl: async () => "data" },
        "./useResourceParts": { useResourceParts: () => [resource] },
        "../../../runtime/files/fileAttachmentRuntime": { fileAttachmentRuntime: {}, useFileAttachments: () => [{ name: "local.png", type: "image/png", size: 1 }] },
        "../../../runtime/mcp/mcpPrompts": {},
        "../../../runtime/files/urlAttachmentRuntime": { useUrlAttachments: () => [{ type: "file", mediaType: "image/png", url: "https://example.org/image.png" }] },
    });
    const builder = useUserMessageBuilder({ getAttachmentParts: async () => ({ parts: [], convertedKeys: [] }) });
    const first = await builder.buildFromText("first");
    assert.equal(first.parts[1].providerMetadata.openai.detail, "low");
    saved = { ...saved, openai: saved.openai.map((entry) => ({ ...entry, config: { detail: "high" } })) };
    const next = await builder.buildFromText("next");
    assert.equal(next.parts[1].providerMetadata.openai.detail, "high");
    assert.equal(next.parts[2].providerMetadata.openai.detail, "high");
    assert.equal(next.parts[0].providerMetadata.custom.keep, true);
    assert.equal(first.parts[1].providerMetadata.openai.detail, "low");
    saved.openai[0].config.detail = "auto";
    assert.equal(next.parts[1].providerMetadata.openai.detail, "high");
    const duringConversion = useUserMessageBuilder({ getAttachmentParts: async () => {
        saved.openai[0].config.detail = "original";
        return { parts: [], convertedKeys: [] };
    } });
    assert.equal((await duringConversion.buildFromText("latest")).parts[1].providerMetadata.openai.detail, "original");
    assert.equal(withFileProviderMetadata(resource, {}).providerMetadata.custom.keep, true);
});
