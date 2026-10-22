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
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        if (id.endsWith("/providerAuthHeaders")) return require("./credential-test-loader.cjs").auth;
        if (id.endsWith("/scopedRequest")) return require("./credential-test-loader.cjs").scoped;
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

const feature = "packages/aihappey-core/src/features/agents/";
const tags = load(feature + "agentTags.ts");
const agentTypes = {
    ...load("packages/aihappey-types/src/agents.ts"),
    ...load("packages/aihappey-types/src/agentModels.ts"),
};
const selection = load(feature + "agentSelection.ts", {
    "aihappey-types": agentTypes,
});
const local = (name, agentTags) => ({
    name, description: name, instructions: "Assist", model: { id: "test/model" },
    ...(agentTags === undefined ? {} : { tags: agentTags }),
});
const agents = [local("Writer", ["writing", "shared"]), local("Plain"), local("Empty", [])];
const remoteAgentModels = [
    { id: "remote-writer", name: "Writer", source: "remote", tags: ["shared"], agent: local("Writer", ["research", "shared"]) },
    { id: "plain", source: "remote" },
];
const t = key => key;
const theme = new Proxy({}, { get: (_, key) => key });
const common = {
    "aihappey-types": agentTypes,
    "aihappey-components": { useTheme: () => theme, AgentCard: "AgentCard", FilterDrawerPanel: "FilterDrawerPanel", StickyHeaderActionBar: "StickyHeaderActionBar" },
    "aihappey-i18n": { useTranslation: () => ({ t }) },
    "../chat/context/ChatContext": { useChatContext: () => ({ config: { agentEndpoint: "https://agents.example", endpoints: { models: "/models" } } }) },
    "./agentTags": tags,
};
function nodes(node, type) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(node.type === type ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => nodes(child, type)),
    ];
}

test("tag values are dynamic, trimmed, unique and tolerate absent or malformed tags", () => {
    assert.deepEqual(tags.getAgentTags(undefined, {}, { tags: null }, { tags: [" shared ", "", "shared", 3] }), ["shared"]);
    assert.deepEqual(tags.collectAgentTags(agents, remoteAgentModels), ["research", "shared", "writing"]);
    const { normalizeAgent } = load("packages/aihappey-agents/src/normalizeAgent.ts", { "aihappey-types": agentTypes });
    assert.deepEqual(normalizeAgent(agents[0]).tags, ["writing", "shared"]);
    assert.equal(normalizeAgent(agents[1]).tags, undefined);
    assert.deepEqual(normalizeAgent({ ...agents[0], tags: [] }).tags, []);
});

test("remote discovery preserves provided tags without manufacturing categories for untagged agents", async () => {
    let discovered;
    const state = { setRemoteAgentModels: value => { discovered = value; } };
    const { useRemoteAgentModels } = load(feature + "useRemoteAgentModels.ts", {
        react: { useEffect: effect => effect() },
        "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-http": { createHttpClient: () => ({
            get: async () => ({ data: [
                { id: "untagged" },
                { id: "tagged", tags: ["writing", 3], agent: local("Nested", ["shared"]) },
            ] }),
        }) },
    });
    useRemoteAgentModels("https://agents.example/models");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(discovered[0].tags, undefined);
    assert.deepEqual(tags.getAgentTags(discovered[0]), []);
    assert.deepEqual(tags.getAgentTags(discovered[1], discovered[1].agent), ["writing", "shared"]);
});

test("selector groups agents under every tag and reserves hosts for untagged agents", () => {
    const state = { enabledProvidersByType: { language: ["test"] } };
    const { AgentSelect } = load(feature + "AgentSelect.tsx", {
        ...common,
        react: { ...React, useMemo: factory => factory() },
        "aihappey-state": { useAppStore: selector => selector(state), store: {},
            DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: { selectFavoriteAgent: "SelectFavoriteAgent" } },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "./agentSelection": selection,
        "../chat/engine/favoriteRouter": { FAVORITE_AGENT_ROUTER: "__router__", favoriteRouterModel: () => undefined },
    });
    let selected;
    const picker = AgentSelect({
        localAgents: agents, remoteAgentModels, values: ["local:Writer"],
        favoriteAgentIds: ["local:Writer"], onChange: value => { selected = value; },
    });
    const groups = Object.fromEntries(nodes(picker, "optgroup").map(group => [
        group.props.label, nodes(group, "option").map(option => option.props.value),
    ]));
    assert.deepEqual(groups.writing, ["local:Writer"]);
    assert.deepEqual(groups.shared, ["local:Writer", "remote:remote-writer"]);
    assert.deepEqual(groups.research, ["remote:remote-writer"]);
    assert.deepEqual(groups.Local, ["local:Empty", "local:Plain"]);
    assert.deepEqual(groups["agents.example"], ["remote:plain"]);
    assert.deepEqual(groups.favorites, ["local:Writer"]);
    assert.deepEqual(picker.props.values, ["local:Writer"]);
    picker.props.onChange("remote:remote-writer");
    assert.equal(selected, "remote:remote-writer");
});

