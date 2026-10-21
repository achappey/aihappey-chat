const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");

const filename = "packages/aihappey-core/src/features/chat/input/MessageInput.tsx";
const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "..", filename), "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

function findAll(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate)),
    ];
}

function setup(chatMode = "agent") {
    const slots = [];
    let index = 0;
    const admitted = [], addedUrls = [], executedPrompts = [], promptRequests = [], serverUpdates = [];
    const state = {
        chatMode, mcpServerContent: {}, mcpServers: {}, models: [], agents: [], remoteAgentModels: [],
        selectedAgentNames: [], mcpSkills: [],
        updateMcpServers: updates => serverUpdates.push(updates),
    };
    const resourceSelect = { hasResources: false, resources: [], resourceTemplates: [], open: false };
    const useSlot = initial => {
        const i = index++;
        if (!(i in slots)) slots[i] = initial;
        return [slots[i], value => { slots[i] = value; }];
    };
    const components = Object.fromEntries([
        "BrrrBadge", "ContextProgressBar", "CostBadge", "FileTags", "ResourceSelectModal", "ResourceTags",
    ].map(name => [name, name]));
    const mocks = {
        react: { ...React, useMemo: fn => fn(), useState: useSlot, useRef: initial => useSlot({ current: initial })[0] },
        "react/jsx-runtime": require("react/jsx-runtime"),
        "aihappey-components": {
            ...components,
            useTheme: () => ({ Button: "Button", Menu: "Menu", Tags: "Tags", TextArea: "TextArea", Spinner: "Spinner" }),
        },
        "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "aihappey-tools": { useLocalTools: () => ({ items: [] }) },
        "aihappey-skills": { useSkills: () => ({ items: [] }) },
        "aihappey-plugins": { usePlugins: () => ({ items: [] }) },
        "./useMessageInput": { useMessageInput: () => ({ value: "", serverTags: [], canSend: true }) },
        "./useResourceSelect": { useResourceSelect: () => resourceSelect },
        "./useChatAttachmentAdmission": { useChatAttachmentAdmission: () => files => admitted.push(files) },
        "./usePromptDictationControls": { usePromptDictationControls: () => ({}) },
        "../../agents/agentSelection": { resolveSelectedAgentEntries: () => [] },
        "../../mcp-prompts/useAutoPromptExecution": { useAutoPromptExecution() {} },
        "../../../runtime/mcp/mcpResourceRuntime": { useSelectedResources: () => [] },
        "../../../runtime/files/fileAttachmentRuntime": { useFileAttachments: () => [] },
        "../../../runtime/files/urlAttachmentRuntime": {
            useUrlAttachments: () => [], urlAttachmentRuntime: { add: url => addedUrls.push(url) },
        },
        "../../../runtime/mcp/mcpPrompts": {
            getPrompts: async server => { promptRequests.push(server); return [{ name: "summarize" }]; },
        },
        "../../tools/toolCatalogItems": { buildLocalToolToggleItems: () => [], usePluginToggleItems: () => [] },
    };
    for (const name of [
        "AgentSettingsButton", "ChatSettingsButton", "SystemMessageButton", "ServerManagementModal",
        "PromptSelectModal", "PromptArgumentsModal", "ResourceTemplateArgumentsModal", "ContextSearchModal",
        "ResizableTextArea", "UrlAttachmentModal", "UrlAttachmentTags",
    ]) {
        const modules = {
            AgentSettingsButton: "../../agent-settings/AgentSettingsButton",
            ChatSettingsButton: "../../chat-settings/ChatSettingsButton",
            SystemMessageButton: "./system-message/SystemMessageButton",
            ServerManagementModal: "../../mcp-servers/ServerManagementModal",
            PromptSelectModal: "../../mcp-prompts/PromptSelectModal",
            PromptArgumentsModal: "../../mcp-prompts/PromptArgumentsModal",
            ContextSearchModal: "./context-search/ContextSearchModal",
            UrlAttachmentModal: "../../attachments/UrlAttachmentModal",
            UrlAttachmentTags: "../../attachments/UrlAttachmentTags",
        };
        mocks[modules[name] ?? `./${name}`] = { [name]: name };
    }
    // These helpers are only used after resource selection, which remains chat-only.
    mocks["../../../runtime/mcp/readResource"] = {};
    mocks["./resourceTemplateUri"] = {};
    mocks["../../skills/connectedMcpSkills"] = { connectedMcpSkills: () => [] };
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    const props = { onSend() {}, onPromptExecute: async (...args) => executedPrompts.push(args) };
    let tree;
    const render = overrides => {
        index = 0;
        tree = module.exports.MessageInput({ ...props, ...overrides });
        return tree;
    };
    const all = type => findAll(tree, node => node.type === type);
    const one = type => { const nodes = all(type); assert.equal(nodes.length, 1, type); return nodes[0]; };
    const item = key => one("Menu").props.items.find(item => item.key === key);
    render();
    return { render, all, one, item, state, resourceSelect, admitted, addedUrls, executedPrompts, promptRequests, serverUpdates };
}

