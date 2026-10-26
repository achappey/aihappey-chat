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
const feature = "packages/aihappey-core/src/features/agents/";
const helpers = load(feature + "agentIcons.ts");
const { selectCapabilityIcon } = load("packages/aihappey-components/src/images/selectCapabilityIcon.ts");
const base = () => ({ name: "Example", description: "Description", instructions: "Help", model: { id: "openai/model" }, tags: ["Raw tag"], future: { keep: true } });
function nodes(node, type) {
    if (!React.isValidElement(node)) return [];
    return [...(node.type === type ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => nodes(child, type))];
}

test("icon edits are immutable and preserve MIME type, sizes, future metadata, and unrelated agent fields", () => {
    const original = { ...base(), icons: [{ src: "https://example.com/old.svg", theme: "dark", mimeType: "image/svg+xml", sizes: ["any"], future: 7 }] };
    const before = JSON.stringify(original);
    let edited = helpers.updateAgentIcon(original, 0, { src: "https://example.com/new.svg" });
    edited = helpers.updateAgentIcon(edited, 0, { theme: "" });
    assert.equal("theme" in edited.icons[0], false);
    assert.deepEqual(edited.icons[0], { src: "https://example.com/new.svg", mimeType: "image/svg+xml", sizes: ["any"], future: 7 });
    assert.equal(JSON.stringify(original), before, "cancelling must leave the original unchanged");
    assert.deepEqual({ ...edited, icons: original.icons }, original);
    assert.deepEqual(JSON.parse(JSON.stringify(edited)), edited, "portable export/reload retains artwork metadata");
});

test("adding trims URLs, stores lowercase themes or omits them, and removing the last icon restores provider fallback", () => {
    const original = base();
    assert.equal(helpers.addAgentIcon(original, "  ", "dark"), original);
    let edited = helpers.addAgentIcon(original, " https://example.com/any.svg ", "");
    edited = helpers.addAgentIcon(edited, "https://example.com/light.svg", "light");
    edited = helpers.addAgentIcon(edited, "https://example.com/dark.svg", "dark");
    assert.deepEqual(edited.icons, [{ src: "https://example.com/any.svg" }, { src: "https://example.com/light.svg", theme: "light" }, { src: "https://example.com/dark.svg", theme: "dark" }]);
    edited = helpers.updateAgentIcon(edited, 0, { src: " " });
    assert.equal(helpers.prepareAgentIconsForSave(edited).icons.length, 2);
    for (let i = 0; i < 3; i++) edited = helpers.removeAgentIcon(edited, 0);
    assert.equal(edited.icons, undefined);
    assert.equal("icons" in JSON.parse(JSON.stringify(edited)), false);
    assert.equal(original.icons, undefined);
});

test("custom icon selection prefers matching theme, then neutral, then another custom image", () => {
    const dark = { src: "dark.svg", theme: "dark" }, neutral = { src: "neutral.svg" }, light = { src: "light.svg", theme: "light" };
    assert.equal(selectCapabilityIcon([dark, neutral, light], false), light);
    assert.equal(selectCapabilityIcon([light, neutral, dark], true), dark);
    assert.equal(selectCapabilityIcon([dark, neutral], false), neutral);
    assert.equal(selectCapabilityIcon([light, neutral], true), neutral);
    assert.equal(selectCapabilityIcon([dark], false), dark);
    assert.equal(selectCapabilityIcon([], true), undefined);
});

