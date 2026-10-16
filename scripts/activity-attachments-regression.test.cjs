const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const root = path.resolve(__dirname, "..");
const activity = "packages/aihappey-core/src/features/chat/activity/";
function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(path.join(root, filename), "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react/jsx-runtime") return require(id);
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}
const { collectActivityAttachments } = load(activity + "attachments.ts");
const file = (url, filename, extra = {}) => ({ type: "file", mediaType: "text/plain", url, filename, ...extra });
const message = (role, parts, id = role) => ({ id, role, parts });
const tool = content => ({ type: "tool-files", output: { content } });

test("collects user uploads and assistant/MCP files without treating sources or tool inputs as attachments", () => {
    const input = file("data:text/plain;base64,YQ==", "input.txt");
    const output = file("https://example.com/output.txt", "output.txt", { size: 42 });
    const messages = [
        message("user", [input]),
        message("assistant", [output, { type: "source-url", url: "https://example.com/source" }, {
            ...tool([
                { type: "image", mimeType: "image/png", data: "Yg==" },
                { type: "audio", mimeType: "audio/wav", data: "Yw==" },
                { type: "resource", resource: { uri: "file:///report.pdf", mimeType: "application/pdf", blob: "ZA==" } },
                { type: "resource", resource: { uri: "localcanvas:///notes.md", mimeType: "text/markdown", text: "é" } },
                { type: "resource_link", uri: "https://example.com/a.csv", name: "a.csv", mimeType: "text/csv", size: 100 },
            ]),
            input: { type: "file", url: "https://example.com/not-output" },
        }]),
    ];
    const before = JSON.stringify(messages);
    const result = collectActivityAttachments(messages);
    assert.equal(result.input.length, 1);
    assert.equal(result.output.length, 6);
    assert.equal(result.output[0].size, 42);
    assert.equal(result.output[1].url, "data:image/png;base64,Yg==");
    assert.equal(result.output[2].url, "data:audio/wav;base64,Yw==");
    assert.equal(result.output[3].filename, "report.pdf");
    assert.equal(result.output[3].url, "data:application/pdf;base64,ZA==");
    assert.equal(result.output[4].url, "data:text/markdown,%C3%A9");
    assert.equal(result.output[4].size, 2);
    assert.equal(result.output[5].size, 100);
    assert.equal(JSON.stringify(messages), before);
});

test("deduplicates payloads across turns and tool/file representations, not filenames or direction", () => {
    const messages = [
        message("user", [file("YQ==", "same.txt"), file("Yg==", "same.txt")]),
        message("user", [file("data:text/plain;base64,YQ==", "same.txt")], "later"),
        message("assistant", [
            tool([{ type: "resource", resource: { mimeType: "text/plain", blob: "YQ==" } }]),
            file("data:text/plain;base64,YQ==", "named.txt", { size: 1 }),
        ]),
    ];
    const result = collectActivityAttachments(messages);
    assert.equal(result.input.length, 2);
    assert.equal(result.output.length, 1);
    assert.equal(result.output[0].filename, "named.txt");
    assert.equal(result.output[0].size, 1);
});

test("keeps the latest generated image preview per message and handles incomplete or changing conversations", () => {
    const generated = url => file(url, undefined, {
        mediaType: "image/png", providerMetadata: { openai: { generated_image_id: "image", filename: "image.png" } },
    });
    assert.deepEqual(collectActivityAttachments(), { input: [], output: [] });
    assert.deepEqual(collectActivityAttachments([message("assistant", [
        { type: "tool-files", state: "input-streaming" }, tool([null, { type: "resource" }]), file("", "missing"),
    ])]), { input: [], output: [] });
    const first = message("assistant", [generated("YQ=="), generated("Yg==")]);
    assert.equal(collectActivityAttachments([first]).output[0].url, "data:image/png;base64,Yg==");
    const second = message("assistant", [file("https://example.com/new", "new.txt")], "next");
    assert.equal(collectActivityAttachments([first, second]).output.length, 2);
    assert.deepEqual(collectActivityAttachments([message("user", [])]).output, []);
});

function findAll(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [
        ...(predicate(node) ? [node] : []),
        ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate)),
    ];
}

