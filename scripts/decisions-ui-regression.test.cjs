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
        if (id.endsWith("/providerAuthHeaders")) return require("./credential-test-loader.cjs").auth;
        if (id.endsWith("/scopedRequest")) return require("./credential-test-loader.cjs").scoped;
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
const translator = locale => (key, fallback, options) => {
    const value = key.split(".").reduce((value, part) => value?.[part], locale) ?? (typeof fallback === "string" ? fallback : key);
    const values = options ?? (typeof fallback === "object" ? fallback : {});
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] ?? "");
};
const t = translator(english);
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
function findAll(node, predicate) {
    if (!React.isValidElement(node)) return [];
    return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => findAll(child, predicate))];
}
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
        "../badges/TokenBadge": { TokenBadge: "TokenBadge" },
        "./DecisionQuestionCard": { DecisionQuestionCard: "DecisionQuestionCard" }, "../modals/ProviderResultCards": providerCards,
    });
    return { ...h, ...exports };
}

const { DecisionAnswerDetails } = load("packages/aihappey-components/src/decisions/DecisionQuestionCard.tsx", {
    react: React, "aihappey-decisions": decisions, "aihappey-i18n": i18n,
    "../theme/ThemeContext": themeContext,
    "../buttons/ViewButton": { ViewButton: "ViewButton" },
    "../fields/LimitedTextField": { LimitedTextField: "LimitedTextField" },
});

test("box answers render all coordinates without score or probability details", () => {
    const box = { top: 0.1, bottom: 0.9, left: 0, right: 1 };
    const node = DecisionAnswerDetails({ answer: { type: "box", box } });
    assert.deepEqual(JSON.parse(node.props.children), box);
    assert.equal(byType(node, "strong"), undefined);
    assert.equal(byType(node, "dl"), undefined);
});

test("refusal and boolean answers retain their status and localized probability", () => {
    const refusal = DecisionAnswerDetails({ answer: { type: "refusal" } });
    assert.equal(refusal.props.role, "status");
    assert.equal(refusal.props.children, t("decisionsPage.refusal"));
    const boolean = DecisionAnswerDetails({ answer: { type: "boolean", probability: 0.7525 } });
    assert.equal(boolean.props.children[0], t("decisionsPage.probability"));
    assert.equal(byType(boolean, "strong").props.children, "75.25%");
});

test("choice and score answers retain their value and optional probability distribution", () => {
    for (const [answer, label, value] of [
        [{ type: "choice", choice: "yes" }, "decisionsPage.selectedChoice", '"yes"'],
        [{ type: "score", score: 0 }, "decisionsPage.score", 0],
    ]) {
        for (const probabilities of [undefined, { yes: 0.7525, no: 0.2475 }]) {
            const node = DecisionAnswerDetails({ answer: { ...answer, probabilities } });
            assert.equal(React.Children.toArray(node.props.children)[0].props.children[0], t(label));
            assert.equal(byType(node, "strong").props.children, value);
            const rows = React.Children.toArray(byType(node, "dl").props.children);
            assert.deepEqual(rows.map(row => byType(row, "dt").props.children), probabilities ? ["yes", "no"] : []);
            assert.deepEqual(rows.map(row => byType(row, "dd").props.children), probabilities ? ["75.25%", "24.75%"] : []);
        }
    }
});

test("score probabilities include their level labels while preserving the numeric score and fallback indices", () => {
    const question = { id: "score", type: "score", criteria: ["Low", "High", null, " "] };
    const answer = { type: "score", score: 0.75, probabilities: { 0: 0.25, 1: 0.75, 2: 0, 3: 0 } };
    const node = DecisionAnswerDetails({ answer, question });
    assert.equal(byType(node, "strong").props.children, 0.75);
    assert.deepEqual(findAll(node, child => child.type === "dt").map(row => row.props.children), ["0 — Low", "1 — High", "2", "3"]);
    assert.deepEqual(findAll(node, child => child.type === "dd").map(row => row.props.children), ["25%", "75%", "0%", "0%"]);
    assert.equal(find(node, child => child.props.role === "meter"), undefined);
    for (const context of [undefined, { ...question, criteria: [] }, { id: "other", type: "boolean" }]) {
        const node = DecisionAnswerDetails({ answer, question: context });
        assert.deepEqual(findAll(node, child => child.type === "dt").map(row => row.props.children), ["0", "1", "2", "3"]);
    }
});

