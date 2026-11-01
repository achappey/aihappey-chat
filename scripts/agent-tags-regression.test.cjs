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

test("owners are free text, trimmed, unique suggestions and only group agents without tags", () => {
    assert.equal(tags.getAgentOwner(undefined, {}, { owned_by: null }, { owned_by: 3 }, { owned_by: " Team " }), "Team");
    assert.equal(tags.getAgentOwner({ owned_by: " " }, { owned_by: "Nested" }), "Nested");
    assert.equal(tags.getAgentOwner({ owned_by: "Listing" }, { owned_by: "Nested" }), "Listing");
    assert.deepEqual(tags.collectAgentOwners([{ owned_by: " Team " }], [
        { owned_by: "Team", agent: { owned_by: " Research " } }, { owned_by: "" },
    ]), ["Research", "Team"]);
    assert.deepEqual(tags.getAgentGroups({ tags: [" a ", "b", "a"], owned_by: "Team" }), ["a", "b"]);
    assert.deepEqual(tags.getAgentGroups({ tags: [" "], owned_by: " Team " }), ["Team"]);
    assert.deepEqual(tags.getAgentGroups({ tags: [], owned_by: " " }), []);
    const { normalizeAgent } = load("packages/aihappey-agents/src/normalizeAgent.ts", { "aihappey-types": agentTypes });
    const restored = normalizeAgent(JSON.parse(JSON.stringify({ ...local("Owned"), owned_by: "Any team" })));
    assert.equal(restored.owned_by, "Any team");
});

test("remote discovery preserves provided tags without manufacturing categories for untagged agents", async () => {
    let discovered, requests = 0, writes = 0;
    const effects = [];
    const data = [
        { id: "untagged" },
        { id: "tagged", tags: ["writing", 3], agent: local("Nested", ["shared"]) },
        { id: "empty", tags: [] },
        { id: "malformed", tags: "not-an-array" },
    ];
    const before = structuredClone(data);
    const state = { remoteAgentModelsLoaded: false, customHeaders: {}, setRemoteAgentModels: value => { discovered = value; writes++; } };
    const { useRemoteAgentModels } = load(feature + "useRemoteAgentModels.ts", {
        react: { useEffect: effect => effects.push(effect), useRef: initial => ({ current: initial }) },
        "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-http": { createHttpClient: () => ({
            get: async () => { requests++; return { data }; },
        }) },
    });
    useRemoteAgentModels("https://agents.example/models");
    const cleanups = effects.map(effect => effect());
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requests, 1);
    assert.equal(writes, 1);
    assert.equal(discovered[0].tags, undefined);
    assert.deepEqual(tags.getAgentTags(discovered[0]), []);
    assert.deepEqual(tags.getAgentTags(discovered[1], discovered[1].agent), ["writing", "shared"]);
    assert.deepEqual(discovered[2].tags, []);
    assert.equal(discovered[3].tags, undefined);
    assert.deepEqual(data, before);
    cleanups.forEach(cleanup => cleanup?.());
});

test("selector groups agents under every tag and reserves hosts for untagged agents", () => {
    const state = { enabledProvidersByType: { language: ["test"] } };
    const { AgentSelect } = load(feature + "AgentSelect.tsx", {
        ...common,
        react: { ...React, useMemo: factory => factory(), useEffect: () => {} },
        "aihappey-state": { useAppStore: selector => selector(state), store: {},
            DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: { selectFavoriteAgent: "SelectFavoriteAgent" } },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "./agentSelection": selection,
        "../chat/engine/favoriteRouter": { FAVORITE_AGENT_ROUTER: "__router__", favoriteRouterModel: () => undefined },
    });
    let selected;
    const picker = AgentSelect({
        localAgents: [...agents, { ...local("Owned"), owned_by: " Team " }, { ...local("Tagged", ["writing"]), owned_by: "Ignored owner" }],
        remoteAgentModels: [...remoteAgentModels, { id: "owned", source: "remote", owned_by: "Team" }, { id: "nested", source: "remote", agent: { ...local("Nested"), owned_by: "Embedded" } }], values: ["local:Writer"],
        favoriteAgentIds: ["local:Writer"], onChange: value => { selected = value; },
    });
    const groups = Object.fromEntries(nodes(picker, "optgroup").map(group => [
        group.props.label, nodes(group, "option").map(option => option.props.value),
    ]));
    assert.deepEqual(groups.writing, ["local:Tagged", "local:Writer"]);
    assert.deepEqual(groups.Team, ["local:Owned", "remote:owned"]);
    assert.deepEqual(groups.Embedded, ["remote:nested"]);
    assert.equal(groups["Ignored owner"], undefined);
    assert.deepEqual(groups.shared, ["local:Writer", "remote:remote-writer"]);
    assert.deepEqual(groups.research, ["remote:remote-writer"]);
    assert.deepEqual(groups.Local, ["local:Empty", "local:Plain"]);
    assert.deepEqual(groups["agents.example"], ["remote:plain"]);
    assert.deepEqual(groups.favorites, ["local:Writer"]);
    assert.deepEqual(picker.props.values, ["local:Writer"]);
    picker.props.onChange("remote:remote-writer");
    assert.equal(selected, "remote:remote-writer");
});

