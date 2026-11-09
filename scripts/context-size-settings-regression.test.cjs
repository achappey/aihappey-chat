const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { createStore } = require("zustand/vanilla");
const { persist } = require("zustand/middleware");

const root = path.resolve(__dirname, "..");
const read = filename => fs.readFileSync(path.join(root, filename), "utf8").replace(/^\uFEFF/, "");
const jsx = (type, props) => ({ type, props });
function load(filename, mocks = {}) {
    const output = ts.transpileModule(read(filename), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id === "react/jsx-runtime") return { jsx, jsxs: jsx };
        assert.ok(id in mocks, `Unexpected import ${id}`);
        return mocks[id];
    }, module, module.exports);
    return module.exports;
}
function nodes(tree) {
    if (Array.isArray(tree)) return tree.flatMap(nodes);
    return tree && typeof tree === "object" ? [tree, ...nodes(tree.props?.children)] : [];
}

const modelPreferences = load("packages/aihappey-state/src/slices/modelPreferences.ts");
const ui = load("packages/aihappey-state/src/slices/uiSlice.ts", {
    "aihappey-mcp": {}, "./modelPreferences": modelPreferences,
});
test("context size defaults on for fresh and existing users and persists both explicit choices", () => {
    let options;
    const { withPersist } = load("packages/aihappey-state/src/persist.ts", {
        "zustand/middleware": { persist: (creator, value) => { options = value; return creator; } },
        "./slices/modelPreferences": modelPreferences,
        "./slices/chatSlice": {}, "./slices/chatEndpoint": {}, "./slices/uiSlice": ui,
        "./slices/apiKeyEncryption": {}, "./slices/providerHeaders": {},
        "./slices/defaultProviderTranscriptionMetadata": { normalizeProviderTranscriptionMetadata: value => value },
        "./slices/providerMetadataAliases": load("packages/aihappey-state/src/slices/providerMetadataAliases.ts"),
    });
    withPersist(ui.createUiSlice);
    let stored;
    const storage = {
        getItem: () => stored,
        setItem: (_, value) => { stored = JSON.parse(JSON.stringify(value)); },
        removeItem: () => { stored = undefined; },
    };
    const makeStore = () => createStore(persist(ui.createUiSlice, { ...options, storage }));
    const store = makeStore();
    assert.equal(store.getState().showContextSize, true);
    store.getState().setShowContextSize(false);
    assert.equal(stored.state.showContextSize, false);
    assert.equal(makeStore().getState().showContextSize, false);
    assert.equal(store.getState().showMessageMetrics, false);
    store.getState().setShowContextSize(true);
    assert.equal(makeStore().getState().showContextSize, true);
    stored = { state: { showMessageTokens: true, showMessageMetrics: true }, version: options.version };
    const legacy = makeStore().getState();
    assert.equal(legacy.showContextSize, true);
    assert.equal(legacy.showMessageTokens, true);
    assert.equal(legacy.showMessageMetrics, true);
});

const theme = Object.fromEntries(["Button", "Tags", "TextArea", "Spinner", "Modal", "Select", "Switch", "Slider", "Input", "Card", "Tabs", "Tab"]
    .map(name => [name, name]));
