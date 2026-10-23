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
const read = filename => fs.readFileSync(path.join(root, filename), "utf8").replace(/^\uFEFF/, "");
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
    Button: ({ title, icon, disabled, onClick, children }) => React.createElement("button", { title, "data-icon": icon, disabled, onClick }, children),
    Chat: ({ messages, renderReactions }) => React.createElement(React.Fragment, null,
        messages.map(msg => React.createElement("section", { key: msg.id, "data-message-id": msg.id }, renderReactions(msg)))),
};
const shared = {
    "../theme/ThemeContext": { useTheme: () => theme },
    "aihappey-i18n": { useTranslation: () => ({ t: key => translations[language][key] ?? key }) },
};
const performanceBadges = load(components + "badges/PerformanceBadges.tsx", shared);
const { CostBadge } = load(components + "badges/CostBadge.tsx", shared);
const { TokenBadge } = load(components + "badges/TokenBadge.tsx", shared);
const CopyToClipboardButton = ({ onClick }) => React.createElement("button", { "data-icon": "copy", onClick });
const { MessageActions } = load(components + "buttons/MessageActions.tsx", {
    ...shared,
    "../badges": { ...performanceBadges, CostBadge, TokenBadge },
    "../buttons": { CopyToClipboardButton },
    "./SourcesButton": { SourcesButton: ({ sources, onClick }) => React.createElement("button", {
        "data-icon": "sources", onClick: () => onClick(sources),
    }, sources.length) },
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
const summaryIcons = ["code", "pricing", "timeToFirstToken", "tokensPerSecond", "sources", "attachment"];
const countIcon = (html, icon) => (html.match(new RegExp(`data-icon="${icon}"`, "g")) ?? []).length;
const assertSummaryCount = (html, count) => {
    for (const icon of summaryIcons) assert.equal(countIcon(html, icon), count, icon);
};
const source = { type: "source-url", sourceId: "source", url: "https://example.test/source" };
const attachment = { type: "file", mediaType: "application/pdf", url: "https://example.test/file.pdf" };
const summaryMessage = (parts, id = "response", role = "assistant") => ({
    ...uiMessage({ usage: { totalTokens: 1735 }, providerMetadata: { gateway } }, role, [...parts, source, attachment]), id,
});
const renderList = (messages, props = {}) => renderToStaticMarkup(React.createElement(MessageList, {
    messages, showTokens: true, showMetrics: true,
    onRenderMarkdown: text => React.createElement("p", null, text),
    onShowSources() {}, onShowAttachments() {}, ...props,
}));
const renderedCards = html => new Map(Array.from(html.matchAll(/<section data-message-id="([^"]+)">([\s\S]*?)<\/section>/g),
    ([, id, content]) => [id, content]));

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

test("text-tool-text responses show all summary controls only on the final text card without losing metadata", () => {
    const original = summaryMessage([
        { type: "text", text: "I will read the skill." },
        { type: "tool-shell_call", toolCallId: "call", output: { content: [], _meta: { gateway: { cost: 0.2 } } } },
        { type: "text", text: "I have read the skill." },
    ]);
    const before = JSON.stringify(original);
    const messages = toChatMessages([original]);
    assert.deepEqual(messages.map(msg => msg.id), ["response:text:0", "response:activity:call:1", "response:text:2"]);
    assert.deepEqual(messages.map(msg => msg.hideMessageSummaryActions), [true, true, false]);
    const html = renderList(messages, { onCopyMessage() {}, onEditMessage() {}, onSpeakMessage() {}, canSpeakMessage: true });
    const cards = renderedCards(html);
    assertSummaryCount(html, 1);
    assertSummaryCount(cards.get("response:text:0"), 0);
    assertSummaryCount(cards.get("response:activity:call:1"), 0);
    assertSummaryCount(cards.get("response:text:2"), 1);
    for (const msg of messages) {
        assert.equal(msg.totalTokens, 1735);
        assert.equal(msg.usage, original.metadata.usage);
        assert.equal(msg.cost, gateway.cost + 0.2);
        assert.equal(msg.ttft, gateway.ttft);
        assert.equal(msg.tps, gateway.tps);
        assert.equal(countIcon(cards.get(msg.id), "copy"), 1);
        assert.equal(countIcon(cards.get(msg.id), "edit"), 1);
        assert.equal(countIcon(cards.get(msg.id), "speech"), msg.content[0].type === "text" ? 1 : 0);
        if (msg.content[0].type === "text") {
            assert.deepEqual(msg.sources, [source]);
            assert.deepEqual(msg.attachments, [attachment]);
        }
    }
    assert.equal(JSON.stringify(original), before);
    assert.deepEqual(summarizeAssistantGatewayCost(original), { cost: gateway.cost + 0.2, count: 2 });
});

test("the final text card owns the summary even with adjacent text, intervening media, or trailing tools and media", () => {
    const first = { type: "text", text: "First" };
    const last = { type: "text", text: "Last" };
    const tool = { type: "tool-example", toolCallId: "call", output: { content: [] } };
    const media = ["image/png", "video/mp4", "audio/mpeg"].map(mediaType => ({
        type: "file", mediaType, url: "https://example.test/media",
    }));
    for (const parts of [
        [first, last],
        [{ type: "step-start" }, first, { type: "reasoning", text: "Thinking" }, tool, last, { type: "step-start" }, tool],
        [first, ...media, last, ...media, { type: "reasoning", text: "Trailing reasoning" }],
        [first, last, { ...tool, output: { content: [
            { type: "image", mimeType: "image/png", data: "aW1hZ2U=" },
            { type: "resource", resource: { uri: "audio://result", mimeType: "audio/mpeg", blob: "YXVkaW8=" } },
        ], _meta: { "chat/html": "<p>Widget</p>" } } }],
    ]) {
        const messages = toChatMessages([summaryMessage(parts)]);
        const lastText = messages.filter(msg => msg.content[0].type === "text").at(-1);
        assert.equal(lastText.content[0].text, "Last");
        const cards = renderedCards(renderList(messages));
        for (const msg of messages) {
            assert.equal(msg.hideMessageSummaryActions, msg !== lastText, msg.id);
            assertSummaryCount(cards.get(msg.id), msg === lastText ? 1 : 0);
        }
    }
});

test("summary placement is scoped to each original assistant message, not the latest message or consecutive assistant run", () => {
    const parts = [{ type: "text", text: "First" }, { type: "text", text: "Last" }];
    const originals = [
        summaryMessage(parts, "first"),
        summaryMessage(parts, "first:text:0"),
        summaryMessage(parts, "user", "user"),
        summaryMessage(parts, "third"),
    ];
    const messages = toChatMessages(originals);
    const assistants = messages.filter(msg => msg.role === "assistant");
    assertSummaryCount(renderList(assistants), 3);
    for (const original of originals.filter(msg => msg.role === "assistant")) {
        const cards = renderedCards(renderList(assistants));
        assertSummaryCount(cards.get(`${original.id}:text:0`), 0);
        assertSummaryCount(cards.get(`${original.id}:text:1`), 1);
    }
    const users = messages.filter(msg => msg.role === "user");
    assert.ok(users.every(msg => msg.hideMessageSummaryActions === undefined));
    const userHtml = renderList(users);
    for (const icon of ["code", "sources", "attachment"]) assert.equal(countIcon(userHtml, icon), 2);
    assert.equal(countIcon(userHtml, "pricing"), 0);
    assert.equal(countMetrics(userHtml), 0);
});

test("streaming snapshots move the summary to the newest text card without mutating earlier snapshots", () => {
    const parts = [
        { type: "text", text: "Starting" },
        { type: "tool-example", toolCallId: "call", output: { content: [] } },
        { type: "text", text: "Finishing" },
    ];
    let firstSnapshot;
    for (let length = 1; length <= parts.length; length++) {
        const original = summaryMessage(parts.slice(0, length));
        const before = JSON.stringify(original);
        const messages = toChatMessages([original]);
        firstSnapshot ??= messages;
        const targetId = length === 3 ? "response:text:2" : "response:text:0";
        const html = renderList(messages);
        assertSummaryCount(html, 1);
        assertSummaryCount(renderedCards(html).get(targetId), 1);
        assert.equal(JSON.stringify(original), before);
    }
    assert.equal(firstSnapshot[0].hideMessageSummaryActions, false);
    assertSummaryCount(renderList(firstSnapshot), 1);
});

test("summary visibility preserves token and metric preferences and legacy totalTokens fallback", () => {
    const original = summaryMessage([{ type: "text", text: "First" }, { type: "text", text: "Last" }]);
    original.metadata.totalTokens = 1735;
    delete original.metadata.usage;
    const messages = toChatMessages([original]);
    assertSummaryCount(renderList(messages), 1);
    const html = renderList(messages, { showTokens: false, showMetrics: false });
    for (const icon of ["code", "timeToFirstToken", "tokensPerSecond"]) assert.equal(countIcon(html, icon), 0);
    for (const icon of ["pricing", "sources", "attachment"]) assert.equal(countIcon(html, icon), 1);
});

test("media-only, tool-only, and reasoning-only responses retain their existing visibility behavior", () => {
    const media = ["image/png", "video/mp4", "audio/mpeg"].map(mediaType => ({
        type: "file", mediaType, url: "https://example.test/media",
    }));
    const messages = toChatMessages([summaryMessage(media)]);
    assert.equal(messages.length, 3);
    assert.ok(messages.every(msg => msg.hideMessageSummaryActions === undefined));
    const html = renderList(messages);
    for (const icon of ["code", "pricing", "timeToFirstToken", "tokensPerSecond"]) assert.equal(countIcon(html, icon), 3);
    for (const parts of [
        [{ type: "tool-example", toolCallId: "call", output: { content: [] } }],
        [{ type: "reasoning", text: "Thinking" }],
    ]) {
        const activity = toChatMessages([summaryMessage(parts)]);
        assert.ok(activity.every(msg => msg.hideMessageSummaryActions === undefined));
        assertSummaryCount(renderList(activity), 0);
    }
});

test("earlier text card copy, edit, and speech callbacks still receive their own display message", async () => {
    const [message] = toChatMessages([summaryMessage([{ type: "text", text: "First" }, { type: "text", text: "Last" }])]);
    assert.equal(message.hideMessageSummaryActions, true);
    const calls = [];
    const actions = React.Children.toArray(MessageActions({
        msg: message, page: 0, max: 0, onSetPage() {}, canSpeakMessage: true,
        onCopyMessage: async msg => { calls.push(["copy", msg]); },
        onEditMessage: msg => calls.push(["edit", msg]),
        onSpeakMessage: msg => calls.push(["speech", msg]),
    }).props.children);
    await actions.find(action => action.type === CopyToClipboardButton).props.onClick();
    actions.find(action => action.props.icon === "edit").props.onClick();
    actions.find(action => action.props.icon === "speech").props.onClick();
    assert.deepEqual(calls.map(([action]) => action), ["copy", "edit", "speech"]);
    assert.ok(calls.every(([, msg]) => msg === message));
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