test("question cards and detail modals pass the question context to score answer rendering", () => {
    const h = hooks();
    const components = load("packages/aihappey-components/src/decisions/DecisionQuestionCard.tsx", {
        react: h.react, "aihappey-decisions": decisions, "aihappey-i18n": i18n, "../theme/ThemeContext": themeContext,
        "../buttons/ViewButton": { ViewButton: "ViewButton" }, "../fields/LimitedTextField": { LimitedTextField: "LimitedTextField" },
    });
    const question = { id: "score", type: "score", criteria: ["Low", "High"] };
    const answer = { type: "score", score: 1, probabilities: { 0: 0, 1: 1 } };
    const card = h.render(components.DecisionQuestionCard, { question, answer, number: 1 });
    const cardAnswer = byType(byType(card, "Card"), components.DecisionAnswerDetails);
    assert.equal(cardAnswer.props.question, question);
    const detail = byType(card, components.DecisionQuestionDetails);
    const renderedDetail = components.DecisionQuestionDetails(detail.props);
    assert.equal(byType(renderedDetail, components.DecisionAnswerDetails).props.question, question);
});

test("choice probabilities have subtle accessible meters, including zero and full probability", () => {
    const node = DecisionAnswerDetails({ answer: { type: "choice", choice: "yes", probabilities: { yes: 0.7525, no: 0.2475, never: 0, always: 1 } } });
    const meters = findAll(node, child => child.props.role === "meter");
    assert.deepEqual(meters.map(meter => meter.props["aria-label"]), ["yes", "no", "never", "always"]);
    assert.deepEqual(meters.map(meter => meter.props["aria-valuenow"]), [0.7525, 0.2475, 0, 1]);
    assert.deepEqual(meters.map(meter => meter.props["aria-valuetext"]), ["75.25%", "24.75%", "0%", "100%"]);
    assert.deepEqual(meters.map(meter => React.Children.toArray(meter.props.children)[1].props.style.width), ["75.25%", "24.75%", "0%", "100%"]);
    assert.ok(meters.every(meter => meter.props.style.height === 3 && meter.props["aria-valuemin"] === 0 && meter.props["aria-valuemax"] === 1));
    for (const answer of [
        { type: "choice", choice: "yes" }, { type: "boolean", probability: 0.5 },
        { type: "score", score: 1, probabilities: { 0: 0.25, 1: 0.75 } }, { type: "refusal" },
        { type: "box", box: { top: 0, left: 0, bottom: 1, right: 1 } },
    ]) assert.equal(find(DecisionAnswerDetails({ answer }), child => child.props.role === "meter"), undefined);
});

test("choice meters clamp their visual and accessible values to the probability range", () => {
    const node = DecisionAnswerDetails({ answer: { type: "choice", choice: "yes", probabilities: { low: -0.1, high: 1.1, invalid: NaN } } });
    const meters = findAll(node, child => child.props.role === "meter");
    assert.deepEqual(meters.map(meter => meter.props["aria-valuenow"]), [0, 1, 0]);
    assert.deepEqual(meters.map(meter => React.Children.toArray(meter.props.children)[1].props.style.width), ["0%", "100%", "0%"]);
});

