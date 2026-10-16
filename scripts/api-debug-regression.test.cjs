const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { Chat } = require("@ai-sdk/react");
const { DefaultChatTransport } = require("ai");

const root = path.resolve(__dirname, "..");
const engine = "packages/aihappey-core/src/features/chat/engine/";
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

const apiDebug = load(engine + "apiDebug.ts");
const { useAuthFetch } = load(engine + "useAuthFetch.ts", {
    react: { useMemo: factory => factory() }, "./apiDebug": apiDebug,
});

function debugHarness() {
    let enabled = true, index = 0, effects = [], slots = [];
    const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
    const react = {
        useState(initial) {
            const i = index++;
            slots[i] ??= { value: initial };
            return [slots[i].value, next => { slots[i].value = typeof next === "function" ? next(slots[i].value) : next; }];
        },
        useRef(initial) { const i = index++; return slots[i] ??= { current: initial }; },
        useMemo(factory, deps) {
            const i = index++;
            if (!same(slots[i]?.deps, deps)) slots[i] = { value: factory(), deps };
            return slots[i].value;
        },
        useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
        useEffect(effect, deps) {
            const i = index++;
            if (!same(slots[i]?.deps, deps)) effects.push(() => {
                slots[i]?.cleanup?.();
                slots[i] = { deps, cleanup: effect() };
            });
        },
    };
    const state = () => ({ apiDebugEnabled: enabled });
    const { useTransientDebugParts } = load(engine + "useTransientDebugParts.ts", {
        react, "aihappey-state": { store: { getState: state }, useAppStore: selector => selector(state()) },
    });
    return {
        render(id = "one") {
            index = 0;
            const result = useTransientDebugParts(id);
            effects.splice(0).forEach(effect => effect());
            return result;
        },
        setEnabled(value) { enabled = value; },
        unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    };
}

const debugPart = (data = "request") => ({ type: "data-debug", transient: true, data: { event: data } });

test("API debug defaults off and only the preference belongs to persisted settings", () => {
    const { createUiSlice } = load("packages/aihappey-state/src/slices/uiSlice.ts", { "aihappey-mcp": {} });
    let state;
    state = createUiSlice(patch => Object.assign(state, typeof patch === "function" ? patch(state) : patch), () => state, {});
    assert.equal(state.apiDebugEnabled, false);
    state.setApiDebugEnabled(true);
    assert.equal(state.apiDebugEnabled, true);
    const settings = fs.readFileSync(path.join(root, "packages/aihappey-core/src/features/user-settings/SettingsModal.tsx"), "utf8");
    assert.match(settings, /id="api-debug-toggle"[\s\S]*?checked=\{apiDebugEnabled\}[\s\S]*?onChange=\{setApiDebugEnabled\}/);
    const persist = fs.readFileSync(path.join(root, "packages/aihappey-state/src/persist.ts"), "utf8");
    assert.match(persist, /apiDebugEnabled: s.apiDebugEnabled/);
    assert.doesNotMatch(persist, /debugParts|data-debug/);
});

test("pinned auth fetch reads current opt-in and removes debug headers for other endpoints or when disabled", async () => {
    let enabled = false;
    const requests = [];
    const fetcher = useAuthFetch({
        chatMode: "chat", getDebugEnabled: () => enabled,
        headers: { "x-aihappey-debug": "true", "x-existing": "kept" },
        customFetch: async (input, init) => {
            requests.push({ input, headers: new Headers(init?.headers ?? input.headers) });
            return new Response();
        },
    });
    await fetcher("https://backend/prefix/api/chat");
    assert.equal(requests.at(-1).headers.has("X-AIHappey-Debug"), false);
    enabled = true;
    for (const input of [
        "/api/chat", "https://backend/api/chat?test=1",
        new URL("https://backend/api/chat"), new Request("https://backend/api/chat"),
    ]) {
        await fetcher(input);
        assert.equal(requests.at(-1).headers.get("X-AIHappey-Debug"), "true");
        assert.equal(requests.at(-1).headers.get("x-existing"), "kept");
    }
    for (const endpoint of ["/v1/messages", "/v1/chat/completions", "/api/decisions", "/api/chat/id/stream"]) {
        await fetcher(endpoint, { headers: { "X-AIHappey-Debug": "true" } });
        assert.equal(requests.at(-1).headers.has("X-AIHappey-Debug"), false);
    }
    enabled = false;
    await fetcher("/api/chat", { headers: { "X-AIHappey-Debug": "true" } });
    assert.equal(requests.at(-1).headers.has("X-AIHappey-Debug"), false);
});

