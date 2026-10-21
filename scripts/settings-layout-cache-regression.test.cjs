const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");

const root = path.resolve(__dirname, "..");
function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(path.join(root, filename), "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react/jsx-runtime") return require(id);
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

function nodes(node, type) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(node.type === type ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => nodes(child, type)),
    ];
}
const theme = new Proxy({}, { get: (_, key) => key });
const i18n = { useTranslation: () => ({ t: key => key }) };

test("agent tag editor lives exclusively in its own tab immediately after General", () => {
    const filename = "packages/aihappey-core/src/features/agents/AgentForm.tsx";
    const source = ts.createSourceFile(filename, fs.readFileSync(path.join(root, filename), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const tabs = [];
    function visit(node) {
        if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "Tab") {
            const key = node.openingElement.attributes.properties.find(prop => prop.name?.getText(source) === "eventKey");
            if (key && ts.isStringLiteral(key.initializer)) tabs.push({ key: key.initializer.text, node });
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.deepEqual(tabs.slice(0, 2).map(tab => tab.key), ["general", "tags"]);
    assert.equal(tabs.filter(tab => tab.key === "tags").length, 1);
    assert.doesNotMatch(tabs[0].node.getText(source), /tagInput|agentEdit\.tags|<Tags/);
    const editor = tabs[1].node.getText(source);
    assert.match(editor, /title=\{t\("agentEdit.tags"\)\}/);
    assert.match(editor, /value=\{tagInput\}/);
    assert.match(editor, /addTag\(tagInput\)/);
    assert.match(editor, /availableTags\.filter/);
    assert.match(editor, /onChange=\{\(value: string\) => addTag\(value\)\}/);
    assert.match(editor, /onRemove=/);
});

function settings(authenticated) {
    const calls = [];
    const state = {
        enableUserLocation: true, remoteStorageConnected: false, extractExif: false,
        convertAttachmentsToText: true, sendRawAttachments: false, maxAttachmentsSize: 2 * 1024 * 1024,
        toolOutputContentSettings: {},
        setEnableUserLocation: value => calls.push(["location", value]),
        setRemoteStorageConnected: value => calls.push(["cloud", value]),
        setExtractExif: value => calls.push(["exif", value]),
        setConvertAttachmentsToText: value => calls.push(["convert", value]),
        setSendRawAttachments: value => calls.push(["raw", value]),
        setMaxAttachmentsSize: value => calls.push(["size", value]),
    };
    const mocks = {
        react: { ...React, useState: initial => [initial, () => {}] },
        "aihappey-components": { useTheme: () => theme, useMultiTheme: () => null },
        "aihappey-i18n": i18n,
        "aihappey-state": { CHAT_ENDPOINT_IDS: ["/api/chat"], useAppStore: selector => selector(state) },
        "../chat/context/ChatContext": { useChatContext: () => ({ config: authenticated ? { getAccessToken: () => "token" } : {} }) },
    };
    for (const [module, name] of [
        ["./ModelContextSettings", "ModelContextSettings"], ["./GeneralSettings", "GeneralSettings"],
        ["./AiDefaultSettings", "AiDefaultSettings"], ["./StorageSettings", "StorageSettings"],
        ["./AppsSettings", "AppsSettings"], ["../chat-settings/SideInferenceAgentsTab", "SideInferenceAgentsTab"],
        ["../provider-credentials/ProviderKeysModal", "ProviderKeysModal"], ["./export/ExportSettings", "ExportSettings"],
    ]) mocks[module] = { [name]: name };
    const { SettingsModal } = load("packages/aihappey-core/src/features/user-settings/SettingsModal.tsx", mocks);
    return { tree: SettingsModal({ open: true, onClose() {} }), calls };
}

test("attachment EXIF toggle is inside an Images card and attachment handlers are unchanged", () => {
    const { tree, calls } = settings(false);
    const tab = nodes(tree, "Tab").find(tab => tab.props.eventKey === "attachments");
    const card = nodes(tab, "Card").find(card => card.props.title === "images");
    assert.ok(card);
    assert.equal(card.props.size, "small");
    assert.equal(nodes(tab, "h4").length, 0);
    const exif = nodes(card, "Switch")[0];
    assert.equal(exif.props.id, "setExtractExif-toggle");
    assert.equal(exif.props.checked, false);
    exif.props.onChange();
    assert.deepEqual(calls.pop(), ["exif", true]);
    const switches = nodes(tab, "Switch");
    assert.equal(switches.length, 3);
    switches.find(node => node.props.id === "convertAttachmentsToText-toggle").props.onChange();
    switches.find(node => node.props.id === "sendRawAttachments-toggle").props.onChange();
    const slider = nodes(tab, "Slider")[0];
    assert.equal(slider.props.value, 2);
    slider.props.onChange(5);
    assert.deepEqual(calls, [["convert", false], ["raw", true], ["size", 5 * 1024 * 1024]]);
});

for (const authenticated of [false, true]) {
    test(`connector toggles use separate rows and keep cloud visibility (authenticated=${authenticated})`, () => {
        const { tree, calls } = settings(authenticated);
        const tab = nodes(tree, "Tab").find(tab => tab.props.eventKey === "connectors");
        const container = nodes(tab, "div")[0];
        assert.equal(container.props.style.display, "flex");
        assert.equal(container.props.style.flexDirection, "column");
        assert.ok(container.props.style.gap > 0);
        const switches = nodes(container, "Switch");
        assert.deepEqual(switches.map(node => node.props.id), authenticated ? ["location-toggle", "remote-storage-toggle"] : ["location-toggle"]);
        switches[0].props.onChange(false);
        if (authenticated) switches[1].props.onChange();
        assert.deepEqual(calls, authenticated ? [["location", false], ["cloud", true]] : [["location", false]]);
    });
}

const { OpenAIPromptCacheOptionsForm } = load("packages/aihappey-components/src/forms/providers/openai/cards/OpenAIPromptCacheOptionsForm.tsx", {
    "../../../../theme/ThemeContext": { useTheme: () => theme }, "aihappey-i18n": i18n,
});
function cacheForm(initial) {
    let config = initial;
    const render = () => OpenAIPromptCacheOptionsForm({ config, updateConfig: next => { config = next; } });
    return {
        render, config: () => config,
        select: suffix => nodes(render(), "Select").find(node => node.props.label.endsWith(suffix)),
        toggle: enabled => render().props.headerActions.props.onChange(enabled),
    };
}

for (const mode of ["implicit", "explicit"]) {
    test(`OpenAI 12-hour TTL survives selection, saved reload, and mode changes (${mode})`, () => {
        const form = cacheForm({ prompt_cache_key: "stable", prompt_cache_retention: "24h", prompt_cache_options: { mode, ttl: "30m" }, reasoning: { effort: "high" } });
        const lifetime = form.select(".ttl");
        assert.deepEqual(lifetime.props.options.map(option => option.value), ["30m", "12h"]);
        assert.deepEqual(nodes(lifetime, "option").map(option => option.props.value), ["30m", "12h"]);
        lifetime.props.onChange("12h");
        assert.deepEqual(form.config().prompt_cache_options, { mode, ttl: "12h" });
        const reloaded = cacheForm(JSON.parse(JSON.stringify(form.config())));
        assert.deepEqual(reloaded.select(".ttl").props.values, ["12h"]);
        reloaded.select(".mode").props.onChange(mode === "implicit" ? "explicit" : "implicit");
        assert.equal(reloaded.config().prompt_cache_options.ttl, "12h");
        assert.equal(reloaded.config().prompt_cache_key, "stable");
        assert.equal(reloaded.config().prompt_cache_retention, "24h");
        assert.deepEqual(reloaded.config().reasoning, { effort: "high" });
        reloaded.select(".ttl").props.onChange("30m");
        assert.equal(reloaded.config().prompt_cache_options.ttl, "30m");
    });
}

test("OpenAI prompt-cache defaults, disable behavior, and localized labels remain correct", () => {
    const form = cacheForm({ prompt_cache_key: "keep" });
    assert.equal(form.select(".ttl").props.disabled, true);
    form.toggle(true);
    assert.deepEqual(form.config().prompt_cache_options, { mode: "implicit", ttl: "30m" });
    assert.equal(form.select(".ttl").props.disabled, false);
    form.select(".ttl").props.onChange("12h");
    form.toggle(false);
    assert.deepEqual(form.config(), { prompt_cache_key: "keep" });
    for (const [locale, label] of [["en", "12 hours"], ["nl", "12 uur"]]) {
        const translations = JSON.parse(fs.readFileSync(path.join(root, `packages/aihappey-i18n/src/locales/${locale}/providers.json`), "utf8"));
        assert.equal(translations.openai.promptCacheOptions.ttls["12h"], label);
    }
});

test("Responses request preserves the nested 12-hour cache TTL without changing legacy retention", () => {
    const form = cacheForm({ prompt_cache_options: { mode: "implicit", ttl: "30m" } });
    form.select(".ttl").props.onChange("12h");
    const { responsesEndpoint } = load("packages/aihappey-clients/src/endpoints/responses.ts", {
        "../shared/messages": { toResponsesConversationInput: () => ({ input: [], instructions: undefined }) },
        "../shared/nativeMetadata": { resolveNativeRequestMetadata: () => undefined },
        "../shared/providerRequestConfig": load("packages/aihappey-clients/src/shared/providerRequestConfig.ts"),
        "../shared/response-parsers": { extractResponsesText: () => "" },
    });
    const request = responsesEndpoint.buildRequest({
        model: "gpt-5.6", messages: [], providerMetadata: { openai: form.config() },
        providerRequestConfig: form.config(), endpointConfig: { prompt_cache_retention: "24h" },
    });
    assert.deepEqual(request.body.prompt_cache_options, { mode: "implicit", ttl: "12h" });
    assert.equal(request.body.prompt_cache_retention, "24h");
    assert.equal(request.body.ttl, undefined);
});
