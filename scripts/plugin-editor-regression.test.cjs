const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { renderer, nodes } = require("./react-test-renderer.cjs");

const root = path.resolve(__dirname, "..");
function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(path.join(root, filename), "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react/jsx-runtime") return require(id);
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}
const constants = load("packages/aihappey-plugins/src/constants.ts");
const { validatePluginManifest } = load("packages/aihappey-plugins/src/validation.ts", { "./constants": constants });
const theme = new Proxy({}, { get: (_, name) => name });
const key = name => `pluginsPage.editor.${name}`;

function harness(initial = {}) {
    const render = renderer();
    const saves = [];
    const props = { open: true, mode: "create", skillOptions: [], mcpOptions: [],
        initialSelectedSkillIds: [], initialSelectedMcpIds: [], onClose() {}, onSave: value => saves.push(value), ...initial };
    const { PluginEditModal } = load("packages/aihappey-components/src/modals/PluginEditModal.tsx", {
        react: render.react,
        "aihappey-plugins": constants,
        "aihappey-i18n": { useTranslation: () => ({ t: value => value }) },
        "../theme/ThemeContext": { useTheme: () => theme },
        "../fields/LimitedTextField": { LimitedTextField: "LimitedTextField" },
        "../forms/model-context/ServerManagement": { ServerManagement: "ServerManagement" },
        "../badges/VersionBadge": { VersionBadge: "VersionBadge" },
        "../badges/SizeBadge": { SizeBadge: "SizeBadge" },
    });
    const h = {
        props, saves,
        render() { render.render(PluginEditModal, props); return render.render(PluginEditModal, props); },
        field(label) { return nodes(h.render(), "Input").find(node => node.props.label === label); },
        change(label, value) { h.field(label).props.onChange({ target: { value } }); },
        save() {
            const button = nodes(h.render(), "Button").find(node => node.props.variant === "primary");
            assert.equal(button.props.disabled, false);
            button.props.onClick();
            return saves.at(-1);
        },
    };
    return h;
}

test("General ends with optional free-text License after Repository and retains browser placeholders", () => {
    const h = harness();
    const general = nodes(h.render(), "Tab").find(node => node.props.eventKey === "general");
    const inputs = nodes(general, "Input");
    assert.deepEqual(inputs.map(node => node.props.label), ["name", key("version"), key("homepage"), key("repository"), key("license")]);
    assert.ok(inputs.every(node => typeof node.props.placeholder === "string" && node.props.placeholder.endsWith("Placeholder")));
    assert.equal(nodes(general, "TextArea")[0].props.rows, 5);
    const license = h.field(key("license"));
    assert.equal(license.props.value, "");
    assert.notEqual(license.props.required, true);
    assert.notEqual(license.props.type, "url");
    assert.equal(license.props.pattern, undefined);
    assert.equal(license.props.placeholder, key("licensePlaceholder"));
});

test("create trims License, accepts non-SPDX metadata, and omits a blank License", () => {
    const h = harness();
    h.change("name", "deployment.tools");
    h.change(key("license"), "  Company-specific terms (2026)  ");
    h.change(key("version"), "release candidate");
    h.change(key("homepage"), "internal documentation");
    h.change(key("repository"), "ask the team");
    h.change(key("authorEmail"), "internal directory");
    h.change(key("authorUrl"), "internal profile");
    const { manifest } = h.save();
    assert.equal(manifest.license, "Company-specific terms (2026)");
    assert.deepEqual(validatePluginManifest(manifest), { value: manifest, diagnostics: [] });
    h.change(key("license"), " \n ");
    assert.equal(Object.hasOwn(h.save().manifest, "license"), false);
});