test("disabling during asynchronous authentication omits the debug header", async () => {
    let enabled = true, resolveToken;
    const token = new Promise(resolve => { resolveToken = resolve; });
    let headers;
    const fetcher = useAuthFetch({
        chatMode: "chat", getDebugEnabled: () => enabled, getAccessToken: () => token,
        customFetch: async (_, init) => { headers = new Headers(init.headers); return new Response(); },
    });
    const pending = fetcher("/api/chat");
    enabled = false;
    resolveToken("");
    await pending;
    assert.equal(headers.has("X-AIHappey-Debug"), false);
});

test("transient debug state clears on navigation, disable, and unmount; late callbacks cannot repopulate it", () => {
    const h = debugHarness();
    const first = h.render().onData;
    first(debugPart());
    first({ type: "data-metadata", transient: true, data: {} });
    first({ type: "data-debug", data: {} });
    assert.equal(h.render().debugParts.length, 1);
    assert.deepEqual(h.render("two").debugParts, []);
    first(debugPart("late"));
    assert.deepEqual(h.render("two").debugParts, []);
    const second = h.render("two").onData;
    second(debugPart());
    h.setEnabled(false);
    second(debugPart("before rerender"));
    assert.deepEqual(h.render("two").debugParts, []);
    h.setEnabled(true);
    assert.deepEqual(h.render("two").debugParts, []);
    second(debugPart("after reenable"));
    assert.deepEqual(h.render("two").debugParts, []);
    const last = h.render("two").onData;
    h.unmount();
    last(debugPart("after unmount"));
    assert.deepEqual(h.render("two").debugParts, []);
});

test("real SDK transient debug events reach onData but never history, finish persistence, or later requests", async () => {
    const h = debugHarness(), requests = [], persisted = [];
    const chat = new Chat({
        id: "one", onData: h.render().onData,
        onFinish: ({ message }) => persisted.push(JSON.parse(JSON.stringify(message))),
        transport: new DefaultChatTransport({
            api: "https://backend/api/chat",
            fetch: useAuthFetch({
                chatMode: "chat", getDebugEnabled: () => true,
                customFetch: async (_, init) => {
                    requests.push({ headers: new Headers(init.headers), body: JSON.parse(init.body) });
                    const chunks = [
                        { type: "start", messageId: `assistant-${requests.length}` },
                        debugPart("request"), debugPart("response"),
                        { type: "data-metadata", id: "metadata", data: { value: 1 } },
                        { type: "data-metadata", id: "metadata", data: { value: 2 } },
                        { type: "text-start", id: "text" },
                        { type: "text-delta", id: "text", delta: "Hello" },
                        { type: "text-end", id: "text" },
                        { type: "finish", finishReason: "stop" },
                    ];
                    return new Response(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n", {
                        headers: { "Content-Type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
                    });
                },
            }),
        }),
    });
    await chat.sendMessage({ text: "First" });
    assert.equal(h.render().debugParts.length, 2);
    assert.equal(chat.messages.at(-1).parts.filter(p => p.type === "data-metadata").length, 1);
    await chat.sendMessage({ text: "Second" });
    assert.equal(h.render().debugParts.length, 4);
    assert.equal(requests[0].headers.get("X-AIHappey-Debug"), "true");
    for (const value of [chat.messages, persisted, requests.map(request => request.body)]) {
        assert.doesNotMatch(JSON.stringify(value), /data-debug|transient/);
    }
    h.unmount();
});

test("Data tab combines message data and debug events once without mutating either input", () => {
    const cards = [];
    const { DataActivity } = load("packages/aihappey-core/src/features/chat/activity/content/DataActivity.tsx", {
        react: React, "aihappey-components": {
            DataCard: ({ block }) => { cards.push(block); return null; },
        },
    });
    const passthrough = ({ children }) => children;
    const { ActivityDrawer } = load("packages/aihappey-core/src/features/chat/activity/drawer/ActivityDrawer.tsx", {
        react: { ...React, useState: () => ["dataParts", () => {}] },
        "aihappey-components": { useTheme: () => ({ Drawer: passthrough, Tabs: passthrough, Tab: passthrough, Button: () => null }) },
        "aihappey-state": { useAppStore: selector => selector({ showActivities: true }) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../content/ToolInvocationsActivity": { ToolInvocationsActivity: () => null },
        "../tabs/CanvasActivity": { CanvasActivity: () => null },
        "../tabs/AttachmentsActivity": { AttachmentsActivity: () => null },
        "../content/DataActivity": { DataActivity },
        "../../../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
    });
    const persistent = { type: "data-metadata", data: { value: 2 } };
    const messages = [{ id: "assistant", role: "assistant", parts: [persistent] }];
    const debugParts = Object.freeze([debugPart()]);
    for (let i = 0; i < 2; i++) {
        cards.length = 0;
        renderToStaticMarkup(React.createElement(ActivityDrawer, { messages, debugParts, uiTree: null }));
        assert.deepEqual(cards, [debugParts[0], persistent]);
        assert.deepEqual(messages[0].parts, [persistent]);
        assert.equal(debugParts.length, 1);
    }
});
