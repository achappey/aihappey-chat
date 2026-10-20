const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const React = require("react");
const ts = require("typescript");

const all = "__ALL__";
const enabled = "__ENABLED_PROVIDERS__";
const types = ["language", "image", "speech", "transcription", "audio"];
const models = types.flatMap(type => ["openai", "other"].map(provider => ({
    id: `${provider}/${type}`, type, name: `${provider} ${type}`,
})));

function findAll(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate)),
    ];
}

function harness(enabledProvidersByType) {
    const state = { models, enabledProvidersByType };
    const slots = [];
    let index = 0;
    let pending = [];
    const react = {
        useState(initial) {
            const i = index++;
            if (!(i in slots)) slots[i] = initial;
            return [slots[i], next => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }];
        },
        useMemo: factory => factory(),
        useCallback: callback => callback,
        useEffect: effect => pending.push(effect),
    };
    const theme = new Proxy({}, { get: (_, key) => key });
    const mocks = {
        react,
        "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-components": {
            useTheme: () => theme,
            PROVIDER_LOCATION_ALL_FILTER_VALUE: all,
            toggleProviderLocationMultiSelectValue: (_, value) => [value],
            ModelCard: "ModelCard",
            ModelFavoriteToggleButton: "ModelFavoriteToggleButton",
            StickyHeaderBar: "StickyHeaderBar",
            FilterDrawerPanel: "FilterDrawerPanel",
        },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key, i18n: { language: "en" } }) },
        "../../ui/layout/OverviewPageHeader": { OverviewPageHeader: "OverviewPageHeader" },
        "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
        "../../runtime/providers/providerMetadata": {
            PROVIDERS: { openai: { name: "OpenAI" }, other: { name: "Other" } },
        },
        "react-router": { useNavigate: () => () => {} },
        "aihappey-types": {
            getModelDisplayName: model => model.name,
            getModelProviderKey: id => id.split("/")[0],
            getModelTypeIcon: type => type,
            getModelTypeLabelKey: type => type,
        },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "./modelLaunch": { getModelLaunchConfig: () => undefined, getModelLaunchPath: () => undefined },
    };
    const filename = path.resolve(__dirname, "../packages/aihappey-core/src/features/models/ModelsPage.tsx");
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    function render() {
        let tree;
        for (let pass = 0; pass < 3; pass++) {
            index = 0;
            pending = [];
            tree = module.exports.ModelsPage();
            pending.forEach(effect => effect());
        }
        return tree;
    }
    return {
        state, render,
        ids: tree => findAll(tree, node => node.type === "ModelCard").map(node => node.props.model.id).sort(),
        providerFilter: tree => findAll(tree, node => node.props["aria-label"] === "Model provider filter")[0],
        selectTab(tree, type) {
            findAll(tree, node => node.type === "Tabs")[0].props.onSelect(type);
        },
    };
}

test("Enabled respects independent provider settings for each model type and updates with settings", () => {
    const h = harness({ language: ["Other"], image: ["OpenAI"], speech: ["OpenAI"], transcription: [], audio: [] });
    let tree = h.render();
    assert.deepEqual(h.ids(tree), ["openai/image", "openai/speech", "other/language"]);
    h.selectTab(tree, "language");
    tree = h.render();
    assert.deepEqual(h.ids(tree), ["openai/image", "openai/speech", "other/language"]);
    h.state.enabledProvidersByType = { language: ["OpenAI"], image: [], speech: ["Other"] };
    assert.deepEqual(h.ids(h.render()), ["openai/language", "other/speech"]);
});

test("Enabled remains selected with empty or missing settings; All bypasses provider settings", () => {
    for (const settings of [undefined, {}, { language: [], image: [] }]) {
        const h = harness(settings);
        let tree = h.render();
        assert.deepEqual(h.ids(tree), []);
        assert.equal(h.providerFilter(tree).props.valueTitle, "enabled");
        h.providerFilter(tree).props.onChange({ target: { value: all } });
        tree = h.render();
        assert.deepEqual(h.ids(tree), models.map(model => model.id).sort());
        h.selectTab(tree, "image");
        tree = h.render();
        assert.equal(h.providerFilter(tree).props.valueTitle, "all");
        h.providerFilter(tree).props.onChange({ target: { value: enabled } });
        assert.deepEqual(h.ids(h.render()), []);
    }
});

test("legacy realtime settings apply only to missing audio settings, never explicitly empty audio settings", () => {
    const h = harness({ realtime: ["OpenAI"] });
    assert.deepEqual(h.ids(h.render()), ["openai/audio"]);
    h.state.enabledProvidersByType = { audio: [], realtime: ["OpenAI"] };
    assert.deepEqual(h.ids(h.render()), []);
});

test("explicit provider selections do not apply the Enabled restriction", () => {
    const h = harness({});
    h.providerFilter(h.render()).props.onChange({ target: { value: "openai" } });
    assert.deepEqual(h.ids(h.render()), types.map(type => `openai/${type}`).sort());
});