function overview(desktop = true) {
    const slots = [];
    let index, tree, saved;
    const hooks = {
        ...React,
        useMemo: factory => factory(),
        useCallback: callback => callback,
        useRef: () => ({ current: null }),
        useEffect: () => {},
        useState(initial) {
            const slot = index++;
            if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
            return [slots[slot], next => { slots[slot] = typeof next === "function" ? next(slots[slot]) : next; }];
        },
    };
    const state = { agents, remoteAgentModels, favoriteAgentIds: ["local:Writer"], createAgent: agent => { saved = agent; } };
    const { AgentsPage } = load(feature + "AgentsPage.tsx", {
        ...common,
        react: hooks,
        "aihappey-state": { useAppStore: selector => selector(state), getAgentModelProviderKey: () => undefined },
        "../../ui/layout/OverviewPageHeader": { OverviewPageHeader: "OverviewPageHeader" },
        "./AgentEditModal": { AgentEditModal: "AgentEditModal" },
        "react-dnd-html5-backend": { NativeTypes: { FILE: "file" } },
        "react-dnd": { useDrop: () => [{ isOver: false }, () => {}] },
        "../../runtime/providers/providerMetadata": { PROVIDERS: {} },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => desktop },
        "aihappey-plugins": { usePlugins: () => ({ items: [] }) },
        "aihappey-skills": { useSkills: () => ({ items: [] }) },
        "./agentPluginConversion": {},
    });
    const render = () => { index = 0; tree = AgentsPage(); return tree; };
    const allCards = () => nodes(nodes(tree, "Tab").find(tab => tab.props.eventKey === "all"), "AgentCard");
    render();
    nodes(tree, "StickyHeaderActionBar")[0].props.actionContent.props.children[0].props.onChange(true);
    render();
    return { render, allCards, tree: () => tree, saved: () => saved };
}

test("overview filters across multiple tags, composes search, and preserves save payloads", () => {
    const page = overview();
    const panel = () => nodes(page.tree(), "FilterDrawerPanel")[0].props.sections[0];
    assert.deepEqual(panel().items.map(item => item.label), ["research", "shared", "writing"]);
    assert.equal(panel().allOption.count, 5);
    panel().items.find(item => item.label === "shared").onChange(true);
    page.render();
    assert.equal(page.allCards().length, 2);
    panel().items.find(item => item.label === "research").onChange(true);
    page.render();
    assert.equal(page.allCards().length, 2);
    nodes(page.tree(), "SearchBox")[0].props.onChange("test/model");
    page.render();
    assert.equal(page.allCards().length, 2);
    nodes(page.tree(), "SearchBox")[0].props.onChange("missing");
    page.render();
    assert.equal(page.allCards().length, 0);
    nodes(page.tree(), "SearchBox")[0].props.onChange("");
    panel().allOption.onChange(true);
    page.render();
    assert.equal(page.allCards().length, 5);
    nodes(page.tree(), "AgentEditModal")[0].props.onSave(agents[0]);
    assert.deepEqual(page.saved().tags, ["writing", "shared"]);
    assert.equal(nodes(page.tree(), "Drawer")[0].props.overlay, false);
    assert.equal(nodes(page.tree(), "Drawer")[0].props.size, "small");
});

test("overview uses an overlay filter drawer on mobile", () => {
    const page = overview(false);
    const drawer = nodes(page.tree(), "Drawer")[0];
    assert.equal(drawer.props.overlay, true);
    assert.equal(drawer.props.open, true);
    drawer.props.onClose();
    page.render();
    assert.equal(nodes(page.tree(), "Drawer")[0].props.open, false);
});
