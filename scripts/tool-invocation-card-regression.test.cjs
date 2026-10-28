const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");

function render(props, { loading = false } = {}) {
    const filename = "packages/aihappey-components/src/cards/ToolInvocationCard.tsx";
    const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    let state = 0;
    const mocks = {
        react: { ...React, useState: initial => [state++ === 1 ? loading : initial, () => {}] },
        "../theme/ThemeContext": { useTheme: () => ({ Card: "Card", Button: "Button", Spinner: "Spinner", JsonViewer: "JsonViewer", Badge: "Badge" }) },
        "../images/CapabilityIcon": { CapabilityIcon: "CapabilityIcon" },
        "../buttons/ViewButton": { ViewButton: "ViewButton" },
        "../badges/ToolInvocationStateBadge": { ToolInvocationStateBadge: "ToolInvocationStateBadge" },
        "../badges/SizeBadge": { SizeBadge: "SizeBadge" },
    };
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports.ToolInvocationCard(props);
}

const invocation = { type: "tool-example", state: "output-available", input: { query: "example" }, output: { result: "done" } };
const children = node => React.Children.toArray(node.props.children);

test("tool footer owns wrapping button gaps and vertical breathing room without restyling the shared card", () => {
    const before = JSON.stringify(invocation);
    const card = render({ invocation, onShowOutput() {}, getToolExplanation() {}, renderToolExplanation() {} });
    assert.equal(card.type, "Card");
    assert.equal(card.props.style, undefined);
    assert.equal(card.props.actions.type, "div");
    assert.deepEqual(card.props.actions.props.style, { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingBlock: 4 });
    assert.deepEqual(children(card.props.actions).map(node => node.type), ["ViewButton", "Button"]);
    assert.equal(JSON.stringify(invocation), before);
});

test("spaced actions preserve output and explanation payloads and busy behavior", async () => {
    let shown, explained;
    const tool = { name: "example", icons: [{ src: "tool.svg" }] };
    const props = { invocation, tool, onShowOutput: value => { shown = value; },
        getToolExplanation: async (...args) => { explained = args; return "Explanation"; }, renderToolExplanation() {} };
    const card = render(props);
    const [view, explain] = children(card.props.actions);
    view.props.onClick();
    await explain.props.onClick();
    assert.equal(shown, invocation.output);
    assert.deepEqual(explained, [invocation, tool]);
    assert.equal(explain.props.icon, "explainTool");
    assert.equal(card.props.image.props.icons, tool.icons);
    assert.ok(children(render(props, { loading: true }).props.actions).every(node => node.props.disabled));
});

test("optional actions and provider artwork keep their existing conditions", () => {
    const icons = [{ src: "provider.svg" }];
    const card = render({ invocation: { ...invocation, state: "input-available", providerExecuted: true }, providerIcons: icons, onShowOutput() {} });
    assert.equal(children(card.props.actions).length, 0);
    assert.equal(card.props.image.props.icons, icons);
    assert.equal(children(render({ invocation, onShowOutput() {} }).props.actions).length, 1);
});
