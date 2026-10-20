const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const React = require("react");
const ts = require("typescript");

const items = [
    { id: "openai", name: "OpenAI", header: "X-OpenAI-Key" },
    { id: "anthropic", name: "Anthropic", header: "X-Anthropic-Key" },
    { id: "google", name: "Google AI", header: "X-Google-Key" },
];

function findAll(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate)),
    ];
}

function harness() {
    const slots = [];
    let index = 0;
    let effects = [];
    const react = {
        useState(initial) {
            const i = index++;
            if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
            return [slots[i], next => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }];
        },
        useMemo: factory => factory(),
        useEffect: effect => effects.push(effect),
    };
    const theme = new Proxy({}, { get: (_, key) => key });
    const mocks = {
        react,
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../../theme/ThemeContext": { useTheme: () => theme },
    };
    const filename = path.resolve(__dirname, "../packages/aihappey-components/src/forms/providers/ProviderKeysForm.tsx");
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
    const changes = [];
    const props = {
        items,
        values: { "X-OpenAI-Key": "existing-key", "X-Google-Key": "   " },
        onChange: async (header, value) => {
            changes.push([header, value]);
            props.values = { ...props.values, [header]: value };
        },
        onRemove: header => { props.values = { ...props.values, [header]: "" }; },
    };
    function render() {
        index = 0;
        effects = [];
        const tree = module.exports.ProviderKeysForm(props);
        effects.forEach(effect => effect());
        return tree;
    }
    return { props, changes, render };
}

const button = (tree, label) => findAll(tree, node => node.type === "Button"
    && (node.props["aria-label"] === label || node.props.children === label))[0];
const picker = tree => findAll(tree, node => node.type === "Select")[0];
const draft = tree => findAll(tree, node => node.type === "Input" && node.props.label === "API key")[0];

test("add-key picker uses built-in translated search and excludes configured providers", () => {
    const h = harness();
    button(h.render(), "add").props.onClick();
    const tree = h.render();
    const select = picker(tree);
    assert.equal(findAll(tree, node => node.type === "SearchBox").length, 0);
    assert.equal(select.props.searchable, true);
    assert.equal(select.props.searchPlaceholder, "searchPlaceholder");
    assert.equal(select.props.noResultsText, "noResults");
    assert.deepEqual(select.props.values, []);
    assert.deepEqual(React.Children.toArray(select.props.children).map(option => [option.props.value, option.props.children]), [
        ["X-Anthropic-Key", "Anthropic"],
        ["X-Google-Key", "Google AI"],
    ]);
    assert.equal(button(tree, "save").props.disabled, true);
});

test("selection persists through key entry, saves the original header, and cancel/reopen resets the editor", async () => {
    const h = harness();
    button(h.render(), "add").props.onClick();
    picker(h.render()).props.onChange("X-Anthropic-Key");
    draft(h.render()).props.onChange({ target: { value: "new-key" } });
    let tree = h.render();
    assert.deepEqual(picker(tree).props.values, ["X-Anthropic-Key"]);
    assert.equal(picker(tree).props.valueTitle, "Anthropic");
    assert.equal(button(tree, "save").props.disabled, false);
    await button(tree, "save").props.onClick();
    assert.deepEqual(h.changes, [["X-Anthropic-Key", "new-key"]]);
    assert.equal(picker(h.render()), undefined);

    button(h.render(), "add").props.onClick();
    tree = h.render();
    assert.deepEqual(React.Children.toArray(picker(tree).props.children).map(option => option.props.value), ["X-Google-Key"]);
    picker(tree).props.onChange({ target: { value: "X-Google-Key" } });
    draft(h.render()).props.onChange({ target: { value: "discard-me" } });
    button(h.render(), "cancel").props.onClick();
    button(h.render(), "add").props.onClick();
    tree = h.render();
    assert.deepEqual(picker(tree).props.values, []);
    assert.equal(draft(tree).props.value, "");
});

test("editing existing keys bypasses the picker and retains visibility and removal controls", async () => {
    const h = harness();
    button(h.render(), "edit OpenAI").props.onClick();
    assert.equal(picker(h.render()), undefined);
    assert.equal(draft(h.render()).props.value, "existing-key");
    draft(h.render()).props.onChange({ target: { value: "updated-key" } });
    await button(h.render(), "save").props.onClick();
    assert.deepEqual(h.changes, [["X-OpenAI-Key", "updated-key"]]);
    button(h.render(), "view").props.onClick();
    assert.equal(findAll(h.render(), node => node.type === "Input" && node.props.readOnly)[0].props.type, "text");
    button(h.render(), "delete").props.onClick();
    assert.equal(h.props.values["X-OpenAI-Key"], "");
});

test("saving disables the editor and failure retains selection and draft for retry", async () => {
    const h = harness();
    let rejectSave;
    h.props.onChange = () => new Promise((_, reject) => { rejectSave = reject; });
    button(h.render(), "add").props.onClick();
    picker(h.render()).props.onChange("X-Anthropic-Key");
    draft(h.render()).props.onChange({ target: { value: "retry-key" } });
    const saving = button(h.render(), "save").props.onClick();
    let tree = h.render();
    assert.equal(picker(tree).props.disabled, true);
    assert.equal(draft(tree).props.disabled, true);
    assert.equal(button(tree, "cancel").props.disabled, true);
    rejectSave(new Error("Save failed"));
    await saving;
    tree = h.render();
    assert.deepEqual(picker(tree).props.values, ["X-Anthropic-Key"]);
    assert.equal(draft(tree).props.value, "retry-key");
    assert.equal(button(tree, "save").props.disabled, false);
    assert.equal(findAll(tree, node => node.type === "Alert")[0].props.children, "error");

    h.props.disabled = true;
    assert.equal(picker(h.render()), undefined);
    h.props.disabled = false;
    assert.equal(picker(h.render()), undefined);
});