test("agent composer exposes only the four requested actions and preserves agent settings", () => {
    const h = setup();
    assert.deepEqual(h.one("Menu").props.items.map(item => item.key), ["select-file", "add-url", "prompts", "model-context"]);
    assert.equal(h.one("Menu").props.trigger.props.icon, "add");
    assert.equal(h.one("Menu").props.trigger.props.type, "button");
    assert.equal(h.one("Menu").props.align, "left");
    assert.equal(h.one("Menu").props.direction, "top");
    h.one("AgentSettingsButton");
    for (const type of ["ChatSettingsButton", "SystemMessageButton", "ContextSearchModal", "ResourceSelectModal", "ResourceTemplateArgumentsModal"]) {
        assert.equal(h.all(type).length, 0, type);
    }
    h.render({ disabled: true });
    assert.equal(h.one("Menu").props.trigger.props.disabled, true);
});

test("regular chat retains its full menu, dialogs, settings, and resource availability", () => {
    const h = setup("chat");
    assert.deepEqual(h.one("Menu").props.items.map(item => item.key), ["search-context", "select-file", "add-url", "prompts", "resources", "model-context"]);
    for (const type of ["ChatSettingsButton", "SystemMessageButton", "ContextSearchModal", "ResourceSelectModal", "ResourceTemplateArgumentsModal"]) h.one(type);
    assert.equal(h.all("AgentSettingsButton").length, 0);
    assert.equal(h.item("resources").disabled, true);
    h.resourceSelect.hasResources = true;
    h.render();
    assert.equal(h.item("resources").disabled, false);
    h.item("search-context").onClick();
    h.render();
    assert.equal(h.one("ContextSearchModal").props.open, true);
});

for (const mode of ["agent", "chat"]) {
    test(`${mode} menu reuses file admission, link attachments, and Model Context management`, () => {
        const h = setup(mode);
        const input = h.one("input");
        assert.equal(input.props.type, "file");
        assert.equal(input.props.multiple, true);
        assert.equal(input.props.hidden, true);
        let clicked = false;
        input.props.ref.current = { click: () => { clicked = true; } };
        h.item("select-file").onClick();
        assert.equal(clicked, true);
        const files = [{ name: "notes.txt" }];
        const event = { target: { files, value: "notes.txt" } };
        input.props.onChange(event);
        assert.deepEqual(h.admitted, [files]);
        assert.equal(event.target.value, "");
        h.item("add-url").onClick();
        h.render();
        assert.equal(h.one("UrlAttachmentModal").props.open, true);
        const url = { url: "https://example.com/report.pdf" };
        h.one("UrlAttachmentModal").props.onAdd(url);
        assert.deepEqual(h.addedUrls, [url]);
        h.one("UrlAttachmentModal").props.onHide();
        h.item("model-context").onClick();
        h.render();
        assert.equal(h.one("UrlAttachmentModal").props.open, false);
        assert.equal(h.one("ServerManagementModal").props.show, true);
        h.state.mcpServers = { docs: { config: { url: "https://example.com/mcp", disabled: true } } };
        h.render();
        h.one("ServerManagementModal").props.onHide(new Set(["docs"]));
        h.render();
        assert.equal(h.one("ServerManagementModal").props.show, false);
        assert.deepEqual(h.serverUpdates, [{ docs: { url: "https://example.com/mcp", disabled: false } }]);
    });

    test(`${mode} Prompts follows existing MCP capability availability and executes prompts with or without arguments`, async () => {
        const h = setup(mode);
        assert.equal(h.item("prompts").disabled, true);
        h.item("prompts").onClick();
        h.render();
        assert.equal(h.one("PromptSelectModal").props.open, false);
        assert.deepEqual(h.promptRequests, []);
        h.state.mcpServerContent = { docs: { capabilities: { prompts: {} } }, other: { capabilities: {} } };
        h.state.mcpServers = { docs: { registry: { server: { title: "Documentation" } }, config: { url: "https://example.com/mcp" } } };
        h.render();
        assert.equal(h.item("prompts").disabled, false);
        h.item("prompts").onClick();
        await new Promise(resolve => setImmediate(resolve));
        h.render();
        assert.equal(h.one("PromptSelectModal").props.open, true);
        assert.deepEqual(h.promptRequests, ["docs"]);
        const prompt = h.one("PromptSelectModal").props.prompts[0];
        assert.equal(prompt._serverName, "docs");
        await h.one("PromptSelectModal").props.onPromptClick(prompt);
        h.render();
        assert.equal(h.one("PromptSelectModal").props.open, false);
        assert.deepEqual(h.executedPrompts, [[prompt]]);
        const argumentPrompt = { ...prompt, arguments: [{ name: "topic", required: true }] };
        await h.one("PromptSelectModal").props.onPromptClick(argumentPrompt);
        h.render();
        assert.equal(h.one("PromptArgumentsModal").props.prompt, argumentPrompt);
        await h.one("PromptArgumentsModal").props.onPromptExecute(argumentPrompt, { topic: "testing" });
        h.render();
        assert.equal(h.all("PromptArgumentsModal").length, 0);
        assert.deepEqual(h.executedPrompts[1], [argumentPrompt, { topic: "testing" }]);
    });
}
