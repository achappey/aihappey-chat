const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { createStore } = require("zustand/vanilla");
const { persist } = require("zustand/middleware");

const root = path.resolve(__dirname, "..");
const components = "packages/aihappey-components/src/";
const read = filename => fs.readFileSync(path.join(root, filename), "utf8");
function load(filename, mocks = {}) {
    const output = ts.transpileModule(read(filename), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react" || id === "react/jsx-runtime") return require(id);
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

const translations = Object.fromEntries(["en", "nl"].map(language => [
    language, JSON.parse(read(`packages/aihappey-i18n/src/locales/${language}/${language}.json`)),
]));
let language = "en";
const theme = {
    Badge: ({ title, icon, children }) => React.createElement("span", { title, "data-icon": icon }, children),
    Button: ({ children }) => React.createElement("button", null, children),
    Chat: ({ messages, renderReactions }) => React.createElement(React.Fragment, null,
        messages.map(msg => React.createElement("section", { key: msg.id }, renderReactions(msg)))),
};
const shared = {
    "../theme/ThemeContext": { useTheme: () => theme },
    "aihappey-i18n": { useTranslation: () => ({ t: key => translations[language][key] ?? key }) },
};
const performanceBadges = load(components + "badges/PerformanceBadges.tsx", shared);
const { CostBadge } = load(components + "badges/CostBadge.tsx", shared);
const { MessageActions } = load(components + "buttons/MessageActions.tsx", {
    ...shared,
    "../badges": { ...performanceBadges, CostBadge, TokenBadge: () => null },
    "../buttons": { CopyToClipboardButton: () => null },
    "./SourcesButton": { SourcesButton: () => null },
});
const { MessageList } = load(components + "lists/MessageList.tsx", {
    ...shared,
    "../fields/ToolContent": { ToolContent: () => null },
    "../buttons/MessageActions": { MessageActions },
    "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
});
const { toChatMessages, summarizeAssistantGatewayCost } = load(
    "packages/aihappey-core/src/features/chat/messages/toChatMessages.ts",
    { "aihappey-types": { SYSTEM_ROLE: "system" } },
);
const gateway = { cost: 0.00081375, ttft: 1.9497438, tps: 4557.565558827654 };
const uiMessage = (metadata = { providerMetadata: { gateway } }, role = "assistant", parts = [{ type: "text", text: "Answer" }]) => ({
    id: "response", role, metadata: { timestamp: "2026-10-22T11:35:20Z", ...metadata }, parts,
});
const renderActions = (msg, props = {}) => renderToStaticMarkup(React.createElement(MessageActions, {
    msg, page: 0, max: 0, onSetPage() {}, ...props,
}));
const countMetrics = html => (html.match(/data-icon="(?:timeToFirstToken|tokensPerSecond)"/g) ?? []).length;

test("the preference defaults off, toggles independently, and survives persistence and reload", () => {
    const ui = load("packages/aihappey-state/src/slices/uiSlice.ts", { "aihappey-mcp": {} });
    let options;
    const { withPersist } = load("packages/aihappey-state/src/persist.ts", {
        "zustand/middleware": { persist: (creator, value) => { options = value; return creator; } },
        "./slices/chatSlice": {}, "./slices/chatEndpoint": {}, "./slices/uiSlice": ui,
        "./slices/apiKeyEncryption": {}, "./slices/providerHeaders": {},
        "./slices/defaultProviderTranscriptionMetadata": { normalizeProviderTranscriptionMetadata: value => value },
    });
    withPersist(ui.createUiSlice);
    let stored;
    const storage = {
        getItem: () => stored,
        setItem: (_, value) => { stored = JSON.parse(JSON.stringify(value)); },
        removeItem: () => { stored = undefined; },
    };
    const makeStore = () => createStore(persist(ui.createUiSlice, { ...options, storage }));
    const store = makeStore();
    assert.equal(store.getState().showMessageMetrics, false);
    store.getState().setShowMessageMetrics(true);
    assert.equal(store.getState().showMessageMetrics, true);
    assert.equal(store.getState().showMessageTokens, undefined);
    assert.equal(stored.state.showMessageMetrics, true);
    assert.equal(makeStore().getState().showMessageMetrics, true);
    store.getState().setShowMessageMetrics(false);
    assert.equal(makeStore().getState().showMessageMetrics, false);
    stored = { state: { showMessageTokens: true }, version: options.version };
    const legacy = makeStore();
    assert.equal(legacy.getState().showMessageMetrics, false);
    assert.equal(legacy.getState().showMessageTokens, true);
    const settings = read("packages/aihappey-core/src/features/user-settings/SettingsModal.tsx");
    assert.match(settings, /eventKey="chat"[\s\S]*?id="metrics-toggle"[\s\S]*?checked=\{!!showMessageMetrics\}[\s\S]*?label=\{t\("settingsModal.showMetrics"\)\}[\s\S]*?onChange=\{setShowMessageMetrics\}/);
    assert.equal(translations.en.settingsModal.showMetrics, "Show metrics");
    assert.equal(translations.nl.settingsModal.showMetrics, "Toon metingen");
});

test("gateway performance values reach assistant display messages without changing costs or source metadata", () => {
    const original = uiMessage();
    const before = JSON.stringify(original);
    const [message] = toChatMessages([original]);
    assert.equal(message.ttft, gateway.ttft);
    assert.equal(message.tps, gateway.tps);
    assert.equal(message.cost, gateway.cost);
    assert.equal(JSON.stringify(original), before);
    assert.deepEqual(summarizeAssistantGatewayCost(original), { cost: gateway.cost, count: 1 });
});

test("legacy gateway metadata, partial metrics, and valid zeros work independently", () => {
    for (const metadata of [
        { providerMetadata: { gateway: { ttft: 0, tps: 0 } } },
        { gateway: { ttft: 0, tps: 0 } },
    ]) {
        const [message] = toChatMessages([uiMessage(metadata)]);
        assert.equal(message.ttft, 0);
        assert.equal(message.tps, 0);
    }
    const [ttftOnly] = toChatMessages([uiMessage({ providerMetadata: { gateway: { ttft: 1.5 } } })]);
    assert.equal(ttftOnly.ttft, 1.5);
    assert.equal(ttftOnly.tps, undefined);
    const [tpsOnly] = toChatMessages([uiMessage({ providerMetadata: { gateway: { tps: 42 } } })]);
    assert.equal(tpsOnly.ttft, undefined);
    assert.equal(tpsOnly.tps, 42);
    assert.equal(countMetrics(renderActions(ttftOnly, { showMetrics: true })), 1);
    assert.equal(countMetrics(renderActions(tpsOnly, { showMetrics: true })), 1);
});

test("missing, negative, non-finite, and malformed values never create performance badges", () => {
    for (const invalid of [undefined, null, -1, Infinity, -Infinity, NaN, "1.95", "", true, {}, []]) {
        const [message] = toChatMessages([uiMessage({ providerMetadata: { gateway: { ttft: invalid, tps: invalid } } })]);
        assert.equal(message.ttft, undefined);
        assert.equal(message.tps, undefined);
        assert.equal(countMetrics(renderActions(message, { showMetrics: true })), 0);
        for (const Badge of Object.values(performanceBadges)) {
            assert.equal(renderToStaticMarkup(React.createElement(Badge, { value: invalid })), "");
        }
    }
    const [message] = toChatMessages([uiMessage({})]);
    assert.equal(countMetrics(renderActions(message, { showMetrics: true })), 0);
    const [partial] = toChatMessages([uiMessage({ providerMetadata: { gateway: { ttft: -1, tps: 42 } } })]);
    assert.equal(countMetrics(renderActions(partial, { showMetrics: true })), 1);
});

test("performance metrics never come from user messages or tool-call costs and throughput is not summed", () => {
    const [user] = toChatMessages([uiMessage(undefined, "user")]);
    assert.equal(user.ttft, undefined);
    assert.equal(user.tps, undefined);
    const tool = { type: "tool-example", toolCallId: "call", output: { content: [], _meta: { gateway: { cost: 0.2, ttft: 99, tps: 999 } } } };
    const message = uiMessage(undefined, "assistant", [tool, { type: "text", text: "Answer" }]);
    const mapped = toChatMessages([message]);
    assert.ok(mapped.length > 1);
    for (const block of mapped) {
        assert.equal(block.ttft, gateway.ttft);
        assert.equal(block.tps, gateway.tps);
        assert.equal(block.cost, gateway.cost + 0.2);
    }
    const toolOnly = toChatMessages([uiMessage({}, "assistant", [tool, { type: "text", text: "Answer" }])]);
    for (const block of toolOnly) {
        assert.equal(block.ttft, undefined);
        assert.equal(block.tps, undefined);
    }
});

test("performance metadata is preserved across text, activity, and media display blocks", () => {
    const parts = [
        { type: "reasoning", text: "Thinking" },
        { type: "text", text: "Answer" },
        ...["image/png", "video/mp4", "audio/mpeg"].map(mediaType => ({ type: "file", mediaType, url: "https://example.test/file" })),
    ];
    const messages = toChatMessages([uiMessage(undefined, "assistant", parts)]);
    assert.equal(messages.length, 5);
    assert.ok(messages.every(msg => msg.ttft === gateway.ttft && msg.tps === gateway.tps));
});

test("badges are opt-in, assistant-only, independent of token visibility, and hidden with usage actions", () => {
    const [message] = toChatMessages([uiMessage()]);
    for (const props of [{}, { showMetrics: false }, { showMetrics: true, hideAssistantUsageActions: true }]) {
        assert.equal(countMetrics(renderActions(message, props)), 0);
    }
    assert.equal(countMetrics(renderActions(message, { showMetrics: true, showTokens: false })), 2);
    assert.equal(countMetrics(renderActions({ ...message, role: "user" }, { showMetrics: true })), 0);
    assert.match(renderActions(message), /data-icon="pricing"/);
    assert.match(renderActions(message, { showMetrics: true }), /data-icon="pricing"/);
    assert.equal(countMetrics(renderActions({ ...message, ttft: 0, tps: 0 }, { showMetrics: true })), 2);
});

test("the shared list forwards opt-in and suppresses badges on reasoning and tool blocks", () => {
    const [message] = toChatMessages([uiMessage()]);
    const render = (content, showMetrics) => renderToStaticMarkup(React.createElement(MessageList, {
        messages: [{ ...message, content }], showMetrics, onRenderMarkdown: text => React.createElement("p", null, text),
    }));
    assert.equal(countMetrics(render([{ type: "text", text: "Answer" }], true)), 2);
    assert.equal(countMetrics(render([{ type: "text", text: "Answer" }], false)), 0);
    for (const type of ["reasoning", "tool-example"]) {
        assert.equal(countMetrics(render([{ type, text: "Activity" }], true)), 0);
    }
    const coreList = read("packages/aihappey-core/src/features/chat/messages/MessageList.tsx");
    assert.match(coreList, /useAppStore\(\(a\) => a\.showMessageMetrics\)/);
    assert.match(coreList, /showMetrics=\{showMessageMetrics\}/);
});

test("badge numbers use the browser locale, not the chosen translation language", () => {
    const OriginalNumberFormat = Intl.NumberFormat;
    try {
        for (const [locale, translationLanguage, seconds, tokens] of [
            ["en-US", "nl", "1.95 s", "4,558 tok/s"],
            ["nl-NL", "en", "1,95 s", "4.558 tok/s"],
        ]) {
            language = translationLanguage;
            Intl.NumberFormat = function (locales, options) {
                assert.equal(locales, undefined, "Use the browser default locale");
                return new OriginalNumberFormat(locale, options);
            };
            const ttft = renderToStaticMarkup(React.createElement(performanceBadges.TimeToFirstTokenBadge, { value: gateway.ttft }));
            const tps = renderToStaticMarkup(React.createElement(performanceBadges.TokensPerSecondBadge, { value: gateway.tps }));
            assert.ok(ttft.includes(seconds), ttft);
            assert.ok(tps.includes(tokens), tps);
            assert.ok(ttft.includes(`title="${translations[language].timeToFirstToken}"`));
            assert.ok(tps.includes(`title="${translations[language].tokensPerSecond}"`));
        }
    } finally {
        Intl.NumberFormat = OriginalNumberFormat;
        language = "en";
    }
    assert.equal(translations.en.timeToFirstToken, "Time to first token");
    assert.equal(translations.en.tokensPerSecond, "Tokens per second");
    assert.equal(translations.nl.timeToFirstToken, "Tijd tot eerste token");
    assert.equal(translations.nl.tokensPerSecond, "Tokens per seconde");
});

test("both distinct semantic icons are mapped in every shipped theme", () => {
    const tokens = read("packages/aihappey-types/src/theme/IconToken.ts");
    assert.match(tokens, /\| "timeToFirstToken"/);
    assert.match(tokens, /\| "tokensPerSecond"/);
    for (const file of [
        "bootstrap/src/primitives/IconMap.tsx", "fluent/src/primitives/Button.tsx",
        "html/src/primitives.tsx", "chakra/src/primitives.tsx", "shadcn/src/primitives.tsx",
        "material/src/primitives/icons.tsx", "mantine/src/primitives.tsx",
    ]) {
        const source = read("packages/aihappey-theme-" + file);
        const ttft = source.match(/timeToFirstToken: ([^,\n]+)/)?.[1];
        const tps = source.match(/tokensPerSecond: ([^,\n]+)/)?.[1];
        assert.ok(ttft, file);
        assert.ok(tps, file);
        assert.notEqual(ttft, tps, file);
    }
});