test("decision modal shares result tabs and keeps evidence, images, answers, and warnings in Overview", () => {
    const h = cardHarness();
    let card = h.render(h.DecisionCard, { item, providers });
    byType(card, "Card").props.actions.props.onClick();
    card = h.render(h.DecisionCard, { item, providers });
    const details = byType(card, h.DecisionResultDetails);
    assert.ok(details);
    assert.equal(details.props.decision, item.decision);
    const resultHarness = cardHarness();
    const node = resultHarness.render(resultHarness.DecisionResultDetails, details.props);
    const [overview, raw] = tabs(node);
    assert.deepEqual(tabs(node).map(tab => tab.props.title), ["Overview", "OpenAI result"]);
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    assert.equal(byType(node, "Tabs").props.vertical, undefined);
    assert.ok(find(overview, child => child.props.children === "Shared evidence"));
    assert.equal(byType(overview, "img").props.src, image);
    assert.equal(byType(overview, "DecisionQuestionCard").props.answer, item.decision.answers.q1);
    assert.equal(byType(overview, providerCards.ProviderResultCards), undefined);
    assert.equal(byType(overview, "Alert").props.children, "A warning");
    assert.equal(byType(node, "TokenBadge").props.totalTokens, 12);
    assert.equal(byType(overview, "TokenBadge").props.totalTokens, 12);
    assert.equal(byType(raw, "TokenBadge"), undefined);
    assert.equal(byType(node, "Card"), undefined);
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
        const node = h.render(h.DecisionResultDetails, { decision });
        assert.equal(tabs(node).length, expected ? 2 : 1);
        assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    }
});

test("decision modal unmounts results on close and keys results by the saved decision", () => {
    const h = cardHarness();
    const props = { item, providers };
    let node = h.render(h.DecisionCard, props);
    assert.equal(byType(node, h.DecisionResultDetails), undefined);
    byType(node, "Card").props.actions.props.onClick();
    node = h.render(h.DecisionCard, props);
    assert.equal(byType(node, "Modal").props.children.key, item.id);
    byType(node, "Modal").props.onHide();
    node = h.render(h.DecisionCard, props);
    assert.equal(byType(node, h.DecisionResultDetails), undefined);
    byType(node, "Card").props.actions.props.onClick();
    node = h.render(h.DecisionCard, props);
    assert.ok(byType(node, h.DecisionResultDetails));
    node = h.render(h.DecisionCard, { item: { ...item, id: "decision2" }, providers });
    assert.equal(byType(node, "Modal").props.children.key, "decision2");
});

test("shared result tabs reset to Overview for a new response and fall back if diagnostics disappear", () => {
    const h = cardHarness();
    const props = { decision: item.decision, providers };
    let node = h.render(h.DecisionResultDetails, props); h.flush();
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    byType(node, "Tabs").props.onSelect("providerResult");
    node = h.render(h.DecisionResultDetails, props);
    assert.equal(byType(node, "Tabs").props.activeKey, "providerResult");
    const next = { decision: { ...item.decision }, providers };
    h.render(h.DecisionResultDetails, next); h.flush();
    node = h.render(h.DecisionResultDetails, next);
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    byType(node, "Tabs").props.onSelect("providerResult");
    node = h.render(h.DecisionResultDetails, { decision: response, providers });
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
});

test("inline results default to Overview and keep provider diagnostics exclusively in their own tab", () => {
    const h = cardHarness();
    const children = React.createElement("QuestionCards");
    const node = h.render(h.DecisionResultDetails, { decision: item.decision, providers, children });
    const [overview, raw] = tabs(node);
    assert.deepEqual(tabs(node).map(tab => tab.props.title), ["Overview", "OpenAI result"]);
    assert.equal(byType(node, "Tabs").props.activeKey, "overview");
    assert.equal(byType(overview, "QuestionCards").props, children.props);
    assert.equal(byType(raw, "QuestionCards"), undefined);
    assert.equal(byType(overview, providerCards.ProviderResultCards), undefined);
    assert.ok(byType(raw, providerCards.ProviderResultCards));
    assert.equal(byType(overview, "Alert").props.children, "A warning");
});

