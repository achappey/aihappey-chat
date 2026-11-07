const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createInstance } = require("i18next");
const { load } = require("./credential-test-loader.cjs");
const { renderer, nodes } = require("./react-test-renderer.cjs");

async function translations() {
    const i18n = createInstance();
    await i18n.init({
        lng: "nl", fallbackLng: "en", defaultNS: "common",
        ns: ["common", "providers"], interpolation: { escapeValue: false },
        resources: {
            nl: {
                common: {
                    close: "Sluiten", edit: "", general: "Algemeen", language: "Taal",
                    workflows: { handoffs: { from: "Van", to: "Naar" } },
                    skillsPage: { latestVersionBadge: "Nieuwste {{version}}" },
                    ai: { mesh: { network: "Netwerk", worldProviders_one: "{{count}} aanbieder", worldProviders_other: "{{count}} aanbieders" } },
                },
                providers: {
                    blackbox: { reasoning: "Redeneren", notSet: "Niet ingesteld" },
                    openrouter: { zdr: "Geen gegevensbewaring", notSet: "Niet ingesteld" },
                },
            },
            en: { common: { general: "General", workflows: { handoffs: { from: "From", to: "To" } } } },
        },
    });
    return i18n;
}

function componentFixture(filename, name, i18n) {
    const ui = renderer();
    const theme = new Proxy({}, { get: (_, name) => String(name) });
    const component = load(filename, {
        react: { ...ui.react, useContext: () => theme },
        "aihappey-i18n": { useTranslation: () => ({ t: i18n.t.bind(i18n), i18n }) },
        "react-markdown": { default: "Markdown" },
    })[name];
    return { render: props => ui.render(component, props), theme };
}

test("handoff labels accept the real translator and follow language changes", async () => {
    const i18n = await translations();
    const fixture = componentFixture("packages/aihappey-core/src/features/agents/HandoffsEditor.tsx", "HandoffsEditor", i18n);
    const props = { theme: fixture.theme, t: i18n.t.bind(i18n), agents: [], handoffs: [], setHandoffs() {} };
    assert.deepEqual(nodes(fixture.render(props), "Select").map(node => node.props.label), ["Van", "Naar"]);
    await i18n.changeLanguage("en");
    assert.deepEqual(nodes(fixture.render(props), "Select").map(node => node.props.label), ["From", "To"]);
});

for (const [provider, name, key, title] of [
    ["blackbox", "BlackboxChatConfigForm", "reasoning", "Redeneren"],
    ["openrouter", "OpenRouterChatConfigForm", "zdr", "Geen gegevensbewaring"],
]) {
    test(`${provider} helper preserves namespaced translations and missing-key behavior`, async () => {
        const i18n = await translations();
        const fixture = componentFixture(`packages/aihappey-components/src/forms/providers/${provider}/${name}.tsx`, name, i18n);
        const props = { config: {}, updateConfig() {} };
        assert.ok(nodes(fixture.render(props), "Card").some(node => node.props.title === title));
        i18n.removeResourceBundle("nl", "providers");
        // These helpers historically use nullish fallback, not missing-key fallback.
        assert.ok(nodes(fixture.render(props), "Card").some(node => node.props.title === `${provider}.${key}`));
    });
}

test("skill details preserve absent options, translated labels, interpolation, and empty/missing-key fallback", async () => {
    const i18n = await translations();
    const fixture = componentFixture("packages/aihappey-components/src/modals/SkillDetailsModal.tsx", "SkillDetailsModal", i18n);
    const props = { open: true, versions: [], onClose() {}, onEdit() {} };
    const emptyTree = fixture.render(props);
    // The close label is translated, whereas an empty edit translation retains its fallback.
    assert.equal(nodes(emptyTree, "Button")[0].props.children, "Sluiten");
    assert.ok(nodes(emptyTree, "div").some(node => node.props.children === "No results"));
    const tree = fixture.render({
        ...props,
        skill: { skillId: "demo", name: "Demo", description: "Description", origin: "local", defaultVersion: "1", latestVersion: "2", isDownloaded: true },
    });
    assert.deepEqual(nodes(tree, "Button").map(node => node.props.children).slice(0, 2), ["Edit", "Sluiten"]);
    const badges = nodes(tree, "Card")[0].props.description.props.children;
    assert.ok(badges.some(node => node?.props?.version === "Nieuwste 2"));
    assert.ok(nodes(tree, "Tab").some(node => node.props.title === "Algemeen"));
});

test("the upgraded translator preserves interpolation and plural counts used by mesh components", async () => {
    const i18n = await translations();
    const t = i18n.t.bind(i18n);
    assert.equal(t("ai.mesh.worldProviders", { count: 1 }), "1 aanbieder");
    assert.equal(t("ai.mesh.worldProviders", { count: 3 }), "3 aanbieders");
});

test("mesh data helpers accept the real translator without changing labels or counts", async () => {
    const i18n = await translations();
    const helpers = load("packages/aihappey-core/src/features/providers/mesh/meshData.ts", {
        "aihappey-components": { PROVIDER_LOCATION_ALL_FILTER_VALUE: "all" },
        "aihappey-i18n": { useTranslation: () => ({ t: i18n.t.bind(i18n) }) },
    });
    const args = {
        models: [{ id: "demo/model", type: "language" }],
        providerMetadata: { demo: { name: "Demo", inferenceRegions: ["Europe"] } },
        t: i18n.t.bind(i18n),
    };
    assert.equal(helpers.buildProviderModelGraphData(args).datasets[0].label, "Netwerk");
    const stacked = helpers.buildStackedByProviderTypeData(args);
    assert.deepEqual(stacked.labels, ["Demo"]);
    assert.equal(stacked.datasets[0].label, "Taal");
    assert.deepEqual(stacked.datasets[0].data, [1]);
    assert.deepEqual(helpers.buildModelTypeDistributionData(args).labels, ["Taal"]);
    const heat = helpers.buildRegionTypeHeatData(args);
    assert.deepEqual(heat.labels, ["Europe"]);
    assert.equal(heat.datasets[0].label, "Taal");
    assert.deepEqual(heat.datasets[0].data, [1]);
});
