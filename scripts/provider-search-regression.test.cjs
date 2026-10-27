const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderer, nodes } = require("./react-test-renderer.cjs");

function load(file, mocks) {
    const output = ts.transpileModule(fs.readFileSync(path.resolve(file), "utf8"), {
        fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id === "react/jsx-runtime") return require(id);
        assert.ok(Object.hasOwn(mocks, id), `Unexpected import ${id}`);
        return mocks[id];
    }, module, module.exports);
    return module.exports;
}

// Execute the real form and theme components. Only third-party UI primitives
// are represented by host nodes, so filtering/state logic cannot be mocked away.
function harness(kind, { generic = false, modalContainer } = {}) {
    const view = renderer();
    const host = type => props => React.createElement(type, props);
    const Dropdown = Object.assign(host("bs-dropdown"), {
        Menu: "bs-menu", Item: "bs-item", Header: "bs-header", Toggle: "bs-toggle", ItemText: "bs-status",
    });
    const portals = [];
    const Select = load(`packages/aihappey-theme-${kind}/src/primitives/Select.tsx`, {
        react: { ...view.react, useRef: initial => {
            const ref = view.react.useRef(initial);
            if (modalContainer) ref.current = { getBoundingClientRect: () => ({ width: 160 }), closest: selector => {
                assert.equal(selector, '[role="dialog"]');
                return modalContainer;
            } };
            return ref;
        } },
        "@fluentui/react-components": { Combobox: "fluent-combo", Option: "fluent-option", OptionGroup: "fluent-group", Field: "fluent-field" },
        "./Button": { iconMap: {} },
        "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
        "react-dom": { createPortal: (children, container) => { portals.push(container); return children; } },
        "react-bootstrap/Dropdown": Dropdown,
        "react-bootstrap/Form": { Group: "bs-field", Label: "bs-label", Text: "bs-hint", Control: "bs-search" },
    }).Select;
    const theme = new Proxy({ Select }, { get: (target, key) => target[key] ?? key });
    const Form = load("packages/aihappey-components/src/forms/providers/ProviderKeysForm.tsx", {
        react: view.react,
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../../theme/ThemeContext": { useTheme: () => theme },
    }).ProviderKeysForm;
    const changes = [];
    const props = generic ? {
        searchable: true, values: ["saved"], valueTitle: "Saved label",
        searchPlaceholder: "Find option", noResultsText: "Nothing found",
        onChange: value => { changes.push(value); props.values = [value]; props.valueTitle = value; },
        children: React.createElement(React.Fragment, null,
            React.createElement("optgroup", { label: "First group" },
                React.createElement("option", { value: "saved" }, "Saved label"),
                React.createElement("option", { value: "internal-id" }, "Different display name")),
            React.createElement("optgroup", { label: "Second group" },
                React.createElement("option", { value: "other" }, "Other label"))),
    } : {
        items: [
            { id: "openai", name: "OpenAI", header: "X-OpenAI-Key" },
            { id: "anthropic", name: "Anthropic", header: "X-Anthropic-Key", searchText: "claude https://console.example" },
            { id: "vertex", name: "Google Cloud", header: "X-Google-Key" },
        ],
        values: { "X-OpenAI-Key": "existing-key" },
        onChange: async (header, value) => { changes.push([header, value]); props.values = { ...props.values, [header]: value }; },
        onRemove() {},
    };
    const Component = generic ? Select : Form;
    let tree;
    const render = () => tree = view.render(Component, props);
    const button = label => nodes(tree, "Button").find(n => n.props.icon === label || n.props.children === label);
    const options = () => nodes(tree, kind === "fluent" ? "fluent-option" : "bs-item").filter(n => !n.props.disabled);
    const search = value => {
        const input = nodes(tree, kind === "fluent" ? "fluent-combo" : "bs-search")[0];
        assert.ok(input, `${kind} must expose a real search input`);
        (input.props.onInput ?? input.props.onChange)({ target: { value } });
        render();
    };
    const choose = value => {
        if (kind === "fluent") nodes(tree, "fluent-combo")[0].props.onOptionSelect({}, { optionValue: value, optionText: value });
        else nodes(tree, "bs-dropdown")[0].props.onSelect(value);
        render();
    };
    const open = () => {
        render();
        if (!generic) { button("add").props.onClick(); render(); }
        // Bootstrap's portal effect needs only the host container in these tests.
        if (kind === "bootstrap") render();
    };
    return { props, changes, portals, render, open, search, choose, button, options, get tree() { return tree; } };
}