test("shared results show the chat token badge first inside Overview and hide absent, zero, or invalid usage", () => {
    for (const [usage, expected] of [
        [undefined, undefined], [{}, undefined], [{ inputTokens: 0, outputTokens: 0 }, undefined],
        [{ inputTokens: 10, outputTokens: 5 }, 15], [{ inputTokens: 0, outputTokens: 12 }, 12],
        [{ inputTokens: 10 }, 10], [{ outputTokens: 8 }, 8],
        [{ inputTokens: NaN, outputTokens: Infinity }, undefined], [{ inputTokens: -10, outputTokens: 5 }, 5],
    ]) {
        const h = cardHarness();
        const node = h.render(h.DecisionResultDetails, { decision: { ...response, usage } });
        assert.equal(byType(node, "TokenBadge")?.props.totalTokens, expected);
        assert.equal(byType(node, "Card"), undefined);
        assert.equal(React.Children.toArray(node.props.children)[0].type, "Tabs");
        const overview = tabs(node)[0];
        assert.equal(byType(overview, "TokenBadge")?.props.totalTokens, expected);
        if (expected) assert.ok(byType(React.Children.toArray(overview.props.children.props.children)[0], "TokenBadge"));
    }
    const { TokenBadge } = load("packages/aihappey-components/src/badges/TokenBadge.tsx", {
        "aihappey-i18n": i18n, "../theme/ThemeContext": themeContext,
    });
    const badge = TokenBadge({ totalTokens: 15 });
    assert.equal(badge.type, "Badge");
    assert.equal(badge.props.appearance, "neutral");
    assert.equal(badge.props.title, t("totalTokens"));
    assert.equal(badge.props.children, 15);
});

function pageHarness(overrides = {}) {
    const h = hooks();
    const controller = { models: [{ id: "openai/model", type: "decision" }], selectedModel: "openai/model", questions: [question], images: [], documents: [], attachmentWarnings: [], result: response, gatewayAvailable: true, canSend: true, errors: [], ...overrides };
    const components = new Proxy({ useTheme: () => theme }, { get: (target, name) => target[name] ?? name });
    const { DecisionsPage } = load("packages/aihappey-core/src/features/decisions/DecisionsPage.tsx", {
        react: h.react, "aihappey-components": components, "aihappey-decisions": { useDecisions: () => ({ items: [], questionSets: [] }) },
        "aihappey-state": { useAppStore: selector => selector({ favoriteModelsByType: { decision: [] } }) }, "aihappey-i18n": i18n,
        "../models/ModelSelect": { ModelSelect: "ModelSelect" }, "../user-settings/UserMenuInline": { UserMenuInline: "UserMenuInline" },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => providers },
        "../storage/storageErrorMessage": { useStorageErrorMessage: () => String }, "./useDecisionsController": { useDecisionsController: () => controller },
    });
    return { ...h, DecisionsPage, controller };
}

test("Decisions page keeps question cards in Overview and places question management above result tabs", () => {
    let changed;
    const second = { ...question, id: "q2" };
    const h = pageHarness({ questions: [question, second], setQuestions: questions => { changed = questions; } });
    let node = h.render(h.DecisionsPage);
    assert.equal(byType(node, "details"), undefined);
    assert.equal(findAll(node, child => child.type === "TextArea").length, 1);
    assert.equal(byType(node, "TextArea").props.placeholder, t("decisionsPage.inputPlaceholder"));
    const details = byType(node, "DecisionResultDetails");
    assert.equal(details.props.decision, response);
    assert.equal(byType(details, "Button"), undefined);
    const current = tabs(node)[0];
    const sections = React.Children.toArray(current.props.children);
    assert.equal(findAll(sections[0], child => child.type === "Button").length, 2);
    assert.ok(byType(sections[1], "DecisionResultDetails"));
    const cards = findAll(details, child => child.type === "DecisionQuestionCard");
    assert.equal(cards.length, 2);
    assert.equal(findAll(node, child => child.type === "DecisionQuestionCard").length, 2);
    assert.equal(cards[0].props.answer, response.answers.q1);
    assert.equal(cards[0].props.onMoveUp, undefined);
    assert.equal(cards[1].props.onMoveDown, undefined);
    cards[0].props.onMoveDown(); assert.deepEqual(changed, [second, question]);
    cards[1].props.onMoveUp(); assert.deepEqual(changed, [second, question]);
    cards[0].props.onDelete(); assert.deepEqual(changed, [second]);
    cards[0].props.onEdit();
    node = h.render(h.DecisionsPage);
    assert.equal(byType(node, "DecisionQuestionEditModal").props.open, true);
    assert.equal(byType(node, "DecisionQuestionEditModal").props.question, question);
    const add = find(current, child => child.type === "Button" && child.props.icon === "add");
    add.props.onClick();
    node = h.render(h.DecisionsPage);
    assert.equal(byType(node, "DecisionQuestionEditModal").props.open, true);
    assert.equal(byType(node, "DecisionQuestionEditModal").props.question, undefined);
    find(current, child => child.type === "Button" && child.props.children === t("decisionsPage.saveAsSet")).props.onClick();
    node = h.render(h.DecisionsPage);
    assert.equal(byType(node, "QuestionSetEditModal").props.open, true);
});

