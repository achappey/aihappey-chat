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
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

const components = "packages/aihappey-components/src/";
const feature = "packages/aihappey-core/src/features/agents/";
const agentModels = load("packages/aihappey-types/src/agentModels.ts");
const iconSelection = load(components + "images/selectCapabilityIcon.ts");
const theme = new Proxy({}, { get: (_, name) => name });
const cardRenderer = require("./react-test-renderer.cjs").renderer();
let darkMode = false;
const shared = {
    react: React,
    "usehooks-ts": { useDarkMode: () => ({ isDarkMode: darkMode }) },
    "../theme/ThemeContext": { useTheme: () => theme },
    "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
    "aihappey-types": agentModels,
};
const capabilityIcon = load(components + "images/CapabilityIcon.tsx", {
    ...shared, "./selectCapabilityIcon": iconSelection,
});
const { AgentCard: AgentCardComponent } = load(components + "cards/AgentCard.tsx", {
    ...shared,
    react: cardRenderer.react,
    "../images/CapabilityIcon": capabilityIcon,
    "../images/selectCapabilityIcon": iconSelection,
    "../fields/LimitedTextField": { LimitedTextField: "LimitedTextField" },
    "../badges/AuthorBadge": { AuthorBadge: "AuthorBadge" },
    "../buttons/AgentFavoriteToggleButton": { AgentFavoriteToggleButton: "AgentFavoriteToggleButton" },
});
const AgentCard = props => cardRenderer.render(AgentCardComponent, props);
const agent = ids => ({ name: "Example", description: "Example agent", instructions: "Help", models: ids.map(id => ({ id })) });
const openaiIcons = [
    { src: "openai-light.svg", theme: "light", providerId: "openai" },
    { src: "openai-dark.svg", theme: "dark", providerId: "openai" },
];
function nodes(node, type) {
    if (Array.isArray(node)) return node.flatMap(child => nodes(child, type));
    if (!React.isValidElement(node)) return [];
    return [
        ...(node.type === type ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => nodes(child, type)),
    ];
}
function assertCompactCard(card, original) {
    assert.equal(card.type, "Card");
    assert.equal(card.props.title, original.name);
    assert.equal(nodes(card.props.children, "LimitedTextField")[0].props.text, original.description);
    assert.deepEqual(nodes(card.props.children, "Badge"), []);
    if (original.owned_by?.trim()) {
        assert.equal(card.props.description.type, "AuthorBadge");
        assert.equal(card.props.description.props.author, original.owned_by.trim());
    } else assert.equal(card.props.description, undefined, "model badges do not occupy the compact description");
}
const imageSrc = card => card.props.image?.type(card.props.image.props)?.props.src;

test("single and multiple model configurations keep compact cards free of model badges", () => {
    for (const ids of [["openai/chat-latest"], ["openai/chat-latest", "openai/gpt-6.1-sol", "openai/gpt-6-luna"]]) {
        const original = agent(ids);
        const before = JSON.stringify(original);
        const card = AgentCard({ agent: original, providerIcons: openaiIcons });
        assertCompactCard(card, original);
        assert.equal(imageSrc(card), "openai-light.svg");
        assert.equal(JSON.stringify(original), before);
    }
});

test("mixed-provider model names do not replace the compact owner badge or mutate configuration", () => {
    const ids = ["openai/shared", "other/shared", "openai-compatible/shared", "openai/another"];
    const original = { ...agent(ids), owned_by: " Team " };
    const before = structuredClone(original);
    const card = AgentCard({ agent: original, providerIcons: [...openaiIcons, { src: "other.svg", providerId: "other" }] });
    assertCompactCard(card, original);
    assert.equal(imageSrc(card), "openai-light.svg");
    assert.deepEqual(original, before);
});

test("cards follow the exact light/dark logo, even when it is not from the first model", () => {
    const providerIcons = [
        { src: "openai-light.svg", theme: "light", providerId: "openai" },
        { src: "other-dark.svg", theme: "dark", providerId: "other" },
    ];
    try {
        for (const [isDarkMode, expectedImage] of [
            [false, "openai-light.svg"],
            [true, "other-dark.svg"],
        ]) {
            darkMode = isDarkMode;
            const original = agent(["openai/shared", "other/shared"]);
            const card = AgentCard({ agent: original, providerIcons });
            assert.equal(imageSrc(card), expectedImage);
            assertCompactCard(card, original);
        }
    } finally { darkMode = false; }
});

test("theme fallback uses the first icon and empty or missing logos preserve compact card content", () => {
    const original = agent(["openai/model", "other/model"]);
    const fallback = AgentCard({ agent: original, providerIcons: [{ src: "other.svg", providerId: "other" }] });
    assert.equal(imageSrc(fallback), "other.svg");
    assertCompactCard(fallback, original);
    for (const providerIcons of [undefined, [], [{ src: "", providerId: "openai" }], [{ src: "unknown.svg" }]]) {
        assertCompactCard(AgentCard({ agent: original, providerIcons }), original);
    }
});

test("custom agent logos override provider artwork and never establish provider identity", () => {
    for (const icons of [[{ src: "custom.svg" }], openaiIcons]) {
        const original = { ...agent(["openai/first", "openai/second"]), icons };
        const card = AgentCard({ agent: original, providerIcons: openaiIcons });
        assertCompactCard(card, original);
        assert.equal(imageSrc(card), icons[0].src);
    }
    const empty = { ...agent(["openai/first"]), icons: [] };
    assert.equal(imageSrc(AgentCard({ agent: empty, providerIcons: openaiIcons })), "openai-light.svg");
});