for (const kind of ["fluent", "bootstrap"]) {
    function setup(t, options) {
        if (kind === "bootstrap") {
            const previous = global.document;
            global.document = { body: {} };
            t.after(() => { if (previous === undefined) delete global.document; else global.document = previous; });
        }
        const h = harness(kind, options);
        h.open();
        return h;
    }

    test(`${kind}: actual provider picker filters by normalized name and provider ID, not aliases/URLs`, t => {
        const h = setup(t);
        assert.deepEqual(h.options().map(n => n.props.children), ["Anthropic", "Google Cloud"]);
        h.search("  ANTHROPIC  ");
        assert.deepEqual(h.options().map(n => n.props.children), ["Anthropic"]);
        h.search(" VERTEX ");
        assert.deepEqual(h.options().map(n => n.props.children), ["Google Cloud"]);
        for (const query of ["claude", "https://console.example", "no-provider"]) {
            h.search(query);
            assert.deepEqual(h.options(), []);
            const status = nodes(h.tree, "div").find(n => n.props.role === "status") ?? nodes(h.tree, "bs-status")[0];
            assert.ok(status, "no results must be announced");
            assert.equal(status.props.children, "noResults");
        }
        h.search("");
        assert.equal(h.options().length, 2);
        assert.deepEqual(h.changes, []);
    });

    test(`${kind}: search selection survives key entry, saves the header and resets on cancel/reopen`, async t => {
        const h = setup(t);
        h.search("vertex");
        h.choose("X-Google-Key");
        let input = nodes(h.tree, "Input").find(n => !n.props.readOnly);
        input.props.onChange({ target: { value: "new-key" } });
        h.render();
        const selected = nodes(h.tree, kind === "fluent" ? "fluent-combo" : "bs-toggle")[0];
        assert.equal(kind === "fluent" ? selected.props.value : selected.props.children, "Google Cloud");
        assert.equal(h.button("save").props.disabled, false);
        await h.button("save").props.onClick();
        h.render();
        assert.deepEqual(h.changes, [["X-Google-Key", "new-key"]]);
        assert.equal(nodes(h.tree, "Input").find(n => n.props.value === "new-key").props.type, "password");
        h.button("add").props.onClick(); h.render();
        h.search("missing");
        h.button("cancel").props.onClick(); h.render();
        h.button("add").props.onClick(); h.render();
        assert.deepEqual(h.options().map(n => n.props.children), ["Anthropic"]);
        input = nodes(h.tree, "Input").find(n => !n.props.readOnly);
        assert.equal(input.props.value, "");
        h.props.disabled = true; h.render(); h.render();
        assert.equal(h.options().length, 0);
        assert.equal(h.button("add").props.disabled, true);
    });

    test(`${kind}: generic search preserves grouped label/value filtering and controlled multiselection`, t => {
        const h = setup(t, { generic: true });
        h.props.multiselect = true; h.render();
        h.search(" INTERNAL-ID ");
        assert.deepEqual(h.options().map(n => n.props.children), ["Different display name"]);
        assert.equal(nodes(h.tree, kind === "fluent" ? "fluent-group" : "bs-header").length, 1);
        assert.deepEqual(h.props.values, ["saved"]);
        h.search("Other label");
        assert.deepEqual(h.options().map(n => n.props.children), ["Other label"]);
        h.search("");
        assert.equal(h.options().length, 3);
        h.props.disabled = true; h.render();
        const input = nodes(h.tree, kind === "fluent" ? "fluent-combo" : "bs-search")[0];
        assert.equal(input.props.disabled, true);
        h.props.searchable = false; h.render();
        assert.equal(h.options().length, 3);
        if (kind === "bootstrap") assert.equal(nodes(h.tree, "bs-search").length, 0);
        assert.deepEqual(h.changes, []);
    });

    test(`${kind}: closing resets search without changing selection and forwards the existing callback`, t => {
        const h = setup(t, { generic: true });
        const calls = [];
        if (kind === "fluent") h.props.onOpenChange = (...args) => calls.push(args);
        else h.props.onToggle = (...args) => calls.push(args);
        h.render();
        h.search("no-option");
        assert.equal(h.options().length, 0);
        const event = {};
        const metadata = kind === "fluent" ? { open: false } : { source: "keydown" };
        if (kind === "fluent") nodes(h.tree, "fluent-combo")[0].props.onOpenChange(event, metadata);
        else nodes(h.tree, "bs-dropdown")[0].props.onToggle(false, metadata);
        h.render();
        assert.equal(h.options().length, 3);
        assert.deepEqual(calls, [[kind === "fluent" ? event : false, metadata]]);
        assert.deepEqual(h.props.values, ["saved"]);
        assert.deepEqual(h.changes, []);
    });
}

test("Fluent freeform completion still delegates its query and preserves supplied results", () => {
    const h = harness("fluent", { generic: true });
    const queries = [];
    h.props.freeform = true;
    h.props.onFilter = async query => { queries.push(query); };
    h.open();
    h.search("remote query");
    assert.equal(queries.at(-1), "remote query");
    assert.equal(h.options().length, 3, "remote completion owns the options, not local filtering");
    h.choose("other");
    assert.deepEqual(h.changes, ["other"]);
});

test("Bootstrap search transfers arrow-key focus to filtered results without committing a selection", t => {
    const previous = global.document;
    global.document = { body: {} };
    t.after(() => { if (previous === undefined) delete global.document; else global.document = previous; });
    const h = harness("bootstrap", { generic: true });
    h.open();
    h.search("label");
    const input = nodes(h.tree, "bs-search")[0];
    const focused = [];
    const items = [{ focus: () => focused.push("first") }, { focus: () => focused.push("last") }];
    for (const key of ["ArrowDown", "ArrowUp"]) {
        let prevented = false, stopped = false;
        input.props.onKeyDown({
            key,
            currentTarget: { closest: () => ({ querySelectorAll: () => items }) },
            preventDefault() { prevented = true; }, stopPropagation() { stopped = true; },
        });
        assert.equal(prevented, true);
        assert.equal(stopped, true);
    }
    assert.deepEqual(focused, ["first", "last"]);
    assert.deepEqual(h.changes, []);
});

test("Bootstrap portalled results stay inside their dialog focus boundary, with a body fallback", t => {
    const previous = global.document;
    const previousWindow = global.window;
    const body = {};
    global.document = { body };
    global.window = { addEventListener() {}, removeEventListener() {} };
    t.after(() => {
        if (previous === undefined) delete global.document; else global.document = previous;
        if (previousWindow === undefined) delete global.window; else global.window = previousWindow;
    });
    const modal = {};
    const inside = harness("bootstrap", { generic: true, modalContainer: modal });
    inside.open();
    assert.ok(inside.portals.length > 0);
    assert.ok(inside.portals.every(container => container === modal));
    const outside = harness("bootstrap", { generic: true });
    outside.open();
    assert.ok(outside.portals.length > 0);
    assert.ok(outside.portals.every(container => container === body));
});
