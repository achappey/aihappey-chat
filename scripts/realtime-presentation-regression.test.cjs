const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
function load(file, mocks) {
    const output = ts.transpileModule(read(file), { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react" || id === "react/jsx-runtime") return require(id);
        throw new Error(`Unmocked ${id}`);
    }, module, module.exports);
    return module.exports;
}
const { toChatMessages } = load("packages/aihappey-core/src/features/chat/messages/toChatMessages.ts", {
    "aihappey-types": { SYSTEM_ROLE: "system" },
});
let rendered;
const { MessageList } = load("packages/aihappey-components/src/lists/MessageList.tsx", {
    "../theme/ThemeContext": { useTheme: () => ({ Chat: props => { rendered = props.messages; return null; } }) },
    "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
    "../fields/ToolContent": { ToolContent: () => null },
    "../buttons/MessageActions": { MessageActions: () => null },
    "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
});
const providers = { openai: { name: "OpenAI", icons: [{ src: "openai.svg", theme: "light" }] },
    google: { name: "Google", icons: [{ src: "google.svg" }] }, noicon: { name: "No icon", icons: [] } };
const message = (role, metadata, parts = [{ type: "text", text: "Hello" }]) => ({ id: role, role, metadata, parts });
function present(original, options = {}) {
    renderToStaticMarkup(React.createElement(MessageList, { messages: toChatMessages([original], providers), providers, ...options }));
    return rendered;
}
test("realtime user model metadata never becomes a model author or provider logo, including hydrated history", () => {
    for (const parts of [[{ type: "text", text: "Hello" }], [{ type: "file", mediaType: "image/png", url: "data:image/png;base64,eA==" }]]) {
        const original = message("user", { realtime: true, model: "openai/gpt-realtime-2" }, parts);
        const before = JSON.stringify(original);
        for (const row of present(JSON.parse(before))) {
            assert.equal(row.author, undefined); assert.equal(row.providerIcon, undefined); assert.equal(row.providerKey, undefined);
        }
        assert.equal(JSON.stringify(original), before);
    }
    assert.equal(present(message("user", { author: "Human", model: "openai/model" }))[0].author, "Human");
});
test("slug-only realtime assistant gets a provider logo and hides only that provider prefix", () => {
    const original = message("assistant", { realtime: true, model: "openai/gpt-realtime-2" });
    assert.equal(present(original)[0].providerIcon.src, "openai.svg");
    assert.equal(present(original)[0].author, "gpt-realtime-2");
    assert.equal(present(original, { disableProviderLogo: true })[0].author, "openai/gpt-realtime-2");
    assert.equal(present(message("assistant", { model: "unknown/model" }))[0].author, "unknown/model");
    assert.equal(present(message("assistant", { model: "noicon/model" }))[0].author, "noicon/model");
});
test("provider metadata stays authoritative and named agents retain their identity", () => {
    const row = present(message("assistant", { model: "openai/model", author: "My agent", providerMetadata: { google: {} } }))[0];
    assert.equal(row.providerIcon.src, "google.svg"); assert.equal(row.author, "My agent");
    assert.equal(present(message("assistant", { model: "openai/model", providerMetadata: { gateway: {} } }))[0].author, "model");
});
test("both realtime loading locations wrap their spinner in a centered flex container", () => {
    const source = read("packages/aihappey-core/src/features/realtime/RealtimePage.tsx");
    assert.match(source, /!modelsLoaded[^\n]+justifyContent: "center"[^\n]+<Spinner/);
    assert.match(source, /busy \? <div[^\n]+justifyContent: "center"[^\n]+<Spinner label/);
});