function overview(desktop = true, overrides = {}, mocks = {}) {
    const slots = [];
    let index, tree, saved, dirty, effects;
    const hooks = {
        ...React,
        useMemo: factory => factory(),
        useCallback: callback => callback,
        useRef: () => ({ current: null }),
        useEffect(effect, deps) {
            const slot = index++;
            if (!slots[slot] || deps.some((dep, i) => !Object.is(dep, slots[slot][i]))) {
                slots[slot] = deps;
                effects.push(effect);
            }
        },
        useState(initial) {
            const slot = index++;
            if (!(slot in slots)) slots[slot] = typeof initial === "function" ? initial() : initial;
            return [slots[slot], next => {
                const value = typeof next === "function" ? next(slots[slot]) : next;
                dirty ||= !Object.is(value, slots[slot]);
                slots[slot] = value;
            }];
        },
    };
    const state = { agents, remoteAgentModels, favoriteAgentIds: ["local:Writer"], createAgent: agent => { saved = agent; }, ...overrides };
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
        ...mocks,
    });
    const render = () => {
        let passes = 0;
        do {
            dirty = false; index = 0; effects = []; tree = AgentsPage(); effects.forEach(effect => effect());
            assert.ok(++passes < 10, "effects settle without a render loop");
        } while (dirty);
        return tree;
    };
    const allCards = () => nodes(nodes(tree, "Tab").find(tab => tab.props.eventKey === "all"), "AgentCard");
    render();
    const filter = label => nodes(tree, "Select").find(select => select.props.label === label);
    const choose = (label, value) => { filter(label).props.onChange({ target: { value: value === null ? "" : `value:${value}` } }); render(); };
    const tab = key => nodes(tree, "Tab").find(tab => tab.props.eventKey === key);
    const selectTab = key => { nodes(tree, "Tabs")[0].props.onSelect(key); render(); };
    return { render, allCards, filter, choose, tab, selectTab, state, tree: () => tree, saved: () => saved };
}

test("overview dropdowns OR tags, compose search, reset, and preserve save payloads", () => {
    const page = overview();
    assert.deepEqual(nodes(page.filter("agentEdit.tags"), "option").map(option => option.props.value), ["", "value:research", "value:shared", "value:writing"]);
    page.choose("agentEdit.tags", "shared");
    assert.equal(page.allCards().length, 2);
    page.choose("agentEdit.tags", "research");
    assert.equal(page.allCards().length, 2);
    nodes(page.tree(), "SearchBox")[0].props.onChange("test/model");
    page.render();
    assert.equal(page.allCards().length, 2);
    nodes(page.tree(), "SearchBox")[0].props.onChange("missing");
    page.render();
    assert.equal(page.allCards().length, 0);
    nodes(page.tree(), "SearchBox")[0].props.onChange("");
    page.choose("agentEdit.tags", null);
    assert.equal(page.allCards().length, 5);
    nodes(page.tree(), "AgentEditModal")[0].props.onSave(agents[0]);
    assert.deepEqual(page.saved().tags, ["writing", "shared"]);
    assert.equal(nodes(page.tree(), "Drawer").length, 0);
    assert.equal(nodes(page.tree(), "Switch").length, 0);
    assert.equal(nodes(page.tree(), "FilterDrawerPanel").length, 0);
});

test("mobile overview has only the two inline filters, with no drawer or toggle", () => {
    const page = overview(false);
    assert.equal(nodes(page.tree(), "Select").length, 2);
    assert.equal(nodes(page.tree(), "Drawer").length, 0);
    assert.equal(nodes(page.tree(), "Switch").length, 0);
});

