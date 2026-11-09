const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { createStore } = require("zustand/vanilla");
const { persist, createJSONStorage } = require("zustand/middleware");

const root = path.resolve(__dirname, "..");
function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(path.join(root, filename), "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

const slices = "packages/aihappey-state/src/slices/";
const chatEndpoint = load(slices + "chatEndpoint.ts");
const chatSlice = load(slices + "chatSlice.ts", {
    "./defaultProviderMetadata": { defaultProviderMetadata: {} },
    "./defaultProviderHeaders": { defaultProviderHeaders: {} },
    "./defaultProviderFileMetadata": { defaultProviderFileMetadata: {} },
    "./defaultAgents": load(slices + "defaultAgents.ts"),
    "./chatEndpoint": chatEndpoint,
});
const defaults = chatSlice.DEFAULT_TOOL_OUTPUT_CONTENT_SETTINGS;
const { mapToolOutputContentForRequest: map } = load("packages/aihappey-core/src/features/chat/engine/mapToolOutputContentForRequest.ts");
const message = content => [{
    id: "result", role: "assistant", parts: [{
        type: "tool-fixture", state: "output-available", toolCallId: "call", providerExecuted: false,
        output: { content, isError: false, structuredContent: { keep: "metadata" }, future: 7 },
    }],
}];
const blocks = messages => messages[0].parts[0].output.content;
const omitted = category => ({ type: "text", text: `${category} content omitted by user settings.` });
function freeze(value) {
    if (value && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}

test("resource links use only Links regardless of MIME, metadata, or other output switches", () => {
    for (const mime of [undefined, null, 7, "", "text/plain", "application/json", "image/png", "image/svg+xml", "audio/mpeg", "video/mp4", "application/pdf", "application/octet-stream", "model/gltf-binary"]) {
        const link = { type: "resource_link", uri: "https://files.example/image.png", name: "Generated image", description: "Result", size: 123,
            annotations: { audience: ["user", "assistant"] }, _meta: { keep: true }, ...(mime === undefined ? {} : { mimeType: mime }) };
        const messages = freeze(message([link]));
        const original = JSON.stringify(messages);
        for (const enabled of [true, false]) for (const others of [true, false]) {
            const settings = Object.fromEntries(Object.keys(defaults).map(key => [key, key === "links" ? enabled : others]));
            const result = map(messages, settings);
            assert.deepEqual(blocks(result), [enabled ? link : omitted("Link")], `${mime}: Links=${enabled}, other categories=${others}`);
            assert.equal(result[0].parts[0].output.structuredContent, messages[0].parts[0].output.structuredContent);
            assert.equal(result[0].parts[0].output.future, 7);
            if (enabled) assert.equal(result[0], messages[0]);
        }
        assert.equal(JSON.stringify(messages), original);
    }
});

test("mixed links and inline payloads retain independent controls and do not re-filter omission text", () => {
    const content = [
        { type: "text", text: "https://example.com/image.png" },
        { type: "resource_link", uri: "mcp://images/generated", name: "Image", mimeType: "image/png" },
        { type: "image", mimeType: "image/png", data: "image bytes" },
        { type: "audio", mimeType: "audio/wav", data: "audio bytes" },
        { type: "resource", resource: { uri: "mcp://video", mimeType: "video/mp4", blob: "video bytes" } },
        { type: "resource", resource: { uri: "mcp://document", mimeType: "application/pdf", blob: "document bytes" } },
        { type: "resource", resource: { uri: "mcp://text", mimeType: "text/plain", text: "embedded text" } },
    ];
    const messages = freeze(message(content));
    assert.deepEqual(blocks(map(messages, defaults)), [content[0], content[1], omitted("Image"), omitted("Audio"), omitted("Video"), omitted("Document"), content[6]]);
    assert.deepEqual(blocks(map(messages, { text: false, links: false, images: true, audio: true, video: true, documents: true })),
        [omitted("Text"), omitted("Link"), ...content.slice(2, 6), omitted("Text")]);
    assert.deepEqual(blocks(messages), content);
});

test("only client-executed MCP results are filtered; provider results, uploads, and unknown output remain untouched", () => {
    const content = [{ type: "resource_link", uri: "https://example.com/report.pdf", mimeType: "application/pdf" }];
    for (const marker of [undefined, true, null, "false", 0]) {
        const messages = message(content);
        if (marker === undefined) delete messages[0].parts[0].providerExecuted;
        else messages[0].parts[0].providerExecuted = marker;
        assert.equal(map(messages, { ...defaults, links: false })[0], messages[0]);
    }
    for (const output of [null, "plain output", [], { structuredContent: content }, { content: {} }]) {
        const messages = message([]);
        messages[0].parts[0].output = output;
        assert.equal(map(messages, { ...defaults, links: false })[0], messages[0]);
    }
    const uploaded = { id: "user", role: "user", parts: [{ type: "file", mediaType: "image/png", url: "data:image/png;base64,bytes" }] };
    assert.equal(map([uploaded], { ...defaults, links: false })[0], uploaded);
});

const { withPersist } = load("packages/aihappey-state/src/persist.ts", {
    "zustand/middleware": { persist: (_, options) => options },
    "./slices/modelPreferences": load("packages/aihappey-state/src/slices/modelPreferences.ts"),
    "./slices/chatSlice": chatSlice,
    "./slices/chatEndpoint": chatEndpoint,
    "./slices/uiSlice": { normalizeCustomProviders: value => value ?? {} },
    "./slices/apiKeyEncryption": { resolveApiKeyEncryptionStatus: () => "unconfigured" },
    "./slices/providerHeaders": { normalizeProviderHeaders: value => value ?? {} },
    "./slices/defaultProviderTranscriptionMetadata": { normalizeProviderTranscriptionMetadata: value => value ?? {} },
    "./slices/providerMetadataAliases": { normalizeSpaceXAiProviderMetadata: value => value ?? {} },
});
const options = withPersist(() => ({}));

test("defaults and state updates keep Links on independently of other categories", () => {
    assert.deepEqual(defaults, { text: true, links: true, images: false, audio: false, video: false, documents: false });
    const store = createStore(chatSlice.createChatSlice);
    const original = store.getState().toolOutputContentSettings;
    store.getState().setToolOutputContentSettings({ links: false });
    assert.deepEqual(store.getState().toolOutputContentSettings, { ...defaults, links: false });
    assert.equal(original.links, true);
    store.getState().setToolOutputContentSettings({ images: true });
    assert.equal(store.getState().toolOutputContentSettings.links, false);
    assert.equal(defaults.images, false);
});

test("real persisted-store hydration upgrades version 36 with Links on and saves explicit off across reloads", () => {
    assert.ok(options.version > 36, "the old schema must run migration rather than shallowly replace the new defaults");
    const legacy = { text: false, images: true, audio: true, video: false, documents: true };
    const saved = new Map([[options.name, JSON.stringify({ version: 36, state: { toolOutputContentSettings: legacy } })]]);
    const storage = createJSONStorage(() => ({
        getItem: key => saved.get(key) ?? null,
        setItem: (key, value) => saved.set(key, value),
        removeItem: key => saved.delete(key),
    }));
    const open = () => createStore(persist(chatSlice.createChatSlice, { ...options, storage }));
    const store = open();
    assert.equal(store.persist.hasHydrated(), true);
    assert.deepEqual(store.getState().toolOutputContentSettings, { ...legacy, links: true });
    store.getState().setToolOutputContentSettings({ links: false });
    assert.deepEqual(JSON.parse(saved.get(options.name)).state.toolOutputContentSettings, { ...legacy, links: false });
    const reopened = open();
    assert.equal(reopened.persist.hasHydrated(), true);
    assert.deepEqual(reopened.getState().toolOutputContentSettings, { ...legacy, links: false });
});

test("migration defaults missing or invalid Links on without overriding explicit booleans", () => {
    for (const settings of [undefined, null, [], {}, { links: null }, { links: "false" }, { text: false, images: true }]) {
        const migrated = options.migrate({ toolOutputContentSettings: settings }, 36);
        assert.equal(migrated.toolOutputContentSettings.links, true);
        if (settings?.text === false) assert.equal(migrated.toolOutputContentSettings.text, false);
        if (settings?.images === true) assert.equal(migrated.toolOutputContentSettings.images, true);
    }
    for (const links of [true, false]) assert.equal(options.migrate({ toolOutputContentSettings: { links } }, 36).toolOutputContentSettings.links, links);
});

test("every browser locale supplies a nonempty Links settings label", () => {
    const locales = path.join(root, "packages/aihappey-i18n/src/locales");
    for (const language of fs.readdirSync(locales)) {
        const file = path.join(locales, language, `${language}.json`);
        if (!fs.existsSync(file)) continue;
        const labels = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
        assert.equal(typeof labels.settingsModal.links, "string", language);
        assert.ok(labels.settingsModal.links.trim().length > 0, language);
    }
});