test("question editing remains available before execution and disabled while busy", () => {
    const before = pageHarness({ result: undefined });
    const node = before.render(before.DecisionsPage);
    assert.equal(byType(node, "DecisionResultDetails"), undefined);
    assert.equal(byType(node, "DecisionQuestionCard").props.question, question);
    assert.equal(typeof byType(node, "DecisionQuestionCard").props.onEdit, "function");
    for (const busy of [{ processing: true }, { readingAttachments: true }]) {
        const h = pageHarness(busy);
        const node = h.render(h.DecisionsPage);
        const details = byType(node, "DecisionResultDetails");
        for (const action of ["onEdit", "onDelete", "onMoveUp", "onMoveDown"]) assert.equal(byType(details, "DecisionQuestionCard").props[action], undefined);
        const buttons = findAll(tabs(node)[0], child => child.type === "Button");
        assert.equal(buttons.length, 2);
        assert.ok(buttons.every(button => button.props.disabled));
    }
});

test("decision forms and Edit menus use clean English and Dutch labels", () => {
    for (const [language, expected] of [
        ["en", { name: "Name", trueDefinition: "Definition of true", falseDefinition: "Definition of false", edit: "Edit", description: "Description", hint: "Add at least one level, ordered from lowest to highest." }],
        ["nl", { name: "Naam", trueDefinition: "Definitie van waar", falseDefinition: "Definitie van onwaar", edit: "Bewerken", description: "Beschrijving", hint: "Voeg minstens één niveau toe, van laag naar hoog." }],
    ]) {
        const translation = { useTranslation: () => ({ t: translator(readLocale(language)), i18n: { language } }) };
        const h = hooks();
        const common = { react: h.react, "aihappey-decisions": decisions, "aihappey-i18n": translation, "../theme/ThemeContext": themeContext,
            "../buttons/ViewButton": { ViewButton: "ViewButton" }, "../fields/LimitedTextField": { LimitedTextField: "LimitedTextField" } };
        const { DecisionQuestionForm } = load("packages/aihappey-components/src/decisions/DecisionQuestionForm.tsx", common);
        let node = h.render(DecisionQuestionForm, { value: { ...question, instructions: undefined, criteria: { true: "Yes" } }, onChange() {} });
        assert.equal(byType(node, "Input").props.label, expected.name);
        assert.deepEqual(findAll(node, child => child.type === "TextArea").map(field => field.props.label), [language === "en" ? "Instructions" : "Instructies", expected.trueDefinition, expected.falseDefinition]);
        assert.equal(byType(node, "TextArea").props.required, false);
        node = h.render(DecisionQuestionForm, { value: { id: "score", type: "score", criteria: ["Low", "High"] }, onChange() {} });
        assert.ok(find(node, child => child.props.children === expected.hint));
        node = h.render(DecisionQuestionForm, { value: { id: "box", type: "box", instructions: "" }, onChange() {} });
        assert.equal(byType(node, "TextArea").props.required, true);
        const choice = { id: "choice", type: "choice", criteria: { yes: null } };
        h.render(DecisionQuestionForm, { value: choice, onChange() {} }); h.flush();
        node = h.render(DecisionQuestionForm, { value: choice, onChange() {} });
        assert.ok(find(node, child => child.type === "TextArea" && child.props.label === expected.description));
        const cardHooks = hooks();
        const { DecisionQuestionCard } = load("packages/aihappey-components/src/decisions/DecisionQuestionCard.tsx", { ...common, react: cardHooks.react });
        node = cardHooks.render(DecisionQuestionCard, { question, number: 1, onEdit() {} });
        assert.equal(byType(node, "Card").props.headerActions.props.items[0].label, expected.edit);
        const setHooks = hooks();
        const { QuestionSetCard } = load("packages/aihappey-components/src/decisions/QuestionSetCard.tsx", { ...common, react: setHooks.react, "./DecisionQuestionCard": { DecisionQuestionCard: "DecisionQuestionCard" } });
        node = setHooks.render(QuestionSetCard, { set: { id: "set", name: "Example", questions: [question] }, onEdit() {} });
        assert.equal(byType(node, "Card").props.headerActions.props.items[0].label, expected.edit);
    }
});