test("metadata filters compose across existing and per-value tabs with effective remote ownership", () => {
    const page = overview(true, {
        agents: [{ ...local("Writer", [" shared ", "writing", "shared"]), owned_by: " Team " }, { ...local("Research", ["research"]), owned_by: "Research" }, local("Plain")],
        remoteAgentModels: [{ id: "writer", owned_by: "Team", tags: ["shared"], agent: { ...local("Remote", ["research"]), owned_by: "Shadowed" } }],
    });
    assert.deepEqual(nodes(page.filter("agentEdit.ownedBy"), "option").map(option => option.props.value), ["", "value:Research", "value:Team"]);
    page.choose("agentEdit.tags", "shared");
    page.choose("agentEdit.ownedBy", "Team");
    assert.equal(page.allCards().length, 2);
    for (const key of ["favorites", "local", "remote:agents.example"]) {
        page.selectTab(key);
        assert.equal(nodes(page.tab(key), "AgentCard").length, 1);
        assert.equal(page.allCards().length, 2, "tab switching does not reset shared filters");
    }
    page.selectTab("tag:shared");
    assert.equal(nodes(page.tab("tag:shared"), "AgentCard").length, 2);
    assert.equal(page.tab("tag:shared").props.title, "shared (2)");
    page.selectTab("owner:Team");
    assert.equal(nodes(page.tab("owner:Team"), "AgentCard").length, 2);
    assert.equal(nodes(page.tree(), "section").length, 0, "per-value tabs render flat card grids");
    page.choose("agentEdit.ownedBy", "Research");
    page.choose("agentEdit.tags", "research");
    assert.equal(page.allCards().length, 3, "both facets allow multiple OR selections");
    nodes(page.tree(), "SearchBox")[0].props.onChange("Shadowed"); page.render();
    assert.equal(page.allCards().length, 0, "overridden nested owner is not searchable");
});

test("one flat tab per nonblank tag and owner reuses existing cards and actions", () => {
    const page = overview(true, {
        agents: [{ ...local("Both", ["b", " a ", "a", ""]), owned_by: " Team " }, { ...local("Owned"), owned_by: "Team" }, local("Plain")],
        remoteAgentModels: [],
    });
    assert.deepEqual(nodes(page.tree(), "Tab").map(tab => tab.props.eventKey), ["all", "favorites", "remote:agents.example", "local", "tag:a", "tag:b", "owner:Team"]);
    assert.equal(nodes(page.tab("tag:a"), "AgentCard").length, 1);
    assert.equal(nodes(page.tab("tag:b"), "AgentCard").length, 1);
    const owned = nodes(page.tab("owner:Team"), "AgentCard");
    assert.equal(owned.length, 2, "tagged agents also belong to their owner tab");
    assert.ok(owned.every(card => typeof card.props.onEdit === "function" && card.props.onSaveAsPlugin === undefined));
    assert.equal(page.tab("tag:a").props.title, "a (1)");
    assert.equal(page.tab("owner:Team").props.title, "Team (2)");
    assert.equal(page.tab("tags"), undefined); assert.equal(page.tab("owners"), undefined);
});

test("catalog refresh cleans stale selections and safely falls back from removed value tabs", () => {
    const page = overview(true, { agents: [{ ...local("Tagged", ["x"]), owned_by: "Team" }], remoteAgentModels: [] });
    page.choose("agentEdit.tags", "x"); page.choose("agentEdit.ownedBy", "Team"); page.selectTab("tag:x");
    page.state.agents = [local("Plain", [" ", ""])]; page.render();
    assert.equal(page.tab("tag:x"), undefined); assert.equal(page.tab("owner:Team"), undefined);
    assert.equal(nodes(page.tree(), "Tabs")[0].props.activeKey, "all");
    assert.deepEqual(page.filter("agentEdit.tags").props.values, [""]);
    assert.deepEqual(page.filter("agentEdit.ownedBy").props.values, [""]);
    assert.equal(page.allCards().length, 1);
    assert.equal(page.filter("agentEdit.tags").props.disabled, true);
    page.state.agents = [{ ...local("Owned"), owned_by: "Team" }]; page.render(); page.selectTab("owner:Team");
    page.state.agents = [local("Plain")]; page.render();
    assert.equal(nodes(page.tree(), "Tabs")[0].props.activeKey, "all", "removed owner tab also falls back");
});