test("Input/Output navigation is compact, accessible, keyboard-operable, and follows conversation updates", t => {
    const previousDocument = global.document;
    let focused;
    global.document = { getElementById: id => ({ focus: () => { focused = id; } }) };
    t.after(() => { global.document = previousDocument; });
    const slots = [];
    let index = 0;
    const { AttachmentsActivity } = load(activity + "tabs/AttachmentsActivity.tsx", {
        react: {
            ...React, useId: () => "attachments",
            useMemo: factory => factory(), useEffect: () => {},
            useState(initial) {
                const i = index++;
                if (!(i in slots)) slots[i] = initial;
                return [slots[i], next => { slots[i] = next; }];
            },
        },
        "aihappey-components": { FileAttachmentCard: "FileAttachmentCard", useTheme: () => ({ ToggleButton: "ToggleButton" }) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../../../files/FileDetailModal": { FileDetailModal: "FileDetailModal" },
        "../attachments": { collectActivityAttachments },
    });
    const render = messages => { index = 0; return AttachmentsActivity({ messages }); };
    const messages = [message("user", [file("YQ==", "input.txt")]), message("assistant", [file("Yg==", "output.txt")])];
    let tree = render(messages);
    const tabs = findAll(tree, n => n.props.role === "tab");
    assert.equal(findAll(tree, n => n.props.role === "tablist")[0].props["aria-orientation"], "vertical");
    assert.deepEqual(tabs.map(tab => [tab.props["aria-label"], tab.props.title, tab.props.children]), [
        ["input", "input", undefined], ["output", "output", undefined],
    ]);
    assert.equal(tabs[0].props["aria-selected"], true);
    assert.equal(tabs[1].props.tabIndex, -1);
    assert.equal(findAll(tree, n => n.type === "FileAttachmentCard")[0].props.file.filename, "input.txt");
    tabs[0].props.onKeyDown({ key: "ArrowDown", preventDefault() {}, });
    assert.equal(focused, "attachments-output");
    tree = render(messages);
    assert.equal(findAll(tree, n => n.props.role === "tab")[1].props["aria-selected"], true);
    const outputCard = findAll(tree, n => n.type === "FileAttachmentCard")[0];
    assert.equal(outputCard.props.file.filename, "output.txt");
    outputCard.props.onPreview();
    tree = render(messages);
    assert.equal(findAll(tree, n => n.type === "FileDetailModal")[0].props.open, true);
    tree = render([...messages, message("assistant", [file("Yw==", "new.txt")], "next")]);
    assert.equal(findAll(tree, n => n.type === "FileAttachmentCard").length, 2);
    assert.equal(findAll(tree, n => n.type === "FileDetailModal")[0].props.open, true);
    tree = render([message("user", [], "another-conversation")]);
    assert.equal(findAll(tree, n => n.type === "FileAttachmentCard").length, 0);
    assert.equal(findAll(tree, n => n.props.role === "status").length, 1);
    assert.equal(findAll(tree, n => n.type === "FileDetailModal")[0].props.open, false);
});

test("attachment cards expose MIME/known sizes, preview and download, but never actions for unsafe resource schemes", async () => {
    const theme = {
        Card: ({ title, description, actions }) => React.createElement("article", null, title, description, actions),
        Button: props => React.createElement("button", props),
        Image: () => null,
    };
    const { FileAttachmentCard } = load("packages/aihappey-components/src/cards/FileAttachmentCard.tsx", {
        mime: { getExtension: () => "txt" },
        "../theme/ThemeContext": { useTheme: () => theme },
        "../buttons": { OpenLinkButton: () => React.createElement("a", null, "open") },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../badges": {
            MimeTypeBadge: ({ mimeType }) => React.createElement("span", null, mimeType),
            SizeBadge: ({ bytes }) => bytes == null ? null : React.createElement("span", null, `${bytes} bytes`),
        },
    });
    const render = props => renderToStaticMarkup(React.createElement(FileAttachmentCard, props));
    const local = render({ file: file("data:text/plain;base64,YQ==", "note.txt"), onPreview() {} });
    assert.match(local, /note.txt/);
    assert.match(local, /text\/plain/);
    assert.match(local, /1 bytes/);
    assert.match(local, /aria-label="view"/);
    assert.match(local, /aria-label="download"/);
    const remote = render({ file: file("https://example.com/note.txt"), size: 123 });
    assert.match(remote, /123 bytes/);
    assert.match(remote, />open</);
    assert.match(remote, /aria-label="download"/);
    const unsafe = render({ file: file("javascript:alert(1)", "unsafe"), onPreview() {} });
    assert.doesNotMatch(unsafe, /<button\b|<a\b/);
    const textResource = collectActivityAttachments([message("assistant", [
        tool([{ type: "resource", resource: { text: "hello é", mimeType: "text/plain" } }]),
    ])]).output[0];
    const response = await fetch(textResource.url);
    assert.equal(await response.text(), "hello é");
});
