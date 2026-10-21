const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { createInstance } = require("i18next");

const root = path.resolve(__dirname, "..");
const read = filename => fs.readFileSync(path.join(root, filename), "utf8");
const resources = Object.fromEntries(["en", "nl"].map(language => [language, {
    common: JSON.parse(read(`packages/aihappey-i18n/src/locales/${language}/${language}.json`).replace(/^\uFEFF/, "")),
}]));

async function translator(language) {
    const i18n = createInstance();
    await i18n.init({ lng: language, fallbackLng: "en", defaultNS: "common", resources });
    return i18n.t.bind(i18n);
}

function load(filename, mocks) {
    const output = ts.transpileModule(read(filename), {
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

function nodes(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => nodes(child, predicate)),
    ];
}

test("agent Tags tab title, input label, existing-tag accessible name and placeholder resolve to capitalized Tags", async () => {
    const filename = "packages/aihappey-core/src/features/agents/AgentForm.tsx";
    const source = ts.createSourceFile(filename, read(filename), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const attributes = [];
    function visit(node) {
        if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer)) {
            const expression = node.initializer.expression;
            if (expression && ts.isCallExpression(expression) && expression.expression.getText(source) === "t"
                && expression.arguments[0]?.text === "agentEdit.tags") {
                attributes.push({ name: node.name.getText(source), expression: expression.getText(source) });
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.deepEqual(attributes.map(attribute => attribute.name).sort(), ["aria-label", "label", "placeholder", "title"]);
    assert.doesNotMatch(read(filename), /providers:tags/);
    for (const language of ["en", "nl"]) {
        const t = await translator(language);
        assert.equal(resources[language].common.agentEdit.tags, "Tags");
        for (const attribute of attributes) {
            assert.equal(new Function("t", `return ${attribute.expression}`)(t), "Tags");
        }
    }
});

for (const [language, expected] of Object.entries({
    en: { attachments: "Attachments", input: "Input", output: "Output", empty: "No attachments.",
        error: "Unable to preview this attachment. You can still download it." },
    nl: { attachments: "Bijlages", input: "Invoer", output: "Uitvoer", empty: "Geen bijlagen.",
        error: "Kan geen voorbeeld van deze bijlage weergeven. Je kunt deze nog wel downloaden." },
})) test(`activity attachments render translated tabs, empty state and preview errors in ${language}`, async context => {
    const t = await translator(language);
    const slots = [], effects = [];
    let index = 0;
    context.mock.method(global, "fetch", async () => { throw new Error("Preview unavailable"); });
    const { AttachmentsActivity } = load("packages/aihappey-core/src/features/chat/activity/tabs/AttachmentsActivity.tsx", {
        react: {
            useId: () => "attachments",
            useMemo: factory => factory(),
            useEffect: effect => effects.push(effect),
            useState(initial) {
                const slot = index++;
                if (!(slot in slots)) slots[slot] = initial;
                return [slots[slot], next => { slots[slot] = next; }];
            },
        },
        "aihappey-components": { FileAttachmentCard: "FileAttachmentCard", useTheme: () => ({ ToggleButton: "ToggleButton" }) },
        "aihappey-i18n": { useTranslation: () => ({ t }) },
        "../../../files/FileDetailModal": { FileDetailModal: "FileDetailModal" },
        "../attachments": { collectActivityAttachments: messages => ({ input: messages?.[0]?.parts ?? [], output: [] }) },
    });
    const render = messages => { index = 0; effects.length = 0; return AttachmentsActivity({ messages }); };
    let tree = render([]);
    assert.equal(nodes(tree, node => node.props.role === "tablist")[0].props["aria-label"], expected.attachments);
    assert.deepEqual(nodes(tree, node => node.props.role === "tab").map(tab => [tab.props.title, tab.props["aria-label"]]), [
        [expected.input, expected.input], [expected.output, expected.output],
    ]);
    assert.equal(nodes(tree, node => node.props.role === "status")[0].props.children, expected.empty);
    assert.equal(resources[language].common.activityAttachmentsEmpty, expected.empty);

    const messages = [{ id: "conversation", parts: [{ url: "https://example.com/file.txt", mediaType: "text/plain", filename: "file.txt" }] }];
    tree = render(messages);
    nodes(tree, node => node.type === "FileAttachmentCard")[0].props.onPreview();
    render(messages);
    effects.forEach(effect => effect());
    await new Promise(resolve => setImmediate(resolve));
    tree = render(messages);
    assert.equal(nodes(tree, node => node.props.role === "alert")[0].props.children, expected.error);
    assert.equal(resources[language].common.activityAttachmentPreviewError, expected.error);
    assert.equal(nodes(tree, node => node.type === "FileDetailModal")[0].props.open, false);
    assert.equal(nodes(tree, node => node.type === "FileAttachmentCard").length, 1);
});