let state;
let files = [];
let resources = [];
let servers = [];
const empty = () => null;
const shared = {
    react: { useMemo: fn => fn(), useState: value => [value, empty] },
    "aihappey-state": { useAppStore: selector => selector(state) },
    "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
    "aihappey-components": { useTheme: () => theme, useMultiTheme: empty, ContextProgressBar: "context", CostBadge: "cost", BrrrBadge: "approval", FileTags: "files", ResourceTags: "resources" },
};
const useMessageInput = () => ({ value: "", textareaRef: {}, serverTags: servers, canSend: true });
const inputMenu = { useChatInputMenu: () => ({ resourceLoading: false }) };
const fileRuntime = { useFileAttachments: () => files };
const resourceRuntime = { useSelectedResources: () => resources };
const urlRuntime = { useUrlAttachments: () => [], urlAttachmentRuntime: {} };
const { MessageInput } = load("packages/aihappey-core/src/features/chat/input/MessageInput.tsx", {
    ...shared,
    "./useChatInputMenu": inputMenu, "./useMessageInput": { useMessageInput },
    "../../agent-settings/AgentSettingsButton": { AgentSettingsButton: "agent-settings" },
    "../../chat-settings/ChatSettingsButton": { ChatSettingsButton: "chat-settings" },
    "./system-message/SystemMessageButton": { SystemMessageButton: "system" },
    "../../../runtime/mcp/mcpResourceRuntime": resourceRuntime,
    "../../../runtime/files/fileAttachmentRuntime": fileRuntime,
    "../../../runtime/files/urlAttachmentRuntime": urlRuntime,
    "../../attachments/UrlAttachmentTags": { UrlAttachmentTags: "urls" },
    "../../agents/agentSelection": { resolveSelectedAgentEntries: () => [] },
    "aihappey-tools": { useLocalTools: () => ({ items: [] }) },
    "aihappey-skills": { useSkills: () => ({ items: [] }) },
    "aihappey-plugins": { usePlugins: () => ({ items: [] }) },
    "../../skills/connectedMcpSkills": { connectedMcpSkills: () => [] },
    "../../tools/toolCatalogItems": { buildLocalToolToggleItems: () => [], usePluginToggleItems: () => [] },
    "./ResizableTextArea": { ResizableTextArea: "textarea" },
    "./usePromptDictationControls": { usePromptDictationControls: () => ({}) },
});
const { RealtimeInput } = load("packages/aihappey-core/src/features/realtime/RealtimeInput.tsx", {
    ...shared,
    "../../runtime/files/fileAttachmentRuntime": fileRuntime,
    "../../runtime/mcp/mcpResourceRuntime": resourceRuntime,
    "../../runtime/files/urlAttachmentRuntime": urlRuntime,
    "../attachments/UrlAttachmentTags": { UrlAttachmentTags: "urls" },
    "../chat/input/system-message/SystemMessageButton": { SystemMessageButton: "system" },
    "../chat/input/useChatInputMenu": inputMenu,
    "../chat/input/useMessageInput": { useMessageInput },
    "../chat-settings/ChatSettingsButton": { ChatSettingsButton: "chat-settings" },
});
for (const [name, Composer] of [["chat", MessageInput], ["realtime", RealtimeInput]]) {
    test(`${name}: disabling context size hides the whole indicator without an empty metadata row`, () => {
        state = { ...createStore(ui.createUiSlice).getState(), models: [{ id: "fixture", context_window: 10000, max_tokens: 1000 }], selectedModel: "fixture", chatMode: "chat" };
        files = []; resources = []; servers = [];
        const props = { model: "fixture", tokenUsage: 2500 };
        const render = () => Composer(props);
        const bar = nodes(render()).find(node => node.type === "context");
        assert.equal(bar.props.tokenUsage, 2500);
        assert.equal(bar.props.context_window, 10000);
        state.showContextSize = false;
        assert.equal(nodes(render()).some(node => node.type === "context"), false);
        assert.equal(render().props.children[0], undefined);
        state.approveAll = true;
        assert.ok(nodes(render()).some(node => node.type === "approval"));
        files = [{ name: "fixture.txt" }];
        assert.ok(nodes(render()).some(node => node.type === "files"));
        resources = [{ uri: "fixture://resource" }];
        servers = [{ key: "fixture", label: "Fixture server" }];
        assert.ok(nodes(render()).some(node => node.type === "resources"));
        assert.ok(nodes(render()).some(node => node.type === "Tags"));
        if (name === "chat") {
            props.conversationCost = 0.2;
            assert.equal(nodes(render()).find(node => node.type === "cost").props.cost, 0.2);
        }
        state.showContextSize = true;
        assert.equal(nodes(render()).find(node => node.type === "context").props.tokenUsage, 2500);
        if (name === "realtime") {
            props.audioOnly = true;
            assert.equal(nodes(render()).some(node => node.type === "context"), false);
        }
    });
}

test("Chat settings places the default-on context toggle directly between provider logo and metrics", () => {
    const { SettingsModal } = load("packages/aihappey-core/src/features/user-settings/SettingsModal.tsx", {
        ...shared,
        "./ModelContextSettings": { ModelContextSettings: "model-context" },
        "./GeneralSettings": { GeneralSettings: "general" },
        "./AiDefaultSettings": { AiDefaultSettings: "ai-defaults" },
        "../chat/context/ChatContext": { useChatContext: () => ({ config: {} }) },
        "./StorageSettings": { StorageSettings: "storage" },
        "./AppsSettings": { AppsSettings: "apps" },
        "../chat-settings/SideInferenceAgentsTab": { SideInferenceAgentsTab: "side-agents" },
        "../provider-credentials/ProviderKeysModal": { ProviderKeysModal: "keys" },
        "./export/ExportSettings": { ExportSettings: "export" },
        "../../shell/connectors/CloudStorageAvailability": { useCloudStorageAvailable: () => false },
    });
    const store = createStore(ui.createUiSlice);
    state = { ...store.getState(), toolOutputContentSettings: {} };
    const render = () => SettingsModal({ open: true, onClose: empty });
    const switches = nodes(render()).filter(node => node.type === "Switch");
    const ids = switches.map(node => node.props.id);
    const index = ids.indexOf("provider-logo-toggle");
    assert.deepEqual(ids.slice(index, index + 3), ["provider-logo-toggle", "context-size-toggle", "metrics-toggle"]);
    const context = switches[index + 1];
    assert.equal(context.props.checked, true);
    assert.equal(context.props.label, "settingsModal.showContextSize");
    context.props.onChange(false);
    state = { ...store.getState(), toolOutputContentSettings: {} };
    assert.equal(nodes(render()).find(node => node.props.id === "context-size-toggle").props.checked, false);
});

test("every browser locale has a localized context size label", () => {
    const directory = path.join(root, "packages/aihappey-i18n/src/locales");
    for (const locale of fs.readdirSync(directory)) {
        const filename = path.join(directory, locale, `${locale}.json`);
        if (!fs.existsSync(filename)) continue;
        const json = JSON.parse(fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, ""));
        assert.ok(json.settingsModal.showContextSize?.trim(), locale);
    }
    assert.equal(JSON.parse(read("packages/aihappey-i18n/src/locales/en/en.json")).settingsModal.showContextSize, "Show context size");
    assert.equal(JSON.parse(read("packages/aihappey-i18n/src/locales/nl/nl.json")).settingsModal.showContextSize, "Toon contextgrootte");
});
