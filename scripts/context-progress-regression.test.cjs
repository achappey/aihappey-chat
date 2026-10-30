const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");

const jsx = (type, props) => ({ type, props });
const mocks = {
    react: {},
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    "aihappey-i18n": { useTranslation: () => ({ i18n: { language: "en" }, t: (key, values) => ({ key, values }) }) },
    "../theme/ThemeContext": { useTheme: () => ({ ProgressBar: "theme-progress" }) },
    "@fluentui/react-components": { ProgressBar: "fluent-progress", Field: "field", Tooltip: "tooltip" },
};
function load(path, name, globals = {}) {
    let source = fs.readFileSync(path, "utf8");
    if (name) {
        const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        source = file.statements.find(s => ts.isVariableStatement(s)
            && s.declarationList.declarations.some(d => d.name.getText(file) === name)).getText(file);
    }
    const code = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", ...Object.keys(globals), code)(id => {
        assert.ok(id in mocks, `Unexpected import ${id}`); return mocks[id];
    }, module, module.exports, ...Object.values(globals));
    return module.exports;
}
const { ContextProgressBar } = load("packages/aihappey-components/src/progressbars/ContextProgressBar.tsx");
const { ToolContent } = load("packages/aihappey-components/src/fields/ToolContent.tsx");
const { ProgressBar: Fluent } = load("packages/aihappey-theme-fluent/src/primitives/ProgressBar.tsx");
const { ProgressBar: Shadcn } = load("packages/aihappey-theme-shadcn/src/primitives.tsx", "ProgressBar", {
    cn: (...classes) => classes.filter(Boolean).join(" "), ProgressPrimitive: { Root: "root", Indicator: "indicator" },
});

for (const [used, capacity, percent] of [[0, 1000, 0], [250, 1000, 25], [4700, 1100000, 4700 / 1100000 * 100],
    [1, 100, 1], [1000, 1000, 100], [2000, 1000, 100], [-1, 1000, 0], [NaN, 1000, 0], [Infinity, 1000, 0]]) {
    test(`context usage ${used}/${capacity} renders ${percent}% consistently in shadcn and Fluent`, () => {
        const context = ContextProgressBar({ tokenUsage: used, context_window: capacity });
        assert.equal(context.props.value, percent);
        const shadcn = Shadcn(context.props).props.children[0];
        assert.equal(shadcn.props.value, percent);
        assert.equal(shadcn.props.children.props.style.width, `${percent}%`);
        const fluent = Fluent({ value: context.props.value });
        assert.equal(fluent.props.children.props.value, percent / 100);
    });
}
test("unknown/invalid context capacities hide the indicator", () => {
    for (const capacity of [undefined, 0, -1, NaN, Infinity])
        assert.equal(ContextProgressBar({ context_window: capacity, tokenUsage: 100 }), undefined);
});
test("context labels retain actual over-capacity usage and available space never becomes negative", () => {
    const result = ContextProgressBar({ tokenUsage: 2000, context_window: 1000, max_output_tokens: 500 });
    assert.equal(result.props.label, "2K/1K");
    const tooltip = result.props.tooltipContent.props.children;
    assert.equal(tooltip[2].props.children.values.availableSpace, "0");
    assert.equal(Fluent(result.props).type, "tooltip");
});
test("shadcn indeterminate progress does not retain a determinate fill", () => {
    const root = Shadcn({ value: 50, animated: true }).props.children[0];
    assert.equal(root.props.value, undefined);
    assert.equal(root.props.children.props.style, undefined);
});
test("tool progress also follows the percentage contract without regressing Fluent", () => {
    const result = ToolContent({ invocation: { type: "tool-fixture" }, progress: { progress: 1, total: 200 } });
    const bar = result.props.children.at(-1);
    assert.equal(bar.props.value, .5);
    assert.equal(Fluent(bar.props).props.children.props.value, .005);
});