test("icon form uses themed controls with add, URL editing, optional theme selection, and remove actions", () => {
    let agent = base(), cursor = 0;
    const slots = [];
    const theme = new Proxy({}, { get: (_, name) => name });
    const { AgentIconsForm } = load(feature + "AgentIconsForm.tsx", {
        react: { useState(initial) { const slot = cursor++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], value => slots[slot] = value]; } },
        "aihappey-components": { useTheme: () => theme },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) }, "./agentIcons": helpers,
    });
    const render = () => { cursor = 0; return AgentIconsForm({ agent, onChange: update => agent = update(agent) }); };
    const add = () => nodes(render(), "Button").find(button => button.props.children === "agentEdit.iconAdd");
    assert.equal(add().props.disabled, true);
    nodes(render(), "Input")[0].props.onChange({ target: { value: " https://example.com/new.svg " } });
    const select = nodes(render(), "Select")[0];
    assert.deepEqual(nodes(select, "option").map(option => [option.props.value, option.props.children]), [["", "agentEdit.iconThemeAny"], ["light", "agentEdit.iconThemeLight"], ["dark", "agentEdit.iconThemeDark"]]);
    select.props.onChange("dark");
    assert.equal(add().props.disabled, false); add().props.onClick();
    assert.deepEqual(agent.icons, [{ src: "https://example.com/new.svg", theme: "dark" }]);
    assert.equal(nodes(render(), "Input").at(-1).props.value, "");
    nodes(render(), "Input")[0].props.onChange({ target: { value: "https://example.com/edit.svg" } });
    nodes(render(), "Select")[0].props.onChange("");
    assert.deepEqual(agent.icons, [{ src: "https://example.com/edit.svg" }]);
    nodes(render(), "Button").find(button => button.props.title === "agentEdit.iconRemove").props.onClick();
    assert.equal(agent.icons, undefined);
    nodes(render(), "Input")[0].props.onChange({ target: { value: "https://example.com/enter.svg" } });
    let prevented = false;
    nodes(render(), "Input")[0].props.onKeyDown({ key: "Enter", preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(agent.icons, [{ src: "https://example.com/enter.svg" }]);
});

test("Save normalizes icon rows through the actual modal without mutating the original agent", () => {
    const original = { ...base(), icons: [{ src: " " }, { src: " https://example.com/a.svg ", sizes: ["32x32"] }] };
    const before = JSON.stringify(original), saved = [];
    const { AgentEditModal } = load(feature + "AgentEditModal.tsx", {
        react: { useState: initial => [initial, () => {}], useEffect() {} },
        "aihappey-components": { useTheme: () => ({ Modal: "Modal", Button: "Button" }) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "aihappey-state": { useAppStore: selector => selector({ models: [] }) },
        "./agentEditorModels": { hasValidAgentEditorModels: () => true },
        "./AgentForm": { AgentForm: "AgentForm" }, "./agentIcons": helpers,
        "../../ui/buttons/CancelButton": { CancelButton: "CancelButton" },
    });
    const tree = AgentEditModal({ open: true, agent: original, isEditing: true, onClose() {}, onSave: value => saved.push(value) });
    nodes(tree.props.actions, "Button")[0].props.onClick();
    assert.deepEqual(saved[0].icons, [{ src: "https://example.com/a.svg", sizes: ["32x32"] }]);
    assert.equal(JSON.stringify(original), before);
});

test("agent and model filter headings share translated Tags labels in English, Dutch, and Hungarian", () => {
    for (const filename of [feature + "AgentsPage.tsx", "packages/aihappey-core/src/features/models/ModelsPage.tsx"]) {
        const source = fs.readFileSync(filename, "utf8");
        assert.match(source, /t\("agentEdit.tags"\)/);
        assert.doesNotMatch(source, /providers:tags/);
    }
    for (const [locale, expected] of [["en", "Tags"], ["nl", "Tags"], ["hu", "Címkék"]]) {
        const translations = JSON.parse(fs.readFileSync(`packages/aihappey-i18n/src/locales/${locale}/${locale}.json`, "utf8").replace(/^\uFEFF/, "")).agentEdit;
        assert.equal(translations.tags, expected);
        for (const key of ["icons", "iconUrl", "iconTheme", "iconThemeAny", "iconThemeLight", "iconThemeDark", "iconAdd", "iconRemove"]) assert.ok(translations[key]);
        if (locale === "en") assert.deepEqual([translations.iconThemeLight, translations.iconThemeDark], ["Light", "Dark"]);
    }
});