test("edit initializes and clears License without changing extension data, MCP, skills, files or the source plugin", () => {
    const plugin = {
        name: "deployment.tools",
        manifest: { $schema: constants.PLUGIN_SCHEMA_URL, name: "deployment.tools", license: "MIT", description: "Existing",
            author: { name: "Author", email: "internal", url: "directory" }, keywords: ["saved"],
            extensions: { "com.example.opaque": { future: [1, "value"] } } },
        files: [{ path: "references/info.txt", size: 4 }],
        mcp: { mcpServers: { local: { type: "stdio", command: "node" } } },
    };
    const before = structuredClone(plugin);
    const h = harness({ mode: "edit", plugin, initialSelectedSkillIds: ["embedded:greet"],
        mcpOptions: [{ id: "remote", label: "Remote", config: { type: "http", url: "https://example.org/mcp" } }],
        initialServerSettings: { remote: { namespace: true } } });
    assert.equal(h.field(key("license")).props.value, "MIT");
    assert.equal(h.field("name").props.disabled, true);
    h.change(key("license"), "Apache-2.0");
    assert.equal(h.save().manifest.license, "Apache-2.0");
    h.change(key("license"), "");
    const saved = h.save();
    const { license, ...withoutLicense } = before.manifest;
    assert.deepEqual(saved.manifest, withoutLicense);
    assert.deepEqual(saved.files, before.files);
    assert.deepEqual(saved.mcpServers, before.mcp.mcpServers);
    assert.deepEqual(saved.selectedSkillIds, ["embedded:greet"]);
    assert.deepEqual(saved.selectedMcpIds, ["remote"]);
    assert.deepEqual(saved.serverSettings, { remote: { namespace: true } });
    assert.deepEqual(plugin, before);
});

test("reopening edit or create resets unsaved License and never carries it between plugins", () => {
    const h = harness({ mode: "edit", plugin: { manifest: { name: "first", license: "MIT" } } });
    assert.equal(h.field(key("license")).props.value, "MIT");
    h.change(key("license"), "unsaved");
    h.props.open = false; h.render();
    h.props.open = true;
    assert.equal(h.field(key("license")).props.value, "MIT");
    h.props.open = false; h.render();
    h.props.plugin = { manifest: { name: "second", license: "Apache-2.0" } }; h.props.open = true;
    assert.equal(h.field(key("license")).props.value, "Apache-2.0");
    h.props.open = false; h.render();
    h.props.plugin = undefined; h.props.mode = "create"; h.props.open = true;
    assert.equal(h.field(key("license")).props.value, "");
});

test("Labels keep Enter/Add, exact duplicate prevention, individual removal and string-array storage", () => {
    const h = harness();
    h.change("name", "labels");
    const enter = value => {
        h.change(key("keywords"), value);
        let prevented = false;
        h.field(key("keywords")).props.onKeyDown({ key: "Enter", preventDefault() { prevented = true; } });
        assert.equal(prevented, true);
    };
    enter(" saved "); enter("saved"); enter("   ");
    h.change(key("keywords"), "one, whole label");
    nodes(h.render(), "Button").find(node => node.props.title === "add").props.onClick();
    assert.deepEqual(h.save().manifest.keywords, ["saved", "one, whole label"]);
    nodes(h.render(), "Tags")[0].props.onRemove("saved");
    assert.deepEqual(h.save().manifest.keywords, ["one, whole label"]);
    assert.equal(Object.hasOwn(h.save().manifest, "labels"), false);
});

test("all existing plugin-editor locales have translated License placeholders", () => {
    const directory = path.join(root, "packages/aihappey-i18n/src/locales");
    let checked = 0;
    for (const locale of fs.readdirSync(directory)) {
        const file = path.join(directory, locale, `${locale}.json`);
        if (!fs.existsSync(file)) continue;
        const editor = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")).pluginsPage?.editor;
        if (!editor) continue;
        assert.ok(editor.licensePlaceholder?.includes("MIT") && editor.licensePlaceholder.includes("Apache-2.0"), locale);
        checked++;
    }
    assert.ok(checked >= 18);
});

test("manifest JSON types stay mandatory without requiring metadata format syntax", () => {
    const minimal = { $schema: constants.PLUGIN_SCHEMA_URL, name: "types" };
    for (const field of ["license", "version", "homepage", "repository", "description"]) {
        assert.ok(validatePluginManifest({ ...minimal, [field]: "custom free text" }).value);
        for (const value of [null, 42, [], {}]) assert.equal(validatePluginManifest({ ...minimal, [field]: value }).value, undefined);
    }
    assert.equal(validatePluginManifest({ ...minimal, keywords: ["valid", 1] }).value, undefined);
});
