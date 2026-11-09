const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");

const filename = "packages/aihappey-core/src/shell/connectors/CloudStorageAvailability.ts";
const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function("require", "module", "exports", code)(id => {
    assert.equal(id, "react");
    return React;
}, loaded, loaded.exports);
const { isCloudStorageAvailable } = loaded.exports;

test("cloud capability requires the optional conversation endpoint and usable scopes", () => {
    for (const [url, scopes, expected] of [
        [undefined, undefined, false], ["", ["conversation.read"], false],
        ["   ", ["conversation.read"], false], ["https://cloud.example/conversations", undefined, false],
        ["https://cloud.example/conversations", [], false], ["https://cloud.example/conversations", [" "], false],
        ["https://cloud.example/conversations", ["conversation.read"], true],
    ]) assert.equal(isCloudStorageAvailable(url, scopes), expected);
});

test("default-enabled Cloud never refreshes tokens without conversation capability or after opting out", () => {
    const filename = "packages/aihappey-core/src/shell/CoreShell.tsx";
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let effect;
    function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === "useEffect"
            && node.arguments[0].getText(source).includes("void refresh()")) effect = node.arguments[0];
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(effect, "the conversation token effect must remain capability-gated");
    const body = ts.transpileModule(`const effect = ${effect.getText(source)}; effect();`, {
        compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText;
    for (const available of [false, true]) {
        for (const connected of [false, true]) {
            let calls = 0;
            new Function("cloudStorageAvailable", "remoteStorageConnected", "refresh", body)(available, connected, () => { calls++; });
            assert.equal(calls, available && connected ? 1 : 0);
        }
    }
    assert.match(source.text, /CloudStorageAvailabilityContext\.Provider value=\{cloudStorageAvailable\}/);
});