test("metadata values cannot collide with the All option or tab identities", () => {
    const page = overview(true, { agents: [{ ...local("Special", ["__ALL__", "all", "owners"]), owned_by: "all" }], remoteAgentModels: [] });
    page.choose("agentEdit.tags", "__ALL__"); page.choose("agentEdit.ownedBy", "all");
    assert.deepEqual(page.filter("agentEdit.tags").props.values, ["value:__ALL__"]);
    assert.equal(page.allCards().length, 1);
    assert.notEqual(page.tab("tag:all").props.eventKey, page.tab("owner:all").props.eventKey);
    assert.equal(page.tab("tag:all").props.title, "all (1)");
    assert.equal(page.tab("owner:all").props.title, "all (1)");
    for (const key of ["tag:__ALL__", "tag:all", "owner:all"]) {
        page.selectTab(key); assert.equal(nodes(page.tab(key), "AgentCard").length, 1);
    }
    nodes(page.tree(), "SearchBox")[0].props.onChange("absent"); page.render();
    assert.ok(page.tab("tag:all"), "empty search results do not remove valid value tabs");
    assert.equal(page.tab("tag:all").props.title, "all (0)");
    assert.equal(nodes(page.tab("tag:all"), "AgentCard").length, 0);
    assert.equal(page.allCards().length, 0);
});

test("plugin action requires direct skills or enabled MCP servers on local and remote cards", () => {
    const skill = { type: "skill_reference", skill_id: "provider/example" };
    const server = { url: "https://example.org/mcp" };
    const cases = [
        ["Neither", {}, false],
        ["Empty", { skills: [], mcpServers: {} }, false],
        ["Skills", { skills: [skill] }, true],
        ["Inline", { skills: [{ type: "inline", name: "example", source: { type: "base64", data: "archive" } }] }, true],
        ["Mcp", { mcpServers: { example: server } }, true],
        ["ExplicitlyEnabled", { mcpServers: { example: { ...server, disabled: false } } }, true],
        ["Both", { skills: [skill], mcpServers: { example: server } }, true],
        ["Disabled", { mcpServers: { example: { ...server, disabled: true } } }, false],
        ["Mixed", { mcpServers: { disabled: { ...server, disabled: true }, enabled: server } }, true],
        ["SkillsAndDisabled", { skills: [skill], mcpServers: { example: { ...server, disabled: true } } }, true],
        ["BlankServerName", { mcpServers: { " ": server } }, false],
        ["EmbeddedPluginOnly", { plugins: [{ type: "base64", data: "archive" }] }, false],
    ];
    for (const desktop of [true, false]) {
        const page = overview(desktop, {
            agents: cases.map(([name, fields]) => ({ ...local(name), ...fields })),
            remoteAgentModels: [...cases.map(([name, fields]) => ({ id: name, agent: { ...local(name), ...fields } })), { id: "Opaque" }],
        });
        for (const tab of ["local", "remote:agents.example"]) {
            const cards = nodes(page.tab(tab), "AgentCard");
            for (const [name, , expected] of [...cases, ["Opaque", {}, false]].filter(([name]) => tab !== "local" || name !== "Opaque")) {
                const card = cards.find(card => card.props.agent.name === name);
                assert.equal(typeof card.props.onSaveAsPlugin === "function", expected, `${desktop}/${tab}/${name}`);
                assert.equal(typeof card.props.onEdit === "function", tab === "local");
                assert.equal(typeof card.props.onDelete === "function", tab === "local");
                assert.equal(typeof card.props.onToggleFavorite, "function");
                assert.equal(card.props.saveAsPluginDisabled, false);
            }
        }
        page.state.agents = [local("Skills")]; page.render();
        assert.equal(nodes(page.tab("local"), "AgentCard")[0].props.onSaveAsPlugin, undefined, "refresh removes action after the last skill is removed");
    }
});

test("eligible plugin action retains conversion and disables other saves while busy", async () => {
    const original = { ...local("Skills"), skills: [{ type: "skill_reference", skill_id: "provider/example" }] };
    const draft = { manifest: { name: "example-plugin" }, files: [] };
    const skills = { items: [] };
    const conversions = [], creations = [];
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const page = overview(true, { agents: [original], remoteAgentModels: [{ id: "remote", agent: original }] }, {
        "aihappey-skills": { useSkills: () => skills },
        "aihappey-plugins": { usePlugins: () => ({ items: [{ name: "existing" }], extensionNamespace: "com.example",
            create: async value => { creations.push(value); return pending; } }) },
        "./agentPluginConversion": { convertAgentToPluginDraft: async (...args) => { conversions.push(args); return draft; } },
    });
    const saving = page.allCards()[0].props.onSaveAsPlugin();
    await new Promise(resolve => setImmediate(resolve));
    page.render();
    assert.ok(page.allCards().every(card => card.props.saveAsPluginDisabled));
    await page.allCards()[1].props.onSaveAsPlugin();
    assert.deepEqual(conversions, [[original, { existingPluginNames: ["existing"], extensionNamespace: "com.example", skills }]]);
    assert.deepEqual(creations, [draft]);
    finish({ name: "example-plugin" }); await saving; page.render();
    assert.ok(page.allCards().every(card => !card.props.saveAsPluginDisabled));
});