test("question editors omit generic help without changing predicate or bounding-box validation", () => {
    const h = hooks();
    const common = { react: h.react, "aihappey-decisions": decisions, "aihappey-i18n": i18n, "../theme/ThemeContext": themeContext,
        "./DecisionQuestionForm": { DecisionQuestionForm: "DecisionQuestionForm" } };
    const { DecisionQuestionEditModal } = load("packages/aihappey-components/src/decisions/DecisionQuestionEditModal.tsx", common);
    for (const question of [
        { id: "predicate", type: "boolean", criteria: { true: "Supported" } },
        { id: "predicate", type: "boolean", instructions: "" },
        { id: "box", type: "box", instructions: "" },
    ]) {
        const props = { open: true, question, onClose() {}, onSave() {} };
        h.render(DecisionQuestionEditModal, props); h.flush();
        const node = h.render(DecisionQuestionEditModal, props);
        assert.equal(find(node, child => child.props.role === "status"), undefined);
        const save = find(byType(node, "Modal").props.actions, child => child.type === "Button" && child.props.children === t("save"));
        assert.equal(save.props.disabled, !decisions.isValidDecisionQuestion(question));
    }
    assert.equal(decisions.isValidDecisionQuestion({ id: "predicate", type: "boolean", criteria: { true: "Supported" } }), true);
    const setHooks = hooks();
    const { QuestionSetEditModal } = load("packages/aihappey-components/src/decisions/QuestionSetEditModal.tsx", {
        ...common, react: setHooks.react, "./DecisionQuestionCard": { DecisionQuestionCard: "DecisionQuestionCard" },
    });
    const props = { open: true, onClose() {}, async onSave() {} };
    setHooks.render(QuestionSetEditModal, props); setHooks.flush();
    let node = setHooks.render(QuestionSetEditModal, props);
    find(node, child => child.type === "Button" && child.props.icon === "add").props.onClick();
    node = setHooks.render(QuestionSetEditModal, props);
    assert.ok(byType(node, "DecisionQuestionForm"));
    assert.equal(find(node, child => child.props.role === "status"), undefined);
    assert.equal(find(node, child => child.type === "Button" && child.props.children === t("save")).props.disabled, true);
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
        "./decisionAttachments": load("packages/aihappey-core/src/features/decisions/decisionAttachments.ts", {
            "aihappey-decisions": decisions,
            "../chat/files/file": { extractTextFromFile: async () => undefined },
            "../chat/files/fileConverters": { extractTextFromZip: async () => [] },
        }),
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
