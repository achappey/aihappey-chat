const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");

function load(filename, mocks) {
    const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "..", filename), "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

function findAll(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate))];
}

function setup(overrides = {}) {
    const state = {
        chatMode: "agent", selectedModel: "mistral/chat", providerMetadata: {}, providerHeaders: {},
        models: [{ id: "mistral/chat", context_window: 100 }, { id: "google/live", context_window: 2000, max_tokens: 300 }],
        setProviderMetadata() {}, setProviderHeaders() {},
    };
    const attachments = { resources: [], files: [], urls: [] };
    const sent = [], muted = [], camera = [], menuOptions = [];
    let started = 0, stopped = 0, inputOptions, value = "", tree;
    const { RealtimeInput } = load("packages/aihappey-core/src/features/realtime/RealtimeInput.tsx", {
        "react/jsx-runtime": require("react/jsx-runtime"),
        "aihappey-components": {
            BrrrBadge: "BrrrBadge", ContextProgressBar: "ContextProgressBar", FileTags: "FileTags", ResourceTags: "ResourceTags",
            useTheme: () => ({ Button: "Button", Tags: "Tags", TextArea: "TextArea", Spinner: "Spinner" }),
        },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "aihappey-state": { useAppStore: selector => selector(state) },
        "../../runtime/files/fileAttachmentRuntime": { fileAttachmentRuntime: {}, useFileAttachments: () => attachments.files },
        "../../runtime/mcp/mcpResourceRuntime": { mcpResourceRuntime: {}, useSelectedResources: () => attachments.resources },
        "../../runtime/files/urlAttachmentRuntime": { urlAttachmentRuntime: {}, useUrlAttachments: () => attachments.urls },
        "../attachments/UrlAttachmentTags": { UrlAttachmentTags: "UrlAttachmentTags" },
        "../chat/input/system-message/SystemMessageButton": { SystemMessageButton: "SystemMessageButton" },
        "../chat-settings/ChatSettingsButton": { ChatSettingsButton: "ChatSettingsButton" },
        "../chat/input/useChatInputMenu": { useChatInputMenu: options => {
            menuOptions.push(options);
            return { controls: React.createElement("SharedControls"), resourceLoading: false };
        } },
        "../chat/input/useMessageInput": { useMessageInput: options => {
            inputOptions = options;
            return { value, serverTags: [], resetChatSettings() {} };
        } },
    });
    const props = {
        model: "google/live", onSend: async content => sent.push(content), onStart: async () => { started++; },
        onStop: () => { stopped++; }, onMuteChange: next => muted.push(next), onCameraChange: next => camera.push(next),
        ...overrides,
    };
    const render = () => { tree = RealtimeInput(props); return tree; };
    const all = type => findAll(tree, node => node.type === type);
    const one = type => { const items = all(type); assert.equal(items.length, 1, type); return items[0]; };
    const button = icon => all("Button").find(node => node.props.icon === icon);
    render();
    return {
        props, state, attachments, sent, muted, camera, menuOptions, render, all, one, button,
        setValue: next => { value = next; render(); }, send: content => inputOptions.onSend(content),
        get started() { return started; }, get stopped() { return stopped; },
    };
}

test("realtime composer uses shared plus controls and normal settings with the explicit realtime model", () => {
    const h = setup({ tokenUsage: 10 });
    h.one("SharedControls");
    const settings = h.one("ChatSettingsButton");
    assert.equal(settings.props.realtimeModel, "google/live");
    assert.equal(settings.props.providerMetadata, h.state.providerMetadata);
    assert.equal(h.menuOptions.at(-1).mode, "realtime");
    assert.equal(h.one("ContextProgressBar").props.context_window, 2000);
    assert.equal(h.one("ContextProgressBar").props.max_output_tokens, 300);
    h.props.model = "openai/realtime";
    h.render();
    assert.equal(h.one("ChatSettingsButton").props.realtimeModel, "openai/realtime");
});

