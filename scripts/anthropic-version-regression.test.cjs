const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { renderer, nodes } = require("./react-test-renderer.cjs");
const { load: bundle } = require("./credential-test-loader.cjs");

function formHarness(initialHeaders) {
    const h = renderer(), cache = new Map();
    const theme = new Proxy({}, { get: (_, name) => name });
    function load(filename) {
        filename = path.resolve(filename);
        if (filename.endsWith("ThemeContext.tsx")) return { useTheme: () => theme };
        if (cache.has(filename)) return cache.get(filename).exports;
        const module = { exports: {} }; cache.set(filename, module);
        const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
            fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        }).outputText;
        new Function("require", "module", "exports", code)(id => {
            if (id === "react") return h.react;
            if (id === "aihappey-i18n") return { useTranslation: () => ({ t: key => key }) };
            if (!id.startsWith(".")) return require(id);
            const base = path.resolve(path.dirname(filename), id);
            const resolved = [base + ".tsx", base + ".ts"].find(fs.existsSync);
            assert.ok(resolved, "Unresolved local import " + base);
            return load(resolved);
        }, module, module.exports);
        return module.exports;
    }
    const { AnthropicChatConfigForm } = load("packages/aihappey-components/src/forms/providers/anthropic/AnthropicChatConfigForm.tsx");
    const initialConfig = { max_tokens: 100, service_tier: "auto" };
    const props = { config: structuredClone(initialConfig), headers: structuredClone(initialHeaders),
        updateConfig: value => { props.config = value; }, updateHeaders: value => { props.headers = value; } };
    const render = () => h.render(AnthropicChatConfigForm, props);
    const select = () => nodes(render(), "Select").find(node => node.props.label === "providers:anthropic.apiVersion");
    return { props, render, select, initialConfig };
}

for (const version of [undefined, "2023-06-01", "2026-10-21", "future-version"]) {
    test(`version card reads ${version ?? "legacy fallback"} without modifying preferences and writes only a header`, () => {
        const initial = { "anthropic-beta": "custom", "x-anthropic-trace": "keep", ...(version ? { "AnThRoPiC-VeRsIoN": version } : {}) };
        const h = formHarness(initial);
        const cards = nodes(h.render(), "Card").map(node => node.props.title);
        assert.equal(cards.indexOf("version"), cards.indexOf("other") + 1);
        assert.equal(cards[cards.indexOf("version") + 1], "providers:anthropic.betaHeader");
        assert.deepEqual(h.select().props.values, [version ?? "2023-06-01"]);
        assert.deepEqual(h.props.headers, initial, "opening must not insert a default");
        assert.deepEqual(h.props.config, h.initialConfig);
        for (const next of ["2026-10-21", "2023-06-01"]) {
            h.select().props.onChange(next);
            assert.deepEqual(h.props.headers, { "anthropic-beta": "custom", "x-anthropic-trace": "keep", "anthropic-version": next });
            assert.deepEqual(h.props.config, h.initialConfig, "version must not affect native JSON");
            assert.deepEqual(formHarness(JSON.parse(JSON.stringify(h.props.headers))).select().props.values, [next]);
        }
        assert.deepEqual(initial, { "anthropic-beta": "custom", "x-anthropic-trace": "keep", ...(version ? { "AnThRoPiC-VeRsIoN": version } : {}) });
    });
}

const { createChatRouteHeaders } = bundle("packages/aihappey-core/src/features/chat/engine/chatRouteHeaders.ts");
for (const version of [undefined, "2023-06-01", "2026-10-21", "future-version"]) {
    test(`direct Anthropic routing respects ${version ?? "legacy fallback"} while pinning authentication`, () => {
        const headers = new Headers(createChatRouteHeaders({ directProviderKey: "anthropic", endpoint: "/v1/messages", authenticated: false,
            customHeaders: { "X-Anthropic-Key": "secret" },
            providerHeaders: { ...(version ? { "ANTHROPIC-VERSION": version } : {}), "anthropic-beta": "custom", "x-api-key": "wrong" },
        }));
        assert.equal(headers.get("anthropic-version"), version ?? "2023-06-01");
        assert.equal(headers.get("x-api-key"), "secret");
        assert.equal(headers.get("anthropic-beta"), "custom");
        assert.equal([...headers.keys()].filter(key => key === "anthropic-version").length, 1);
    });
}
