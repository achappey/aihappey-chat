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

function transientDataHarness() {
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
    const { useTransientDataParts } = load(engine + "useTransientDataParts.ts", {
        react,
    });
    return {
        render(id = "one") {
            index = 0;
            const result = useTransientDataParts(id);
            effects.splice(0).forEach(effect => effect());
            return result;
        },
        setEnabled(value) { enabled = value; },
        getEnabled() { return enabled; },
        unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    };
}

const debugPart = (data = "request") => ({ type: "data-aihappey-debug", id: "trace:debug", transient: true, data: { event: data } });
const statusPart = () => ({ type: "data-status", id: "progress", transient: true, data: { status: "working" } });

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
    assert.doesNotMatch(persist, /debugParts|transientDataParts|data-aihappey-debug|data-debug/);
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

test("all transient data types are buffered in arrival order, including repeated IDs; persistent and non-data parts are excluded", () => {
    const h = transientDataHarness();
    const { onData } = h.render();
    const parts = [debugPart(), statusPart(), debugPart("response"), { type: "data-debug", transient: true, data: {} }];
    parts.forEach(onData);
    onData({ type: "data-metadata", data: {} });
    onData({ ...debugPart(), transient: false });
    onData({ type: "data-status", data: {} });
    onData({ type: "text", transient: true, text: "not data" });
    assert.deepEqual(h.render().transientDataParts, parts);
    h.unmount();
});

test("transient data collection and visibility are independent of the API debug toggle", () => {
    const h = transientDataHarness();
    h.setEnabled(false);
    const first = h.render().onData;
    const parts = [statusPart(), debugPart(), debugPart("after enable"), statusPart()];
    first(parts[0]);
    first(parts[1]);
    assert.deepEqual(h.render().transientDataParts, parts.slice(0, 2));
    h.setEnabled(true);
    assert.equal(h.render().onData, first);
    first(parts[2]);
    h.setEnabled(false);
    first(parts[3]);
    assert.equal(h.render().onData, first);
    assert.deepEqual(h.render().transientDataParts, parts);
    h.unmount();
});

test("transient data clears on navigation and unmount; late callbacks cannot repopulate it", () => {
    const h = transientDataHarness();
    const first = h.render().onData;
    first(debugPart());
    first(statusPart());
    assert.equal(h.render().transientDataParts.length, 2);
    assert.deepEqual(h.render("two").transientDataParts, []);
    first(debugPart("late"));
    assert.deepEqual(h.render("two").transientDataParts, []);
    const second = h.render("two").onData;
    second(statusPart());
    assert.equal(h.render("two").transientDataParts.length, 1);
    assert.deepEqual(h.render("one").transientDataParts, []);
    second(debugPart("after return to first conversation"));
    assert.deepEqual(h.render("one").transientDataParts, []);
    const last = h.render("one").onData;
    h.unmount();
    last(debugPart("after unmount"));
    assert.deepEqual(h.render("one").transientDataParts, []);
});

for (const enabled of [true, false]) {
test(`real SDK transient data reaches onData but never history, finish persistence, or later requests (API debug ${enabled})`, async () => {
    const h = transientDataHarness(), requests = [], persisted = [];
    h.setEnabled(enabled);
    const chat = new Chat({
        id: "one", onData: h.render().onData,
        onFinish: ({ message }) => persisted.push(JSON.parse(JSON.stringify(message))),
        transport: new DefaultChatTransport({
            api: "https://backend/api/chat",
            fetch: useAuthFetch({
                chatMode: "chat", getDebugEnabled: h.getEnabled,
                customFetch: async (_, init) => {
                    requests.push({ headers: new Headers(init.headers), body: JSON.parse(init.body) });
                    const chunks = [
                        debugPart("request"),
                        { type: "start", messageId: `assistant-${requests.length}` },
                        debugPart("response"), statusPart(),
                        { type: "data-debug", transient: true, data: { event: "legacy" } },
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
    assert.equal(h.render().transientDataParts.length, 4);
    assert.deepEqual(h.render().transientDataParts.map(part => part.type), [
        "data-aihappey-debug", "data-aihappey-debug", "data-status", "data-debug",
    ]);
    assert.deepEqual(chat.messages.at(-1).parts.filter(p => p.type === "data-metadata"), [
        { type: "data-metadata", id: "metadata", data: { value: 2 } },
    ]);
    await chat.sendMessage({ text: "Second" });
    assert.equal(h.render().transientDataParts.length, 8);
    assert.equal(persisted.length, 2);
    for (const request of requests) {
        assert.equal(request.headers.get("X-AIHappey-Debug"), enabled ? "true" : null);
    }
    for (const value of [chat.messages, persisted, requests.map(request => request.body)]) {
        assert.doesNotMatch(JSON.stringify(value), /data-aihappey-debug|data-status|data-debug|transient/);
    }
    h.unmount();
});
}

test("chat wires the transient data callback and buffer to the Data tab", () => {
    const inner = fs.readFileSync(path.join(root, engine, "VercelChatInner.tsx"), "utf8");
    assert.match(inner, /const \{ onData, transientDataParts \} = useTransientDataParts\(conversationId\)/);
    assert.match(inner, /useChat\(\{[\s\S]*?\bonData,/);
    assert.match(inner, /<ActivityDrawer[^>]*transientDataParts=\{transientDataParts\}/);
});

test("Data tab combines message data and all transient events once without mutating either input, even with API debug disabled", () => {
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
    const h = transientDataHarness();
    h.setEnabled(false);
    const { onData } = h.render();
    onData(debugPart());
    onData(statusPart());
    const transientDataParts = Object.freeze(h.render().transientDataParts);
    for (let i = 0; i < 2; i++) {
        cards.length = 0;
        renderToStaticMarkup(React.createElement(ActivityDrawer, { messages, transientDataParts, uiTree: null }));
        assert.deepEqual(cards, [transientDataParts[1], transientDataParts[0], persistent]);
        assert.deepEqual(messages[0].parts, [persistent]);
        assert.equal(transientDataParts.length, 2);
    }
    h.unmount();
});