test("realtime starts empty but sends attachment-only messages both before and after connecting", async () => {
    const h = setup();
    await h.send("");
    assert.equal(h.started, 1);
    for (const connected of [false, true]) {
        h.props.connected = connected;
        for (const kind of ["resources", "files", "urls"]) {
            h.attachments[kind] = [{ name: "attachment" }];
            h.render();
            assert.notEqual(h.button(connected ? "send" : "realtime").props.disabled, true);
            await h.send("");
            h.attachments[kind] = [];
        }
    }
    assert.deepEqual(h.sent, ["", "", "", "", "", ""]);
    assert.equal(h.started, 1);
    h.render();
    assert.equal(h.button("send").props.disabled, true);
    await h.send("");
    assert.equal(h.started, 1);
    h.setValue("hello");
    await h.send("hello");
    assert.equal(h.sent.at(-1), "hello");
});

test("realtime attachment tags include URLs and busy/disabled input cannot submit", async () => {
    const h = setup();
    h.attachments.urls = [{ url: "https://example.com/image.png" }];
    h.render();
    assert.equal(h.one("UrlAttachmentTags").props.attachments, h.attachments.urls);
    for (const key of ["disabled", "busy"]) {
        h.props[key] = true;
        h.render();
        assert.equal(h.one("TextArea").props.readOnly, true);
        assert.equal(h.button("realtime").props.disabled, true);
        assert.equal(h.menuOptions.at(-1).disabled, true);
        await h.send("hello");
        h.props[key] = false;
    }
    assert.deepEqual(h.sent, []);
    assert.equal(h.started, 0);
});

test("realtime preserves microphone, camera, stop controls and audio-only restrictions while exposing settings", async () => {
    const h = setup({ connected: true, cameraSupported: true });
    h.button("transcription").props.onClick();
    h.button("video").props.onClick();
    h.button("stop").props.onClick();
    assert.deepEqual(h.muted, [true]);
    assert.deepEqual(h.camera, [true]);
    assert.equal(h.stopped, 1);
    h.props.audioOnly = true;
    h.props.model = "cartesia/agents/test";
    h.render();
    h.one("ChatSettingsButton");
    assert.equal(h.one("ChatSettingsButton").props.realtimeModel, "cartesia/agents/test");
    for (const type of ["TextArea", "SharedControls", "SystemMessageButton"]) assert.equal(h.all(type).length, 0);
    assert.equal(h.button("send"), undefined);
    assert.equal(h.menuOptions.at(-1).disabled, true);
    await h.send("not supported");
    assert.deepEqual(h.sent, []);
});

test("both realtime pages explicitly pass their own selected/effective model to the input", () => {
    const filename = "packages/aihappey-core/src/features/realtime/RealtimePage.tsx";
    const source = ts.createSourceFile(filename, fs.readFileSync(path.resolve(__dirname, "..", filename), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const models = [];
    function visit(node) {
        if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "RealtimeInput") {
            models.push(node.attributes.properties.find(attribute => attribute.name?.getText(source) === "model").initializer.expression.getText(source));
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.deepEqual(models, ['customAgents ? getPrimaryAgentModel(selectedRealtimeAgent?.localAgent ?? selectedRealtimeAgent?.remoteAgentModel?.agent)?.id ?? "" : model', "effectiveModel"]);
});

test("disabled auto-prompt execution does not consume pending prompts for audio-only realtime", () => {
    let reads = 0;
    const previous = global.localStorage;
    global.localStorage = { getItem() { reads++; return null; } };
    try {
        const { useAutoPromptExecution } = load("packages/aihappey-core/src/features/mcp-prompts/useAutoPromptExecution.ts", {
            react: { useState: () => [false, () => {}], useEffect: callback => callback() },
            "aihappey-state": { useAppStore: selector => selector({ mcpServerContent: {}, mcpServers: {} }) },
            "../../runtime/mcp/mcpPrompts": {},
        });
        useAutoPromptExecution({ enabled: false });
        assert.equal(reads, 0);
        useAutoPromptExecution({ enabled: true });
        assert.equal(reads, 2);
    } finally {
        global.localStorage = previous;
    }
});
