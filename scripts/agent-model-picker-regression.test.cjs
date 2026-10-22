const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");

function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

const agentModels = load("packages/aihappey-types/src/agentModels.ts");
const modelIdentity = load("packages/aihappey-types/src/modelIdentity.ts");
const components = new Proxy({}, { get: (_, name) => name });
const providerMetadata = { defaults: true };
const catalog = [
    { id: "openai/first", name: "First answer", type: "language" },
    { id: "other/second", name: "Second answer", type: "language" },
    { id: "router/decision", name: "Router", type: "decision" },
    { id: "direct/model", name: "Direct", type: "language", route: "direct" },
    { id: "image/model", name: "Image", type: "image" },
];
const providers = { openai: { name: "OpenAI" }, other: { name: "Other" }, router: { name: "Router" }, disabled: { name: "Disabled" } };

function modelPicker(state, effects = []) {
    const react = { ...React, useMemo: factory => factory(), useEffect: effect => effects.push(effect) };
    const { ModelSelectField } = load("packages/aihappey-components/src/fields/ModelSelectField.tsx", {
        react, "aihappey-types": modelIdentity, "../theme/ThemeContext": { useTheme: () => components },
    });
    const { ModelSelect } = load("packages/aihappey-core/src/features/models/ModelSelect.tsx", {
        react, "aihappey-components": { ModelSelectField },
        "aihappey-state": { useAppStore: selector => selector(state), store: { setState() { throw new Error("Model picker must not change global routing state"); } } },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => providers },
        "../chat/engine/favoriteRouter": { SELECT_ALL_FAVORITE_MODELS: "__router__", favoriteRouterModel: () => undefined },
    });
    return { ModelSelect, render(props) { const field = ModelSelect(props); return field.type(field.props); } };
}

function find(node, predicate) {
    if (!React.isValidElement(node)) return undefined;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
        const match = find(child, predicate);
        if (match) return match;
    }
}

