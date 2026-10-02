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

test("main chat settings stages file edits, preserves other draft edits, saves on close, and restores defaults in draft only", () => {
    const h = hooks();
    const defaults = { openai: [{ id: "image", config: {} }] };
    const state = { models: [{ id: "openai/chat" }], selectedModel: "openai/chat", providerFileMetadata: { openai: [{ id: "image", config: { detail: "low" } }] } };
    const calls = {};
    const setters = new Proxy(state, { get: (target, key) => target[key] ?? (String(key).startsWith("set") ? (value) => { calls[key] = value; } : undefined) });
    setters.setProviderFileMetadata = (value) => { state.providerFileMetadata = value; };
    const store = (selector) => selector(setters);
    const local = new Proxy({}, { get: (_, name) => name });
    const { ChatSettingsModal } = load("packages/aihappey-core/src/features/chat-settings/ChatSettingsModal.tsx", {
        react: h.react, "aihappey-components": components, "aihappey-i18n": i18n,
        "aihappey-state": { useAppStore: store, defaultProviderFileMetadata: defaults, defaultProviderMetadata: {}, defaultProviderHeaders: {} },
        "./GeneralTab": local, "./ToolsTab": local, "./ToolConfigurationTab": local, "./ChatSkillsEditor": local, "./ChatPluginsEditor": local,
        "../provider-config/google/GoogleChatConfig": local,
        "../provider-config/openai/openAISkillOptions": { buildOpenAISkillOptions: () => [], createOpenAIShellSkillResolver: () => undefined },
        "aihappey-skills": { useSkills: () => ({ items: [] }) }, "aihappey-plugins": { usePlugins: () => ({ items: [] }) },
        "../chat/context/ChatContext": { useChatContext: () => ({ config: { baseUrl: "", endpoints: { skills: "/skills" } } }) },
        "../../runtime/providers/providerMetadata": { PROVIDERS: { openai: { name: "OpenAI" } } },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => [] },
        "../chat/engine/endpointProfiles": { resolveEndpointProfileForSelectedModel: () => undefined },
        "../tools/useTools": { useTools: () => ({ attachedTools: [] }) }, "../skills/connectedMcpSkills": { connectedMcpSkills: () => [] },
        "../providers/ProviderFileSettings": { useProviderFileSettingsTabs: (_, controlled) => [{ id: "file:image", icon: "image", title: "Image", content: controlled }] },
    });
    let savedChat;
    const props = { open: true, providerMetadata: {}, providerHeaders: {}, setProviderMetadata: (value) => { savedChat = value; }, setProviderHeaders() {}, resetDefaults: true, onClose() {} };
    let modal = h.render(ChatSettingsModal, props);
    h.flush();
    modal = h.render(ChatSettingsModal, props);
    find(modal, (node) => node.type === "GeneralTab").props.setMaxOutputTokens(123);
    find(modal, (node) => node.type === "Tabs").props.onSelect("provider");
    modal = h.render(ChatSettingsModal, props);
    let rail = find(modal, (node) => node.type === "ProviderSettingsTabs");
    assert.deepEqual(rail.props.tabs.map((tab) => tab.id), ["settings", "file:image"]);
    rail.props.tabs[0].content.props.updateConfig({ reasoning: { effort: "high" } });
    rail.props.tabs[1].content.updateMetadata(() => ({ openai: [{ id: "image", config: { detail: "high" } }] }));
    modal = h.render(ChatSettingsModal, props);
    h.flush();
    modal = h.render(ChatSettingsModal, props);
    rail = find(modal, (node) => node.type === "ProviderSettingsTabs");
    assert.equal(rail.props.tabs[0].content.props.config.reasoning.effort, "high");
    assert.equal(state.providerFileMetadata.openai[0].config.detail, "low");
    modal.props.onHide();
    assert.equal(state.providerFileMetadata.openai[0].config.detail, "high");
    assert.equal(savedChat.openai.reasoning.effort, "high");
    assert.equal(calls.setMaxOutputTokens, 123);

    // Restore only mutates the draft until the next close, including file options.
    modal.props.actions.props.onRestoreDefaults();
    modal = h.render(ChatSettingsModal, props);
    assert.equal(state.providerFileMetadata.openai[0].config.detail, "high");
    modal.props.actions.props.onClose();
    assert.deepEqual(state.providerFileMetadata, defaults);
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
