// Component/hook-level regression coverage using the repository's Node test runner.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const React = require("react");
const ts = require("typescript");

function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)((id) => {
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id} in ${filename}`);
    }, module, module.exports);
    return module.exports;
}

function hooks() {
    const slots = [];
    let index = 0, pending = [];
    const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => value !== b[i]);
    const react = {
        ...React,
        useState(initial) {
            const i = index++;
            if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
            return [slots[i], next => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }];
        },
        useRef(initial) {
            const i = index++;
            if (!(i in slots)) slots[i] = { current: initial };
            return slots[i];
        },
        useMemo(factory, deps) {
            const i = index++;
            if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { deps, value: factory() };
            return slots[i].value;
        },
        useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
        useEffect(effect, deps) {
            const i = index++;
            if (!slots[i] || changed(slots[i], deps)) { slots[i] = deps; pending.push(effect); }
        },
    };
    return {
        react,
        render(Component, props) { index = 0; return Component(props); },
        flush() { const effects = pending; pending = []; effects.forEach(effect => effect()); },
    };
}

const readLocale = language => JSON.parse(fs.readFileSync(`packages/aihappey-i18n/src/locales/${language}/${language}.json`, "utf8").replace(/^\uFEFF/, ""));
const english = readLocale("en");
const t = (key, fallback, options) => {
    const value = key.split(".").reduce((value, part) => value?.[part], english) ?? (typeof fallback === "string" ? fallback : key);
    return value.replace(/\{\{provider\}\}/g, options?.provider ?? "");
};
const i18n = { useTranslation: () => ({ t, i18n: { language: "en" } }) };
const theme = new Proxy({}, { get: (_, name) => name });
const themeContext = { useTheme: () => theme };
const decisions = {
    ...load("packages/aihappey-decisions/src/types.ts"),
    ...load("packages/aihappey-decisions/src/validation.ts"),
};
const providerCards = load("packages/aihappey-components/src/modals/ProviderResultCards.tsx", {
    react: React, "aihappey-i18n": i18n, "../theme/ThemeContext": themeContext,
});
function find(node, predicate) {
    if (!React.isValidElement(node)) return undefined;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
        const match = find(child, predicate);
        if (match) return match;
    }
}
const byType = (node, type) => find(node, child => child.type === type);
const tabs = node => React.Children.toArray(byType(node, "Tabs").props.children);
const question = { id: "q1", type: "boolean", instructions: "Is this supported?" };
const response = { answers: { q1: { type: "boolean", probability: 0.75 } }, warnings: ["A warning"], usage: { inputTokens: 0, outputTokens: 12 } };
const image = "data:image/png;base64,AAAA";
const item = {
    id: "decision1", createdAt: "2026-10-09T12:00:00Z", questions: [question],
    input: [{ role: "user", content: [{ type: "input_text", text: "Shared evidence" }, { type: "input_image", image_url: image }] }],
    decision: { ...response, response: { modelId: "openai/model", headers: { "x-request-id": "request1" }, body: { raw: true } }, providerMetadata: { openai: { detail: "value" }, gateway: { hidden: true } } },
};
const providers = { openai: { name: "OpenAI" } };
function cardHarness() {
    const h = hooks();
    const exports = load("packages/aihappey-components/src/decisions/DecisionCard.tsx", {
        react: h.react, "aihappey-decisions": decisions, "aihappey-i18n": i18n,
        "timeago.js": { format: () => "just now" }, "../theme/ThemeContext": themeContext,
        "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
        "../buttons/ViewButton": { ViewButton: "ViewButton" }, "../fields/LimitedTextField": { LimitedTextField: "LimitedTextField" },
        "./DecisionQuestionCard": { DecisionQuestionCard: "DecisionQuestionCard" }, "../modals/ProviderResultCards": providerCards,
    });
    return { ...h, ...exports };
}

test("decision modal keeps evidence, images, answers, warnings, and usage in Overview, not provider diagnostics", () => {
    const h = cardHarness();
    const node = h.render(h.DecisionCard, { item, providers });
    const [overview, raw] = tabs(node);
    assert.deepEqual(tabs(node).map(tab => tab.props.title), ["Overview", "OpenAI result"]);
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    assert.equal(byType(node, "Tabs").props.vertical, undefined);
    assert.ok(find(overview, child => child.props.children === "Shared evidence"));
    assert.equal(byType(overview, "img").props.src, image);
    assert.equal(byType(overview, "DecisionQuestionCard").props.answer, item.decision.answers.q1);
    assert.equal(byType(overview, providerCards.ProviderResultCards), undefined);
    const summary = find(overview, child => typeof child.type === "function");
    const renderedSummary = summary.type(summary.props);
    assert.equal(byType(renderedSummary, "Alert").props.children, "A warning");
    assert.equal(byType(renderedSummary, "Card").props.title, "Token usage");
    assert.ok(find(renderedSummary, child => child.type === "dd" && child.props.children === 0));
    const diagnostic = byType(raw, providerCards.ProviderResultCards);
    assert.deepEqual(diagnostic.props.headers, item.decision.response.headers);
    const renderedDiagnostic = diagnostic.type(diagnostic.props);
    assert.deepEqual(React.Children.toArray(renderedDiagnostic.props.children).map(card => card.props.title), ["Provider metadata", "Headers", "Body"]);
    assert.deepEqual(byType(renderedDiagnostic, "JsonViewer").props.value, { detail: "value" });
});

test("provider result is conditional on actual metadata, string headers, or a non-null body", () => {
    for (const [decision, expected] of [
        [response, false],
        [{ ...response, providerMetadata: { gateway: { internal: true } } }, false],
        [{ ...response, providerMetadata: { openai: {} }, response: { modelId: "openai/model", headers: {}, body: null } }, false],
        [{ ...response, response: { headers: { ignored: undefined } } }, false],
        [{ ...response, response: { headers: { "x-id": "id" } } }, true],
        [{ ...response, response: { body: false } }, true],
        [{ ...response, providerMetadata: { OpenAI: { id: "id" } } }, true],
        [{ ...response, providerMetadata: { openai: { id: "id" } }, response: { modelId: "unqualified-model" } }, true],
    ]) {
        const h = cardHarness();
        const node = h.render(h.DecisionCard, { item: { ...item, decision } });
        assert.equal(tabs(node).length, expected ? 2 : 1);
        assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    }
});

test("decision modal resets to Overview when reopened or changed and falls back if diagnostics disappear", () => {
    const h = cardHarness();
    const props = { item, providers };
    let node = h.render(h.DecisionCard, props);
    byType(node, "Card").props.actions.props.onClick();
    node = h.render(h.DecisionCard, props); h.flush();
    byType(node, "Tabs").props.onSelect("providerResult");
    node = h.render(h.DecisionCard, props);
    assert.equal(byType(node, "Tabs").props.activeKey, "providerResult");
    byType(node, "Modal").props.onHide();
    node = h.render(h.DecisionCard, props); h.flush();
    byType(node, "Card").props.actions.props.onClick();
    h.render(h.DecisionCard, props); h.flush();
    node = h.render(h.DecisionCard, props);
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    byType(node, "Tabs").props.onSelect("providerResult");
    h.render(h.DecisionCard, { item: { ...item, id: "decision2" }, providers }); h.flush();
    node = h.render(h.DecisionCard, { item: { ...item, id: "decision2" }, providers });
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    byType(node, "Tabs").props.onSelect("providerResult");
    node = h.render(h.DecisionCard, { item: { ...item, decision: response }, providers });
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
});

test("inline decision details still include both summary and diagnostic cards", () => {
    const h = cardHarness();
    const node = h.render(h.DecisionResultDetails, { decision: item.decision, providers });
    assert.equal(byType(node, "Tabs"), undefined);
    assert.ok(byType(node, providerCards.ProviderResultCards));
    const summary = find(node, child => typeof child.type === "function" && child.type !== providerCards.ProviderResultCards);
    assert.ok(byType(summary.type(summary.props), "Alert"));
    assert.ok(byType(summary.type(summary.props), "Card"));
});

test("Decisions page has only the evidence text area, no raw options editor, and preserves inline details", () => {
    const h = hooks();
    const controller = { models: [{ id: "openai/model", type: "decision" }], selectedModel: "openai/model", questions: [], images: [], result: response, gatewayAvailable: true, canSend: true, errors: [] };
    const components = new Proxy({ useTheme: () => theme }, { get: (target, name) => target[name] ?? name });
    const { DecisionsPage } = load("packages/aihappey-core/src/features/decisions/DecisionsPage.tsx", {
        react: h.react, "aihappey-components": components, "aihappey-decisions": { useDecisions: () => ({ items: [], questionSets: [] }) },
        "aihappey-state": { useAppStore: selector => selector({ favoriteModelsByType: { decision: [] } }) }, "aihappey-i18n": i18n,
        "../models/ModelSelect": { ModelSelect: "ModelSelect" }, "../user-settings/UserMenuInline": { UserMenuInline: "UserMenuInline" },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => providers },
        "../storage/storageErrorMessage": { useStorageErrorMessage: () => String }, "./useDecisionsController": { useDecisionsController: () => controller },
    });
    const node = h.render(DecisionsPage);
    assert.equal(byType(node, "details"), undefined);
    assert.equal(byType(node, "TextArea").props.label, "Input");
    assert.equal(byType(node, "DecisionResultDetails").props.decision, response);
});

test("decision submission requires only valid evidence/questions and sends no provider options", async () => {
    const h = hooks();
    let sent, saved;
    const store = { add: async (...args) => { saved = args; } };
    const state = { models: [{ id: "openai/model", type: "decision" }], userPreferredDecisionModel: "openai/model", customHeaders: { "x-custom": "yes" } };
    const config = { baseUrl: "https://gateway.example/", endpoints: {}, getAccessToken: async () => "token", fetch: async (url, init) => {
        sent = { url, headers: new Headers(init.headers), body: JSON.parse(init.body) };
        return Response.json(response);
    } };
    const ai = load("packages/aihappey-ai/src/createDecisionProvider.ts");
    const { useDecisionsController } = load("packages/aihappey-core/src/features/decisions/useDecisionsController.ts", {
        react: h.react, "aihappey-ai": { ...ai, defaultEndpoints: { decisions: "/decisions" } },
        "aihappey-decisions": { ...decisions, useDecisions: () => store }, "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-i18n": i18n, "../chat/context/ChatContext": { useChatContext: () => ({ config }) },
        "../models/queryModelSelection": { useQueryModelId: () => undefined }, "../storage/storageErrorMessage": { useStorageErrorMessage: () => String },
    });
    let c = h.render(useDecisionsController); h.flush();
    assert.equal(c.canSend, false);
    c.setPrompt("Shared evidence"); c.setQuestions([question]);
    c = h.render(useDecisionsController);
    assert.equal(c.canSend, true);
    assert.equal("providerOptionsText" in c, false);
    assert.equal("providerOptionsValid" in c, false);
    assert.equal("setProviderOptionsText" in c, false);
    await c.onSend();
    c = h.render(useDecisionsController);
    assert.deepEqual(sent.body, { model: "openai/model", state: "Shared evidence", questions: { q1: { type: "boolean", instructions: question.instructions } } });
    assert.equal(sent.headers.get("Authorization"), "Bearer token");
    assert.equal(sent.headers.get("x-custom"), "yes");
    assert.deepEqual(c.result, response);
    assert.deepEqual(saved, ["Shared evidence", [question], response]);
    assert.deepEqual(c.errors, []);
    c.setPrompt(""); c = h.render(useDecisionsController);
    assert.equal(c.canSend, false);
});

test("underlying decision API still accepts provider options for future form-based configuration", async () => {
    const { createDecisionProvider } = load("packages/aihappey-ai/src/createDecisionProvider.ts");
    let body;
    const client = createDecisionProvider({ baseUrl: "https://gateway.example/decisions", fetch: async (_, init) => {
        body = JSON.parse(init.body); return Response.json(response);
    } });
    const providerOptions = { openai: { safety_identifier: "user1" } };
    await client.decisionModel("openai/model").doDecide({ state: "Evidence", questions: {}, providerOptions });
    assert.deepEqual(body.providerOptions, providerOptions);
});

test("Overview is localized in both decision UI languages", () => {
    assert.equal(english.decisionsPage.overview, "Overview");
    assert.equal(readLocale("nl").decisionsPage.overview, "Overzicht");
});