function harness(initialAgent = {}, models = catalog, settings = {}) {
    let agent = { name: "Example", description: "Example agent", instructions: "Help", ...initialAgent };
    const slots = [];
    let index = 0;
    const react = {
        useState(initial) {
            const slot = index++;
            if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
            return [slots[slot], value => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
        },
        useMemo: factory => factory(),
        useEffect() {},
    };
    const state = { models, agents: [], remoteAgentModels: [], mcpServerContent: {}, modelsLoaded: true,
        enabledProvidersByType: { language: ["OpenAI", "Other"], decision: ["Router"] }, favoriteModelsByType: {}, ...settings };
    const shared = modelPicker(state);
    const { AgentForm } = load("packages/aihappey-core/src/features/agents/AgentForm.tsx", {
        react,
        "aihappey-components": new Proxy({ useTheme: () => components }, { get: (target, name) => target[name] ?? name }),
        "aihappey-components/src/forms/providers/venice": components,
        "aihappey-types": agentModels,
        "../models/ModelSelect": shared,
        "aihappey-agents": {},
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "aihappey-state": {
            useAppStore: selector => selector(state),
            getAgentModelProviderKey: id => id?.split("/")[0] ?? "",
            resolveAgentModelProviderMetadata: () => providerMetadata,
        },
        "aihappey-skills": { useSkills: () => ({ items: [] }) },
        "aihappey-plugins": { usePlugins: () => ({ items: [] }) },
        "aihappey-structured-outputs": { useStructuredOutputs: () => ({ items: [] }) },
        "./useAgentMcpServers": { useAgent: () => ({ mcpServers: [] }) },
        "../chat/context/ChatContext": { useChatContext: () => ({ config: {} }) },
        "../provider-config/openai/openAISkillOptions": { buildOpenAISkillOptions: () => [], createOpenAIShellSkillResolver: () => () => {} },
        "./agentTags": { getAgentTags: () => [], collectAgentTags: () => [] },
        "../../runtime/providers/providerMetadata": { PROVIDERS: {} },
        "../mcp-catalog/ServerCatalogModal": components,
        "../provider-config/google/GoogleChatConfig": components,
        "./AgentSkillsEditor": components,
        "../chat-settings/ChatPluginsEditor": components,
        "./AgentChecks": components,
        "./AgentToolConfigurationTab": components,
        "./agentSkills": {}, "./agentPlugins": {}, "../chat-settings/GeneralTab": {}, "./agentToolConfiguration": {},
    });
    return {
        render() {
            index = 0;
            return AgentForm({ agent, isEditing: true, onChange: update => { agent = typeof update === "function" ? update(agent) : update; } });
        },
        get agent() { return agent; },
        state,
        setModels(next) { state.models = next; },
    };
}

const picker = node => {
    const modelSelect = find(node, child => typeof child.type === "function" && child.type.name === "ModelSelect");
    const field = modelSelect.type(modelSelect.props);
    return field.type(field.props);
};
function optionNodes(node) {
    if (!React.isValidElement(node)) return [];
    return node.type === "option" ? [node] : React.Children.toArray(node.props.children).flatMap(optionNodes);
}
const modelId = value => { try { return JSON.parse(value)[1]; } catch { return value; } };
const options = select => optionNodes(select).map(option => ({ value: modelId(option.props.value), label: option.props.children }));
const selectedIds = select => select.props.values.map(modelId);
function toggle(select, id) {
    const option = optionNodes(select).find(option => modelId(option.props.value) === id);
    assert.ok(option, `Expected ${id} to be a selectable model`);
    select.props.onChange(option.props.value);
}

test("agent reuses the chat model picker with active-provider filtering, grouping, search, and multiselect", () => {
    const h = harness({ model: { id: "openai/first" } });
    const node = h.render();
    const select = picker(node);
    assert.equal(select.props.multiselect, true);
    assert.equal(select.props.searchable, true);
    assert.deepEqual(selectedIds(select), ["openai/first"]);
    assert.deepEqual(options(select), [
        { value: "openai/first", label: "First answer" },
        { value: "other/second", label: "Second answer" },
        { value: "router/decision", label: "Router" },
    ]);
    assert.ok(find(select, node => node.type === "optgroup" && node.props.label === "OpenAI"));
    assert.equal(select.props.onFilter, undefined);
    assert.equal(select.props.freeform, undefined);
    assert.equal(find(node, child => child.props.children === "agentEdit.modelRoutingHint"), undefined);
});

test("agent model picker toggles multiple answer and decision models without losing existing configuration", () => {
    const original = { id: "openai/first", type: "language", providerMetadata: { configured: true }, providerHeaders: { "x-custom": "value" } };
    const h = harness({ model: original });
    toggle(picker(h.render()), "other/second");
    assert.deepEqual(h.agent.models.map(model => model.id), ["openai/first", "other/second"]);
    assert.deepEqual(h.agent.models[0], original);
    assert.deepEqual(h.agent.models[1], { id: "other/second", type: "language", providerMetadata });
    toggle(picker(h.render()), "router/decision");
    assert.deepEqual(h.agent.models.map(model => model.type), ["language", "language", "decision"]);
    assert.deepEqual(selectedIds(picker(h.render())), ["openai/first", "other/second", "router/decision"]);
    toggle(picker(h.render()), "other/second");
    assert.deepEqual(h.agent.models.map(model => model.id), ["openai/first", "router/decision"]);
    assert.deepEqual(h.agent.model, original);
    toggle(picker(h.render()), "openai/first");
    assert.deepEqual(h.agent.models.map(model => model.id), ["router/decision"]);
    assert.equal(h.agent.model, undefined);
});

test("saved selections retain their title and configuration without injecting disabled or missing models into the list", () => {
    const h = harness({ models: [{ id: "retired/model" }, { id: "direct/model" }, { id: "openai/first" }] });
    const values = options(picker(h.render())).map(option => option.value);
    assert.deepEqual(values, ["openai/first", "other/second", "router/decision"]);
    assert.equal(new Set(values).size, values.length);
    assert.match(picker(h.render()).props.valueTitle, /retired\/model/);
    h.setModels(undefined);
    assert.deepEqual(options(picker(h.render())), []);
    assert.deepEqual(h.agent.models.map(model => model.id), ["retired/model", "direct/model", "openai/first"]);
    assert.equal(h.agent.model, undefined);
});

test("new agents can select models and the provider settings picker renders and switches between selected models", () => {
    const h = harness();
    assert.ok(options(picker(h.render())).length > 0);
    toggle(picker(h.render()), "openai/first");
    toggle(picker(h.render()), "other/second");
    assert.equal(h.agent.model, undefined);
    let node = h.render();
    let settings = find(node, child => child.type === "Select" && child.props.label === "model");
    assert.deepEqual(options(settings).map(option => option.value), ["openai/first", "other/second"]);
    settings.props.onChange("other/second");
    node = h.render();
    settings = find(node, child => child.type === "Select" && child.props.label === "model");
    assert.deepEqual(settings.props.values, ["other/second"]);
    const providerTab = find(node, child => child.type === "Tab" && child.props.eventKey === "providers");
    assert.equal(providerTab.props.title, "other");
});

test("a large local catalogue renders only enabled-provider models and reacts to local provider settings", () => {
    const disabledModels = Array.from({ length: 12000 }, (_, index) => ({ id: `disabled/${index}`, name: `Disabled ${index}`, type: "language" }));
    const h = harness({}, [...catalog, ...disabledModels]);
    assert.equal(options(picker(h.render())).length, 3);
    h.state.enabledProvidersByType = { language: ["OpenAI"], decision: [] };
    assert.deepEqual(options(picker(h.render())).map(option => option.value), ["openai/first"]);
    h.state.enabledProvidersByType = { language: [], decision: [] };
    assert.deepEqual(options(picker(h.render())), []);
});

test("provider filters remain independent by type and favorites follow the same visibility rules as chat", () => {
    const h = harness({}, [...catalog,
        { id: "router/chat", name: "Router chat", type: "language" },
        { id: "openai/decision", name: "OpenAI decision", type: "decision" },
        { id: "disabled/favorite", name: "Favorite", type: "language" },
    ], { enabledProvidersByType: { language: ["OpenAI"], decision: ["Router"] }, favoriteModelsByType: { language: ["disabled/favorite"] } });
    const select = picker(h.render());
    assert.deepEqual(options(select).map(option => option.value), ["disabled/favorite", "openai/first", "router/decision"]);
    assert.ok(find(select, node => node.type === "optgroup" && node.props.label === "favorites"));
});

test("multiselect never automatically selects or refreshes models, while the existing single-select fallback still works", () => {
    const effects = [], changes = [];
    const shared = modelPicker({ modelsLoaded: true, enabledProvidersByType: { language: ["OpenAI"] } }, effects);
    const props = { models: catalog, value: "", values: [], multiselect: true, onChange: id => changes.push(id) };
    const select = shared.render(props);
    effects.splice(0).forEach(effect => effect());
    assert.deepEqual(changes, []);
    assert.deepEqual(select.props.values, []);
    shared.render({ ...props, multiselect: false });
    effects.splice(0).forEach(effect => effect());
    assert.deepEqual(changes, ["openai/first"]);
    const single = shared.render({ ...props, value: "openai/first", multiselect: false });
    assert.deepEqual(selectedIds(single), ["openai/first"]);
    toggle(single, "openai/first");
    assert.equal(changes.at(-1), "openai/first");
});

test("Shadcn multiselect uses the chat scroll viewport and does not render list items while closed", () => {
    const filename = "packages/aihappey-theme-shadcn/src/primitives.tsx";
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let dropdown;
    function visit(node) {
        if (ts.isVariableDeclaration(node) && node.name.getText(source) === "multiselectDropdown") dropdown = node;
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(dropdown);
    const text = dropdown.getText(source);
    assert.match(text, /<SelectDropdownViewport>/);
    assert.match(text, /open\s*\?\s*noResults\s*\?\?\s*renderMultiSelectNodes/);
});

function modalHarness(agent) {
    const slots = [];
    let index = 0;
    const saved = [];
    const { AgentEditModal } = load("packages/aihappey-core/src/features/agents/AgentEditModal.tsx", {
        react: {
            useState(initial) {
                const slot = index++;
                if (!(slot in slots)) slots[slot] = initial;
                return [slots[slot], value => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
            },
            useEffect() {},
        },
        "aihappey-components": { useTheme: () => components },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "aihappey-types": agentModels,
        "./AgentForm": { AgentForm: "AgentForm" },
        "../../ui/buttons/CancelButton": { CancelButton: "CancelButton" },
    });
    return {
        saved,
        render() {
            index = 0;
            return AgentEditModal({ open: true, agent, isEditing: false, onClose() {}, onSave: value => saved.push(value) });
        },
    };
}

const saveButton = modal => find(modal.props.actions, node => node.type === "Button" && node.props.children === "save");

test("new-agent modal can save the actual multiselect form's collection-only draft without a legacy model", () => {
    const form = harness();
    toggle(picker(form.render()), "openai/first");
    toggle(picker(form.render()), "other/second");
    assert.equal(form.agent.model, undefined);
    const modal = modalHarness({ name: "", description: "", instructions: "" });
    let node = modal.render();
    assert.equal(saveButton(node).props.disabled, true);
    find(node, child => child.type === "AgentForm").props.onChange(form.agent);
    node = modal.render();
    assert.equal(saveButton(node).props.disabled, false);
    saveButton(node).props.onClick();
    assert.equal(modal.saved.length, 1);
    assert.equal(modal.saved[0], form.agent);
    assert.deepEqual(modal.saved[0].models.map(model => model.id), ["openai/first", "other/second"]);
});

test("agent-save validation accepts legacy and collection models but rejects missing fields and empty model selections", () => {
    const valid = { name: "Example", description: "Example agent", instructions: "Help", models: [{ id: "openai/first", type: "language" }] };
    for (const agent of [valid, { ...valid, models: undefined, model: { id: "openai/first" } }]) {
        assert.equal(saveButton(modalHarness(agent).render()).props.disabled, false);
    }
    for (const patch of [
        { name: "" }, { description: "" }, { instructions: "" },
        { models: [] }, { models: undefined }, { models: [{ id: " " }] },
    ]) assert.equal(saveButton(modalHarness({ ...valid, ...patch }).render()).props.disabled, true);
});

test("agent-save remains disabled while form work is busy and re-enables when it finishes", () => {
    const modal = modalHarness({ name: "Example", description: "Example agent", instructions: "Help", models: [{ id: "openai/first" }] });
    let node = modal.render();
    const form = find(node, child => child.type === "AgentForm");
    assert.equal(saveButton(node).props.disabled, false);
    form.props.onBusyChange(true);
    assert.equal(saveButton(modal.render()).props.disabled, true);
    form.props.onBusyChange(false);
    assert.equal(saveButton(modal.render()).props.disabled, false);
});
