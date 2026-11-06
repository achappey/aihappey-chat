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
    const admitted = [], addedUrls = [], executedPrompts = [], promptRequests = [], serverUpdates = [], resourceReads = [], addedResources = [];
    const state = {
        chatMode, mcpServerContent: {}, mcpServers: {}, models: [], agents: [], remoteAgentModels: [],
        selectedAgentNames: [], mcpSkills: [],
        activePlugins: [], enabledAgentPluginIds: [], enabledLocalTools: [], enabledSkillIds: [],
        setActivePlugins: ids => { state.activePlugins = ids; },
        setEnabledAgentPluginIds: ids => { state.enabledAgentPluginIds = ids; },
        setEnabledLocalTools: ids => { state.enabledLocalTools = ids; },
        setEnabledSkillIds: ids => { state.enabledSkillIds = ids; },
        updateMcpServers: updates => serverUpdates.push(updates),
    };
    const localTools = { items: [] }, skills = { items: [] }, agentPlugins = { items: [], enabled: [] };
    const pluginToggleItems = [];
    const messageInput = {
        value: "", serverTags: [], canSend: true,
        disconnectServer: async id => {
            serverUpdates.push(id);
            messageInput.serverTags = messageInput.serverTags.filter(tag => tag.key !== id);
        },
    };
    const resourceSelect = { hasResources: false, resources: [], resourceTemplates: [], open: false };
    resourceSelect.setOpen = value => { resourceSelect.open = value; };
    resourceSelect.resolve = uri => ({ serverKey: "docs", resource: { uri, name: "Documentation" } });
    resourceSelect.resolveTemplate = uriTemplate => ({ serverKey: "docs", resourceTemplate: { uriTemplate, name: "Template" } });
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
        "aihappey-tools": { useLocalTools: () => localTools },
        "aihappey-skills": { useSkills: () => skills },
        "aihappey-plugins": { usePlugins: () => agentPlugins },
        "./useMessageInput": { useMessageInput: () => messageInput },
        "./useResourceSelect": { useResourceSelect: () => resourceSelect },
        "./useChatAttachmentAdmission": { useChatAttachmentAdmission: () => files => admitted.push(files) },
        "./usePromptDictationControls": { usePromptDictationControls: () => ({}) },
        "../../agents/agentSelection": { resolveSelectedAgentEntries: () => [] },
        "../../mcp-prompts/useAutoPromptExecution": { useAutoPromptExecution() {} },
        "../../../runtime/mcp/mcpResourceRuntime": {
            useSelectedResources: () => [], mcpResourceRuntime: { add: (...args) => addedResources.push(args) },
        },
        "../../../runtime/files/fileAttachmentRuntime": { useFileAttachments: () => [] },
        "../../../runtime/files/urlAttachmentRuntime": {
            useUrlAttachments: () => [], urlAttachmentRuntime: { add: url => addedUrls.push(url) },
        },
        "../../../runtime/mcp/mcpPrompts": {
            getPrompts: async server => { promptRequests.push(server); return [{ name: "summarize" }]; },
        },
        "../../tools/toolCatalogItems": {
            buildLocalToolToggleItems: items => items.map(item => ({ id: item.id, label: item.name })),
            usePluginToggleItems: () => pluginToggleItems,
        },
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
    mocks["../../../runtime/mcp/readResource"] = { readResource: async (server, uri) => {
        resourceReads.push([server, uri]);
        return { contents: [{ uri, text: "Resource content" }] };
    } };
    mocks["./resourceTemplateUri"] = {
        extractTemplateParams: uri => [...uri.matchAll(/\{(\w+)\}/g)].map(match => match[1]),
        applyTemplateParams: (uri, args) => uri.replace(/\{(\w+)\}/g, (_, key) => args[key]),
    };
    mocks["../../skills/connectedMcpSkills"] = {
        connectedMcpSkills: () => [], disconnectedSkillLabel: id => `Unavailable: ${id}`,
    };
    const menuFilename = "packages/aihappey-core/src/features/chat/input/useChatInputMenu.tsx";
    const menuOutput = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, "..", menuFilename), "utf8"), {
        fileName: menuFilename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const menuModule = { exports: {} };
    new Function("require", "module", "exports", menuOutput)(id => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked menu import ${id}`);
    }, menuModule, menuModule.exports);
    mocks["./useChatInputMenu"] = menuModule.exports;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    const props = { onSend() {}, onPromptExecute: async (...args) => executedPrompts.push(args) };
    let tree;
    const render = overrides => {
        index = 0;
        tree = chatMode === "realtime"
            ? menuModule.exports.useChatInputMenu({ ...props, ...overrides, mode: "realtime" }).controls
            : module.exports.MessageInput({ ...props, ...overrides });
        return tree;
    };
    const all = type => findAll(tree, node => node.type === type);
    const one = type => { const nodes = all(type); assert.equal(nodes.length, 1, type); return nodes[0]; };
    const item = key => one("Menu").props.items.find(item => item.key === key);
    render();
    return { render, all, one, item, state, resourceSelect, admitted, addedUrls, executedPrompts, promptRequests, serverUpdates, resourceReads, addedResources,
        localTools, skills, agentPlugins, pluginToggleItems, messageInput };
}

for (const mode of ["chat", "agent"]) {
    test(`${mode} composer shows supported tool-source badges and removes only the chosen shared selection`, async () => {
        const h = setup(mode);
        h.pluginToggleItems.push({ id: "history", label: "Chat history" });
        h.localTools.items = [{ id: "local-one", name: "Local lookup" }];
        h.skills.items = [{ skillId: "selected-skill", name: "Selected skill" }];
        h.agentPlugins.items = [{ id: "mcp-package", name: "MCP package" }, { id: "skill-package", name: "Skill package" }];
        h.agentPlugins.enabled = [
            { id: "mcp-package", mcpServers: [{ key: "plugin-server" }] },
            { id: "skill-package", mcpServers: [] },
        ];
        h.state.activePlugins = ["history", "unknown-plugin"];
        h.state.enabledLocalTools = ["local-one", "missing-local"];
        h.state.enabledAgentPluginIds = ["mcp-package", "skill-package", "missing-package"];
        h.state.enabledSkillIds = ["selected-skill", "missing-skill"];
        h.messageInput.serverTags = [{ key: "docs", label: "Documentation", icon: "mcpServer" }];
        h.render();
        const toolTags = () => h.all("Tags").find(node => node.props.items.some(tag => tag.key.startsWith("plugin:")));
        const tags = toolTags().props.items;
        assert.deepEqual(tags.filter(tag => tag.key.startsWith("plugin:")), [
            { key: "plugin:history", label: "Chat history", icon: "tool" },
            { key: "plugin:unknown-plugin", label: "unknown-plugin", icon: "tool" },
        ]);
        assert.deepEqual(tags.filter(tag => tag.key.startsWith("local:")), [
            { key: "local:local-one", label: "Local lookup", icon: "tool" },
            { key: "local:missing-local", label: "missing-local", icon: "tool" },
        ]);
        assert.deepEqual(tags.filter(tag => tag.key.startsWith("agent-plugin:")).map(tag => [tag.key, tag.label]), mode === "chat"
            ? [["agent-plugin:mcp-package", "MCP package"], ["agent-plugin:skill-package", "Skill package"], ["agent-plugin:missing-package", "missing-package"]]
            : [["agent-plugin:mcp-package", "MCP package"]]);
        assert.deepEqual(tags.filter(tag => tag.key.startsWith("skill:")).map(tag => tag.label), mode === "chat"
            ? ["Selected skill", "Unavailable: missing-skill"] : []);

        toolTags().props.onRemove("local:local-one"); h.render();
        assert.deepEqual(h.state.enabledLocalTools, ["missing-local"]);
        toolTags().props.onRemove("agent-plugin:mcp-package"); h.render();
        assert.deepEqual(h.state.enabledAgentPluginIds, ["skill-package", "missing-package"]);
        toolTags().props.onRemove("plugin:history"); h.render();
        assert.deepEqual(h.state.activePlugins, ["unknown-plugin"]);
        assert.deepEqual(h.state.enabledSkillIds, ["selected-skill", "missing-skill"]);
        assert.equal(toolTags().props.items.some(tag => ["local:local-one", "agent-plugin:mcp-package", "plugin:history"].includes(tag.key)), false);

        const servers = h.all("Tags").find(node => node.props.items.some(tag => tag.key === "docs"));
        await servers.props.onRemove("docs"); h.render();
        assert.deepEqual(h.serverUpdates, ["docs"]);
        assert.equal(h.all("Tags").some(node => node.props.items.some(tag => tag.key === "docs")), false);

        h.state.chatMode = mode === "chat" ? "agent" : "chat"; h.render();
        assert.equal(toolTags().props.items.some(tag => ["local:local-one", "agent-plugin:mcp-package", "plugin:history"].includes(tag.key)), false);
        assert.deepEqual(h.state.enabledSkillIds, ["selected-skill", "missing-skill"]);
    });
}

test("agent composer updates package badges when supported MCP sources load or disappear, without showing skill-only packages", () => {
    const h = setup();
    h.state.enabledAgentPluginIds = ["package"];
    h.agentPlugins.items = [{ id: "package", name: "Package" }];
    h.render();
    assert.equal(h.all("Tags").length, 0);
    h.agentPlugins.enabled = [{ id: "package", mcpServers: [{ key: "server" }] }]; h.render();
    assert.deepEqual(h.one("Tags").props.items, [{ key: "agent-plugin:package", label: "Package", icon: "plugins" }]);
    h.agentPlugins.enabled = [{ id: "package", mcpServers: [] }]; h.render();
    assert.equal(h.all("Tags").length, 0);
    assert.deepEqual(h.state.enabledAgentPluginIds, ["package"]);
});

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

test("realtime reuses the full normal chat plus menu independent of the stored chat mode", () => {
    const h = setup("realtime");
    assert.deepEqual(h.one("Menu").props.items.map(item => item.key), ["search-context", "select-file", "add-url", "prompts", "resources", "model-context"]);
    assert.equal(h.one("Menu").props.trigger.props.icon, "add");
    assert.equal(h.one("Menu").props.direction, "top");
    h.one("ContextSearchModal");
    h.one("ResourceSelectModal");
    h.one("ResourceTemplateArgumentsModal");
    h.render({ disabled: true });
    assert.equal(h.one("Menu").props.trigger.props.disabled, true);
});

for (const mode of ["chat", "realtime"]) {
    test(`${mode} menu preserves resources, resource templates, and template argument cancellation`, async () => {
        const h = setup(mode);
        h.resourceSelect.hasResources = true;
        h.render();
        h.item("resources").onClick();
        h.render();
        assert.equal(h.one("ResourceSelectModal").props.open, true);
        await h.one("ResourceSelectModal").props.onSelect("docs://intro");
        h.render();
        assert.equal(h.one("ResourceSelectModal").props.open, false);
        assert.deepEqual(h.resourceReads, [["docs", "docs://intro"]]);
        assert.equal(h.addedResources[0][0].name, "Documentation");
        await h.one("ResourceSelectModal").props.onSelectTemplate("docs://static");
        assert.equal(h.addedResources[1][0].uri, "docs://static");
        await h.one("ResourceSelectModal").props.onSelectTemplate("docs://{topic}");
        h.render();
        assert.equal(h.one("ResourceTemplateArgumentsModal").props.open, true);
        h.one("ResourceTemplateArgumentsModal").props.onHide();
        h.render();
        assert.equal(h.one("ResourceTemplateArgumentsModal").props.open, false);
        assert.equal(h.one("ResourceSelectModal").props.open, true);
        await h.one("ResourceSelectModal").props.onSelectTemplate("docs://{topic}");
        h.render();
        await h.one("ResourceTemplateArgumentsModal").props.onExecute({ topic: "testing" });
        h.render();
        assert.equal(h.addedResources[2][0].uri, "docs://testing");
        assert.equal(h.addedResources[2][0].name, "Template");
        assert.deepEqual(h.resourceReads.at(-1), ["docs", "docs://testing"]);
    });
}

for (const mode of ["agent", "chat", "realtime"]) {
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