test("legacy, models-only, and combined agents preserve model selection, order, and nested paths", () => {
    const base = agent([]);
    for (const original of [
        { ...base, model: { id: "openai/org/model" }, models: undefined },
        { ...base, model: { id: "openai/org/model" } },
        { ...base, models: [{ id: "openai/org/model" }] },
        { ...base, model: { id: "other/legacy" }, models: [{ id: "openai/org/model" }] },
    ]) {
        const before = structuredClone(original);
        assertCompactCard(AgentCard({ agent: original, providerIcons: openaiIcons }), original);
        assert.deepEqual(original, before);
    }
    for (const original of [base, agent(["unprefixed", "openai/"])]) {
        assertCompactCard(AgentCard({ agent: original, providerIcons: openaiIcons }), original);
    }
});

function overview(agents, remoteAgentModels, providers) {
    const state = { agents, remoteAgentModels, favoriteAgentIds: [] };
    const { AgentsPage } = load(feature + "AgentsPage.tsx", {
        ...shared,
        react: {
            ...React, useMemo: factory => factory(), useCallback: callback => callback,
            useRef: () => ({ current: null }), useEffect() {},
            useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
        },
        "aihappey-components": { useTheme: () => theme, AgentCard: "AgentCard", FilterDrawerPanel: "FilterDrawerPanel", StickyHeaderActionBar: "StickyHeaderActionBar" },
        "aihappey-state": { useAppStore: selector => selector(state), getAgentModelProviderKey: id => String(id ?? "").trim().split("/").filter(Boolean)[0] ?? "" },
        "../../ui/layout/OverviewPageHeader": { OverviewPageHeader: "OverviewPageHeader" },
        "./AgentEditModal": { AgentEditModal: "AgentEditModal" },
        "react-dnd-html5-backend": { NativeTypes: { FILE: "file" } },
        "react-dnd": { useDrop: () => [{ isOver: false }, () => {}] },
        "../../runtime/providers/providerMetadata": { PROVIDERS: providers },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "aihappey-plugins": { usePlugins: () => ({ items: [] }) },
        "aihappey-skills": { useSkills: () => ({ items: [] }) },
        "./agentTags": load(feature + "agentTags.ts"),
        "./remoteAgentDetails": require("./credential-test-loader.cjs").load(feature + "remoteAgentDetails.ts"),
        "./agentPluginConversion": {},
        "../chat/context/ChatContext": { useChatContext: () => ({ config: { endpoints: { models: "/models" } } }) },
    });
    const tree = AgentsPage();
    return nodes(nodes(tree, "Tab").find(tab => tab.props.eventKey === "all"), "AgentCard");
}

test("local and remote cards retain per-icon provider identity without modifying agents or catalog metadata", () => {
    const original = agent(["openai/first", "openai/second", "other/third"]);
    const providers = {
        openai: { icons: openaiIcons.map(({ providerId, ...icon }) => icon) },
        other: { icons: [{ src: "other.svg" }] },
    };
    const before = JSON.stringify({ original, providers });
    const cards = overview([original], [{ id: "remote/example", agent: original }], providers);
    assert.equal(cards.length, 2);
    for (const node of cards) {
        assert.deepEqual(node.props.providerIcons, [...openaiIcons, { src: "other.svg", providerId: "other" }]);
        const card = AgentCard(node.props);
        assertCompactCard(card, node.props.agent);
    }
    assert.equal(JSON.stringify({ original, providers }), before);
});

test("ambiguous shared logo URLs remain unknown after deduplication, even if a provider repeats later", () => {
    const original = agent(["openai/first", "other/second", "openai/third"]);
    const providers = { openai: { icons: [{ src: "shared.svg" }] }, other: { icons: [{ src: "shared.svg" }] } };
    const [node] = overview([original], [], providers);
    assert.deepEqual(node.props.providerIcons, [{ src: "shared.svg", providerId: undefined }]);
    assertCompactCard(AgentCard(node.props), original);
});

test("exports retain full model IDs and contain no UI-only provider identity metadata", async t => {
    const original = agent(["openai/first", "other/second"]);
    let exported;
    const previousDocument = global.document;
    global.document = { createElement: () => ({ click() {} }) };
    t.mock.method(URL, "createObjectURL", blob => { exported = blob; return "blob:test"; });
    t.mock.method(URL, "revokeObjectURL", () => {});
    try {
        const card = AgentCard({ agent: original, providerIcons: openaiIcons });
        await nodes(card.props.actions, "Button").find(button => button.props.icon === "download").props.onClick();
        assert.deepEqual(JSON.parse(await exported.text()), original);
    } finally {
        if (previousDocument === undefined) delete global.document;
        else global.document = previousDocument;
    }
});

test("absent plugin actions disappear from the menu without removing other actions", () => {
    const original = agent(["openai/model"]);
    const onDelete = () => {}, onEdit = () => {}, onToggleFavorite = () => {}, onSaveAsPlugin = () => {};
    const card = AgentCard({ agent: original, onDelete, onEdit, onToggleFavorite });
    assert.deepEqual(card.props.headerActions.props.items.map(item => item.key), ["delete"]);
    assert.equal(card.props.headerActions.props.items[0].onClick, onDelete);
    assert.deepEqual(nodes(card.props.actions, "Button").map(button => button.props.icon), ["download", "edit"]);
    assert.equal(AgentCard({ agent: original }).props.headerActions, undefined, "no empty context menu on remote cards");
    const eligible = AgentCard({ agent: original, onSaveAsPlugin, saveAsPluginDisabled: true });
    const [save] = eligible.props.headerActions.props.items;
    assert.equal(save.key, "save-as-plugin");
    assert.equal(save.onClick, onSaveAsPlugin);
    assert.equal(save.disabled, true);
});
