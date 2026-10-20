const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");

function load(filename, mocks = {}) {
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        if (id.endsWith("/providerAuthHeaders")) return require("./credential-test-loader.cjs").auth;
        if (id.endsWith("/scopedRequest")) return require("./credential-test-loader.cjs").scoped;
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

const root = "packages/aihappey-core/src/features/";
const agentTypes = load("packages/aihappey-types/src/agents.ts");
const agentSelection = load(root + "agents/agentSelection.ts", { "aihappey-types": agentTypes });
const decisions = {
    ...load("packages/aihappey-decisions/src/types.ts"),
    ...load("packages/aihappey-decisions/src/validation.ts"),
};
const model = (id, type = "language") => ({ id, name: id, type, tags: ["vision", "tools"], context_window: 100000 });
const message = text => ({ id: text, role: "user", parts: [{ type: "text", text }] });
const response = choice => ({ answers: { favorite: { type: "choice", choice } }, warnings: [] });
const initialState = () => ({
    chatMode: "chat", favoriteModelRouter: true, favoriteAgentRouter: false,
    selectedModel: "old/model", selectedAgentNames: [],
    models: [model("a/model"), model("b/model"), model("d/decide", "decision"), model("image", "image")],
    userPreferredDecisionModel: "d/decide",
    favoriteModelsByType: { language: ["a/model", "b/model", "a/model", "missing", "image"] },
    agents: [{ name: "Local", description: "Writes code", instructions: "Code carefully", model: { id: "a/model", providerHeaders: { secret: "hidden" } }, tools: [{ type: "function", name: "code" }], mcpServers: { repo: { type: "http", url: "https://private", headers: { secret: "hidden" } } } }],
    remoteAgentModels: [{ id: "Remote", name: "Research", source: "remote", tags: ["research"], description: "Searches the web" }],
    favoriteAgentIds: ["local:Local", "remote:Remote", "missing"],
    customHeaders: { "x-custom": "custom" },
});

function helpers(doDecide) {
    const calls = [];
    const router = load(root + "chat/engine/favoriteRouter.ts", {
        "aihappey-ai": {
            defaultEndpoints: { decisions: "/api/decisions" },
            createDecisionProvider(config) {
                return { decisionModel(modelId) { return { async doDecide(options) {
                    calls.push({ config, modelId, options });
                    return doDecide ? doDecide(options) : response("b/model");
                } }; } };
            },
        },
        "aihappey-decisions": decisions,
        "../../agents/agentSelection": agentSelection,
    });
    return { ...router, calls };
}

function harness(decide, createTransport, getDecisionMessages, files) {
    const helper = helpers(decide);
    let state = initialState(), slots = [], index = 0, cleanups = [], transport, rendered;
    let config = { baseUrl: "https://gateway/", endpoints: {}, headers: { "x-base": "base" }, getAccessToken: async () => "decision-token", fetch: async () => {} };
    const generation = [];
    const store = {
        getState: () => state,
        setState: patch => { Object.assign(state, patch); },
    };
    state.setSelectedModel = winner => { state.selectedModel = winner; };
    state.setSelectedAgents = winners => { state.selectedAgentNames = winners; };
    const react = {
        useRef(value) { const i = index++; return slots[i] ??= { current: value }; },
        useMemo(factory) { const i = index++; return slots[i] ??= factory(); },
        useEffect(effect) { const i = index++; if (!slots[i]) { slots[i] = true; cleanups.push(effect()); } },
    };
    const { useFavoriteRouterTransport } = load(root + "chat/engine/useFavoriteRouterTransport.ts", {
        react, "react-dom": { flushSync(callback) { callback(); render(); } },
        "aihappey-state": { store },
        "../context/ChatContext": { useChatContext: () => ({ config }) },
        "../../transcriptions/knownSpeakersProviderMetadata": {
            withOpenAiKnownSpeakerReferences: async (metadata, args) => ({
                ...metadata, openai: { ...metadata.openai, known_speaker_references: args.items.map(item => item.id) },
            }),
        },
        "./favoriteRouter": helper,
    });
    function render() {
        index = 0;
        const snapshot = { model: state.selectedModel, agents: [...state.selectedAgentNames] };
        transport = createTransport ? createTransport(snapshot) : {
            async sendMessages(options) { generation.push({ snapshot, options }); return "stream"; },
            async reconnectToStream(options) { generation.push({ snapshot, options }); return "reconnect"; },
        };
        const body = state.chatMode === "agent"
            ? { agents: state.selectedAgentNames.map(id => ({ id })), providerHeaders: { agent: "new" } }
            : { model: state.selectedModel, providerHeaders: { [state.selectedModel]: "new" },
                ...(state.models.find(model => model.id === state.selectedModel)?.type === "transcription"
                    ? { providerMetadata: { openai: { known_speaker_names: ["Speaker"] } } } : {}) };
        rendered = useFavoriteRouterTransport(transport, body, getDecisionMessages, files);
        return rendered;
    }
    render();
    const send = (text = "Help", opts = {}) => rendered.sendMessages({
        trigger: "submit-message", messages: [message(text)],
        body: { model: "stale", agents: ["stale"], models: ["stale"], providerRequestConfig: { stale: true }, temperature: 0.5 },
        ...opts,
    });
    return { helper, state, generation, render, send, get transport() { return rendered; },
        setConfig(next) { config = { ...config, ...next }; render(); },
        unmount() { cleanups.forEach(cleanup => cleanup?.()); } };
}

test("current language favorites are deduplicated; local and remote favorites use canonical IDs and safe metadata", () => {
    const h = helpers();
    const state = initialState();
    assert.deepEqual(h.favoriteRouterCandidates(state, "model").map(c => c.id), ["a/model", "b/model"]);
    const candidates = h.favoriteRouterCandidates(state, "agent");
    assert.deepEqual(candidates.map(c => c.id), ["local:Local", "remote:Remote"]);
    assert.equal(candidates[0].tools[0].name, "code");
    assert.equal(candidates[1].description, "Searches the web");
    assert.doesNotMatch(JSON.stringify(candidates), /hidden|https:\/\/private|providerHeaders/);
});

test("model router candidates match every model type enabled in the chat picker and its own favorites bucket", () => {
    const helper = helpers();
    const flags = {
        image: "chatWithImageModels", video: "chatWithVideoModels",
        speech: "chatWithSpeechModels", transcription: "chatWithTranscriptionModels",
    };
    for (const [type, flag] of Object.entries(flags)) {
        const state = initialState();
        state.models.push(model(`${type}/model`, type), model("embedding/model", "embedding"));
        state.favoriteModelsByType = {
            language: ["a/model", `${type}/model`],
            [type]: [`${type}/model`], embedding: ["embedding/model"],
        };
        assert.deepEqual(helper.favoriteRouterCandidates(state, "model").map(candidate => candidate.id), ["a/model"]);
        state[flag] = true;
        assert.deepEqual(helper.favoriteRouterModelTypes(state), ["language", type]);
        const candidates = helper.favoriteRouterCandidates(state, "model");
        assert.deepEqual(candidates.map(candidate => candidate.id), ["a/model", `${type}/model`]);
        assert.equal(candidates[1].type, type);
        state.favoriteModelsByType[type] = [];
        assert.deepEqual(helper.favoriteRouterCandidates(state, "model").map(candidate => candidate.id), ["a/model"]);
    }
});

test("each enabled non-language favorite can win using the same shared decision and generation path", async () => {
    for (const [type, flag] of [
        ["image", "chatWithImageModels"], ["video", "chatWithVideoModels"],
        ["speech", "chatWithSpeechModels"], ["transcription", "chatWithTranscriptionModels"],
    ]) {
        const winner = `${type}/model`;
        const h = harness(() => response(winner));
        h.state.models.push(model(winner, type));
        h.state.favoriteModelsByType = { language: ["a/model"], [type]: [winner] };
        h.state[flag] = true;
        h.render();
        await h.send(`Generate ${type}`);
        assert.equal(h.state.selectedModel, winner);
        assert.equal(h.generation[0].options.body.model, winner);
        assert.deepEqual(Object.keys(h.helper.calls[0].options.questions.favorite.criteria), ["a/model", winner]);
        assert.equal(JSON.parse(h.helper.calls[0].options.questions.favorite.criteria[winner]).type, type);
    }
});

test("a disabled model-type flag invalidates its pending winner instead of dispatching a no-longer-allowed favorite", async () => {
    let finish;
    const h = harness(() => new Promise(resolve => { finish = resolve; }));
    h.state.chatWithImageModels = true;
    h.state.favoriteModelsByType = { language: ["a/model"], image: ["image"] };
    const pending = h.send();
    await new Promise(resolve => setImmediate(resolve));
    h.state.chatWithImageModels = false;
    finish(response("image"));
    await assert.rejects(pending, /changed/);
    assert.equal(h.generation.length, 0);
});

test("routing to OpenAI transcription hydrates known-speaker metadata after selecting the real winner", async () => {
    let listed = 0;
    const h = harness(() => response("openai/transcribe"), undefined, undefined, {
        items: [], list: async () => { listed++; return [{ id: "speaker-sample" }]; },
    });
    h.state.models.push(model("openai/transcribe", "transcription"));
    h.state.chatWithTranscriptionModels = true;
    h.state.favoriteModelsByType = { language: ["a/model"], transcription: ["openai/transcribe"] };
    await h.send();
    assert.equal(listed, 1);
    assert.equal(h.generation[0].options.body.model, "openai/transcribe");
    assert.deepEqual(h.generation[0].options.body.providerMetadata.openai.known_speaker_references, ["speaker-sample"]);
});

test("routing uses configured authenticated Decisions API and actual choice wire contract before generation", async () => {
    const h = harness();
    await h.send("Analyze an image", { messages: [
        { role: "assistant", parts: [{ type: "text", text: "Context" }] },
        { ...message("Analyze an image"), parts: [{ type: "text", text: "Analyze an image" }, { type: "file", mediaType: "image/png", filename: "chart.png", url: "data:private" }] },
    ] });
    assert.equal(h.state.selectedModel, "b/model");
    assert.equal(h.state.favoriteModelRouter, true);
    const call = h.helper.calls[0];
    assert.equal(call.config.baseUrl, "https://gateway/api/decisions");
    assert.equal(call.config.headers.authorization, ["Bearer", "decision-token"].join(" "));
    assert.equal(call.config.headers["x-custom"], "custom");
    assert.equal(call.modelId, "d/decide");
    assert.deepEqual(Object.keys(call.options.questions), ["favorite"]);
    assert.deepEqual(Object.keys(call.options.questions.favorite.criteria), ["a/model", "b/model"]);
    assert.match(call.options.questions.favorite.criteria["b/model"], /vision/);
    assert.match(JSON.stringify(call.options.state), /Context|chart.png/);
    assert.doesNotMatch(JSON.stringify(call.options.state), /data:private/);
    assert.equal(h.generation[0].snapshot.model, "b/model");
    assert.equal(h.generation[0].options.body.model, "b/model");
    assert.equal(h.generation[0].options.body.temperature, 0.5);
    assert.equal(h.generation[0].options.body.agents, undefined);
    assert.equal(h.generation[0].options.body.providerRequestConfig, undefined);
});

test("each new turn decides again; tool continuations and regeneration retain the pinned actual transport/body", async () => {
    let count = 0;
    const h = harness(() => response(++count === 1 ? "b/model" : "a/model"));
    await h.send();
    h.state.selectedModel = "manual/change";
    h.render();
    await h.transport.sendMessages({ trigger: "submit-message", messages: [{ role: "assistant", parts: [{ type: "tool-code" }] }], body: { model: "stale" } });
    await h.transport.sendMessages({ trigger: "regenerate-message", messages: [message("Help")], body: {} });
    assert.equal(count, 1);
    assert.ok(h.generation.every(entry => entry.snapshot.model === "b/model"));
    assert.equal(h.generation[1].options.body.model, "b/model");
    await h.send("Next turn");
    assert.equal(count, 2);
    assert.equal(h.generation[3].snapshot.model, "a/model");
});

test("agent router uses identical decision logic and replaces the agent list with one real canonical winner", async () => {
    const h = harness(() => response("remote:Remote"));
    Object.assign(h.state, { chatMode: "agent", favoriteAgentRouter: true });
    h.render();
    await h.send();
    assert.deepEqual(h.state.selectedAgentNames, ["remote:Remote"]);
    assert.deepEqual(h.generation[0].snapshot.agents, ["remote:Remote"]);
    assert.equal(h.generation[0].options.body.model, undefined);
    assert.equal(h.generation[0].options.body.models, undefined);
    assert.deepEqual(Object.keys(h.helper.calls[0].options.questions.favorite.criteria), ["local:Local", "remote:Remote"]);
});

for (const [name, decide] of [
    ["malformed response", () => ({ answers: {} })],
    ["refusal", () => ({ answers: { favorite: { type: "refusal", reason: "Cannot decide" } }, warnings: [] })],
    ["nonfavorite winner", () => response("unrelated/model")],
    ["network failure", () => { throw new Error("Network failed"); }],
]) test(`${name} fails visibly without any generation or fallback`, async () => {
    const h = harness(decide);
    await assert.rejects(h.send());
    assert.equal(h.generation.length, 0);
    assert.equal(h.state.selectedModel, "old/model");
    assert.equal(h.state.favoriteModelRouter, true);
    assert.equal(h.state.favoriteRouterDeciding, false);
});

test("missing/invalid decision configuration and disappearing favorites do not silently become manual selection", async () => {
    for (const patch of [
        { userPreferredDecisionModel: undefined },
        { userPreferredDecisionModel: "missing" },
        { favoriteModelsByType: { language: ["a/model", "missing"] } },
    ]) {
        const h = harness();
        Object.assign(h.state, patch);
        await assert.rejects(h.send());
        assert.equal(h.generation.length, 0);
        assert.equal(h.state.favoriteModelRouter, true);
    }
    const h = harness();
    h.setConfig({ gatewayEnabled: false });
    await assert.rejects(h.send());
    assert.equal(h.generation.length, 0);
});

test("favorites or preference changed during decision invalidate a stale winner", async () => {
    for (const change of [
        h => { h.state.favoriteModelsByType.language = ["a/model"]; },
        h => { h.state.favoriteModelRouter = false; },
        h => { h.state.userPreferredDecisionModel = undefined; },
        h => { h.state.selectedModel = "a/model"; },
        h => { h.state.selectedAgentNames = ["local:Local"]; },
        h => h.setConfig({ baseUrl: "https://other" }),
    ]) {
        let finish;
        const h = harness(() => new Promise(resolve => { finish = resolve; }));
        const pending = h.send();
        await new Promise(resolve => setImmediate(resolve));
        change(h);
        finish(response("b/model"));
        await assert.rejects(pending, /changed/);
        assert.equal(h.generation.length, 0);
    }
});

test("routing uses edited and undeleted context without modifying the actual transport's messages", async () => {
    const original = [
        message("Deleted request"),
        { id: "edited", role: "assistant", parts: [{ type: "text", text: "Outdated answer" }] },
        message("Latest request"),
    ];
    const corrected = { id: "edited", role: "assistant", parts: [{ type: "text", text: "Corrected answer" }] };
    const h = harness(undefined, undefined, messages => messages
        .filter(msg => msg.id !== "Deleted request")
        .map(msg => msg.id === "edited" ? corrected : msg));
    await h.send(undefined, { messages: original });
    const evidence = JSON.stringify(h.helper.calls[0].options.state);
    assert.match(evidence, /Corrected answer|Latest request/);
    assert.doesNotMatch(evidence, /Deleted request|Outdated answer/);
    assert.equal(h.generation[0].options.messages, original);
    assert.equal(original[1].parts[0].text, "Outdated answer");
});

test("a context edit while deciding invalidates its stale routing result", async () => {
    let finish, text = "Original context";
    const h = harness(() => new Promise(resolve => { finish = resolve; }), undefined,
        messages => [message(text), ...messages]);
    const pending = h.send();
    await new Promise(resolve => setImmediate(resolve));
    text = "Edited context";
    finish(response("b/model"));
    await assert.rejects(pending, /changed/);
    assert.equal(h.generation.length, 0);
});

test("stop, unmount, and concurrent sends cannot dispatch a late decision winner", async () => {
    for (const unmount of [false, true]) {
        let finish;
        const h = harness(() => new Promise(resolve => { finish = resolve; }));
        const controller = new AbortController();
        const pending = h.send("First", { abortSignal: controller.signal });
        await new Promise(resolve => setImmediate(resolve));
        await assert.rejects(h.send("Overlapping"), /already in progress/);
        if (unmount) h.unmount(); else controller.abort();
        finish(response("b/model"));
        await assert.rejects(pending, /abort/i);
        assert.equal(h.generation.length, 0);
        assert.equal(h.state.selectedModel, "old/model");
    }
});

test("manual sends bypass decisions and retain their existing request overrides", async () => {
    const h = harness();
    h.state.favoriteModelRouter = false;
    await h.send();
    assert.equal(h.helper.calls.length, 0);
    assert.equal(h.generation[0].options.body.model, "stale");
    assert.deepEqual(h.generation[0].options.body.agents, ["stale"]);
});

test("manual regeneration uses the latest selected transport instead of pinning the previous manual turn", async () => {
    const h = harness();
    h.state.favoriteModelRouter = false;
    await h.send();
    h.state.setSelectedModel("a/model");
    h.render();
    await h.transport.sendMessages({ trigger: "regenerate-message", messages: [message("Help")] });
    assert.equal(h.helper.calls.length, 0);
    assert.equal(h.generation[0].snapshot.model, "old/model");
    assert.equal(h.generation[1].snapshot.model, "a/model");
    assert.equal(h.generation[1].options.body, undefined);
    h.state.setSelectedModel("b/model");
    h.render();
    await h.transport.sendMessages({ trigger: "submit-message", messages: [{ role: "assistant", parts: [] }] });
    assert.equal(h.generation[2].snapshot.model, "b/model");
});

test("disabling routing retains the routed run for regeneration but a new manual turn releases its pin", async () => {
    const h = harness();
    await h.send();
    h.state.favoriteModelRouter = false;
    h.state.setSelectedModel("a/model");
    h.render();
    await h.transport.sendMessages({ trigger: "regenerate-message", messages: [message("Help")] });
    assert.equal(h.generation[1].snapshot.model, "b/model");
    assert.equal(h.generation[1].options.body.model, "b/model");
    await h.send("New manual turn");
    assert.equal(h.generation[2].snapshot.model, "a/model");
    h.state.setSelectedModel("old/model");
    h.render();
    await h.transport.sendMessages({ trigger: "regenerate-message", messages: [message("New manual turn")] });
    assert.equal(h.generation[3].snapshot.model, "old/model");
    assert.equal(h.helper.calls.length, 1);
});

test("initial-message submission hook routes before generation and removes stale navigation targets", async () => {
    for (const kind of ["model", "agent"]) {
        const h = harness(() => response(kind === "model" ? "b/model" : "remote:Remote"));
        Object.assign(h.state, { chatMode: kind === "model" ? "chat" : "agent", favoriteAgentRouter: kind === "agent" });
        h.render();
        const effects = [], saved = [], failures = [], navigation = [];
        const { usePendingMessageAutoSend } = load(root + "chat/engine/usePendingMessageAutoSend.ts", {
            react: { useRef: value => ({ current: value }), useEffect: effect => effects.push(effect) },
            "../../transcriptions/knownSpeakersProviderMetadata": {
                withOpenAiKnownSpeakerReferences: async metadata => metadata,
            },
        });
        const pending = message("First request");
        const staleBody = {
            model: "old/manual-model", agents: [{ name: "old manual agent" }], models: ["old/remote"],
            providerHeaders: { old: { "x-old": "old" } }, providerRequestConfig: { old: true },
            temperature: 0.7, response_format: { type: "json_object" },
        };
        usePendingMessageAutoSend({
            conversationId: "conversation",
            locationState: { pendingMessage: pending, model: staleBody.model, agents: staleBody.agents, models: staleBody.models },
            messages: [],
            addMessage: async (id, msg) => saved.push({ id, msg }),
            sendMessage: async (msg, options) => h.send(undefined, { ...options, messages: [msg] }),
            startRun() {}, navigate: async (...args) => navigation.push(args),
            rename() {}, getConversation: async () => ({}), conversationName: async () => undefined,
            body: staleBody, onFailure: error => failures.push(error),
        });
        effects.forEach(effect => effect());
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(failures, []);
        assert.equal(saved[0].msg, pending);
        assert.equal(h.helper.calls.length, 1);
        assert.equal(h.generation.length, 1);
        const body = h.generation[0].options.body;
        if (kind === "model") {
            assert.equal(body.model, "b/model");
            assert.equal(body.agents, undefined);
        } else {
            assert.equal(body.model, undefined);
            assert.deepEqual(body.agents, [{ id: "remote:Remote" }]);
        }
        assert.equal(body.models, undefined);
        assert.equal(body.providerRequestConfig, undefined);
        assert.equal(body.providerHeaders.old, undefined);
        assert.equal(body.temperature, 0.7);
        assert.deepEqual(body.response_format, { type: "json_object" });
        assert.equal(navigation.length, 1);
    }
});

test("typed and expanded-prompt submission hooks both persist the user message and route exactly once", async () => {
    let decisionsMade = 0;
    const h = harness(() => response(++decisionsMade === 1 ? "b/model" : "a/model"));
    const saved = [], failures = [];
    let cleared = 0;
    const runtime = { clear() { cleared++; } };
    const { useChatActions } = load(root + "chat/engine/useChatActions.ts", {
        react: { useMemo: factory => factory(), useCallback: callback => callback },
        "aihappey-state": { useAppStore: selector => selector(h.state) },
        "../../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => ({}) },
        "../messages/useUserMessageBuilder": { useUserMessageBuilder: () => ({
            buildFromText: async text => message(text),
            buildFromPrompt: async (prompt, args) => message(`${prompt.name}: ${args.topic}`),
        }) },
        "./useActiveProviderMetadata": { useActiveProviderMetadata: () => ({ old: {} }) },
        "../layout/useChatErrors": { useChatErrors: () => ({ addChatError: error => failures.push(error) }) },
        "../../storage/storageErrorMessage": { useStorageErrorMessage: () => error => error },
        "../../../runtime/mcp/mcpResourceRuntime": { mcpResourceRuntime: runtime },
        "../../../runtime/files/fileAttachmentRuntime": { fileAttachmentRuntime: runtime },
        "../../../runtime/files/urlAttachmentRuntime": { urlAttachmentRuntime: runtime },
        "../../agents/agentSelection": agentSelection,
        "./endpointProfiles": {
            resolveEndpointProfileForSelectedModel: () => undefined,
            validateEndpointProfileForModel: () => undefined,
            resolveEndpointProfileChatEndpoint: () => "/api/chat",
            resolveEndpointProfileRequestMetadata: ({ activeProviderMetadata }) => activeProviderMetadata,
            resolveEndpointProfileRequestProviderHeaders: () => ({ old: { "x-old": "old" } }),
            resolveEndpointProfileProviderConfig: () => undefined,
            splitEndpointProfileProviderConfig: () => ({}),
        },
        "../../tools/toolRequestConfig": { decorateToolsWithRequestConfig: tools => tools },
        "./genericChatEndpoint": { isGenericChatEndpoint: () => false },
    });
    // Keep this original render's actions for both sends: the body must not retain its old selected model.
    const actions = useChatActions({
        getAttachmentParts: async () => ({ parts: [], convertedKeys: [] }),
        addMessage: async (id, msg) => saved.push(msg),
        sendMessage: async (msg, options) => h.send(undefined, { ...options, messages: [msg] }),
        selectedModel: "old/manual-model", conversationId: "conversation",
        finalTools: [{ name: "tool" }], temperature: 0.6, rename() {},
    });
    await actions.handleSend("Typed request");
    await actions.onPromptExecute({ name: "Explain" }, { topic: "routing" });
    assert.deepEqual(failures, []);
    assert.deepEqual(saved.map(msg => msg.parts[0].text), ["Typed request", "Explain: routing"]);
    assert.equal(h.helper.calls.length, 2);
    assert.equal(h.generation.length, 2);
    assert.deepEqual(h.generation.map(entry => entry.options.body.model), ["b/model", "a/model"]);
    assert.equal(h.generation[1].options.body.temperature, 0.6);
    assert.deepEqual(h.generation[1].options.body.tools, [{ name: "tool" }]);
    assert.equal(h.generation[1].options.body.providerHeaders.old, undefined);
    assert.equal(cleared, 6);
});

test("router honors endpoint override and auth failures never generate or retry unauthenticated", async () => {
    const h = harness();
    h.setConfig({ endpoints: { decisions: "/custom/decide" } });
    await h.send();
    assert.equal(h.helper.calls[0].config.baseUrl, "https://gateway/custom/decide");
    const failing = harness();
    failing.setConfig({ getAccessToken: async () => { throw new Error("Sign in again"); } });
    await assert.rejects(failing.send(), /Sign in again/);
    assert.equal(failing.helper.calls.length, 0);
    assert.equal(failing.generation.length, 0);
});

test("direct-provider auth fetches retain their own credential snapshot across a route change", async () => {
    const requests = [];
    const { useAuthFetch } = load(root + "chat/engine/useAuthFetch.ts", {
        react: { useMemo: factory => factory() },
        "./apiDebug": load(root + "chat/engine/apiDebug.ts"),
    });
    const customFetch = async (url, options) => { requests.push({ url, headers: new Headers(options.headers) }); };
    const first = useAuthFetch({
        chatMode: "chat", customHeaders: { "x-api-key": "first-fixture" }, customFetch,
    });
    const next = useAuthFetch({
        chatMode: "chat", customHeaders: { Authorization: ["Bearer", "second-fixture"].join(" ") }, customFetch,
    });
    await first("https://first/v1/messages");
    await next("https://second/v1/responses");
    await first("https://first/v1/messages"); // continuation of the pinned first run
    assert.equal(requests[0].headers.get("x-api-key"), "first-fixture");
    assert.equal(requests[1].headers.get("Authorization"), ["Bearer", "second-fixture"].join(" "));
    assert.equal(requests[1].headers.has("x-api-key"), false);
    assert.equal(requests[2].headers.get("x-api-key"), "first-fixture");
    assert.equal(requests[2].headers.has("Authorization"), false);
});

test("real SDK Chat retains messages and stops the pinned cross-profile tool continuation", async () => {
    const { Chat } = require("@ai-sdk/react");
    const { DefaultChatTransport } = require("ai");
    const requests = [];
    let decisionCount = 0, chat, h;
    const profiles = {
        "a/model": { api: "https://gateway/api/chat", key: "gateway-fixture" },
        "b/model": { api: "https://provider/v1/responses", key: "provider-fixture" },
    };
    const { useAuthFetch } = load(root + "chat/engine/useAuthFetch.ts", {
        react: { useMemo: factory => factory() },
        "./apiDebug": load(root + "chat/engine/apiDebug.ts"),
    });
    h = harness(() => response(++decisionCount === 1 ? "b/model" : "a/model"), snapshot => {
        const profile = profiles[snapshot.model] ?? profiles["a/model"];
        const fetch = useAuthFetch({
            chatMode: "chat", customHeaders: { "x-api-key": profile.key },
            customFetch: async (url, options) => {
                requests.push({ url, body: JSON.parse(options.body), headers: new Headers(options.headers), signal: options.signal });
                const requestNumber = requests.length;
                const stream = new ReadableStream({
                    start(controller) {
                        const chunk = value => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`));
                        chunk({ type: "start", messageId: `assistant-${requestNumber}` });
                        chunk({ type: "start-step" });
                        if (requestNumber === 1) {
                            chunk({ type: "tool-input-available", toolCallId: "lookup-1", toolName: "lookup", input: {} });
                            chunk({ type: "finish-step" });
                            chunk({ type: "finish", finishReason: "tool-calls" });
                            controller.close();
                        } else if (requestNumber === 2) {
                            chunk({ type: "text-start", id: "text" });
                            chunk({ type: "text-delta", id: "text", delta: "Partial response" });
                            options.signal.addEventListener("abort", () => controller.error(new DOMException("Stopped", "AbortError")), { once: true });
                        } else {
                            chunk({ type: "text-start", id: "text" });
                            chunk({ type: "text-delta", id: "text", delta: "New turn" });
                            chunk({ type: "text-end", id: "text" });
                            chunk({ type: "finish-step" });
                            chunk({ type: "finish", finishReason: "stop" });
                            controller.close();
                        }
                    },
                });
                return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
            },
        });
        // Match the engine's immutable endpoint capture, rather than referring to the current selected profile.
        const api = profile.api;
        return new DefaultChatTransport({
            api, fetch,
            prepareSendMessagesRequest: options => ({
                api, body: { ...options.body, id: options.id, messages: options.messages },
            }),
        });
    });
    const failures = [];
    chat = new Chat({
        id: "conversation",
        transport: h.transport,
        messages: [message("Earlier request"), { id: "earlier-assistant", role: "assistant", parts: [{ type: "text", text: "Earlier response" }] }],
        sendAutomaticallyWhen: ({ messages }) => requests.length === 1
            && messages.at(-1).parts.some(part => part.type === "tool-lookup" && part.state === "output-available"),
        onToolCall: async ({ toolCall }) => {
            // The independently rendered header may select another profile while this run is active.
            h.state.setSelectedModel("a/model");
            h.render();
            void chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: "Tool result" });
        },
        onError: error => failures.push(error),
    });
    const pending = chat.sendMessage(message("Use the lookup tool"), { body: { model: "stale", providerHeaders: { old: {} } } });
    for (let attempt = 0; attempt < 30 && !(requests.length === 2 && chat.status === "streaming"); attempt++) {
        await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(chat.id, "conversation");
    assert.equal(chat.status, "streaming");
    assert.equal(requests.length, 2);
    assert.equal(decisionCount, 1);
    assert.ok(requests.every(request => request.url === profiles["b/model"].api));
    assert.ok(requests.every(request => request.headers.get("x-api-key") === profiles["b/model"].key));
    assert.ok(requests.every(request => request.body.model === "b/model"));
    assert.ok(chat.messages.some(msg => msg.id === "Earlier request"));
    assert.ok(chat.messages.some(msg => msg.id === "earlier-assistant"));
    assert.ok(chat.messages.some(msg => msg.parts.some(part => part.type === "tool-lookup" && part.output === "Tool result")));
    await chat.stop();
    await pending;
    assert.equal(requests[1].signal.aborted, true);
    assert.equal(chat.status, "ready");
    assert.deepEqual(failures, []);
    await chat.sendMessage(message("Another turn"));
    assert.equal(decisionCount, 2);
    assert.equal(requests[2].url, profiles["a/model"].api);
    assert.equal(requests[2].body.model, "a/model");
    assert.equal(chat.messages.filter(msg => msg.role === "user").length, 3);
});

test("engine chat identity and captured endpoints cannot change when the routing winner changes", () => {
    const engine = fs.readFileSync(root + "chat/engine/VercelChatInner.tsx", "utf8");
    assert.match(engine, /useChat\(\{\s*id: conversationId,\s*transport: routedTransport/);
    assert.match(engine, /const requestApi = api;/);
    assert.match(engine, /useFavoriteRouterTransport\(transport, baseBody, applyOverrides, files\)/);
    assert.doesNotMatch(engine, /chatInstanceId|apiRef\.current|effectiveChatEndpointRef\.current/);
});

test("picker routing is explicit opt-in and never passes virtual IDs to the actual selection", () => {
    const state = initialState(), helper = helpers();
    let selected;
    const hooks = { ...React, useMemo: factory => factory(), useEffect() {} };
    const store = { setState: patch => Object.assign(state, patch) };
    const { ModelSelect } = load(root + "models/ModelSelect.tsx", {
        react: hooks, "aihappey-components": { ModelSelectField: "ModelSelectField" },
        "aihappey-types": { getModelDisplayName: (model, fallback) => model?.name ?? fallback },
        "aihappey-state": { store, useAppStore: selector => selector(state) },
        "aihappey-i18n": { useTranslation: () => ({ t: (key, fallback) => fallback ?? key }) },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => ({}) },
        "../chat/engine/favoriteRouter": helper,
    });
    const props = { models: state.models, value: state.selectedModel, onChange: id => { selected = id; } };
    let field = ModelSelect(props);
    assert.deepEqual(field.props.virtualOptions, []);
    assert.equal(field.props.valueTitle, undefined);
    field = ModelSelect({ ...props, allowFavoriteRouter: true });
    assert.equal(field.props.virtualOptions.length, 1);
    field.props.onChange(helper.FAVORITE_MODEL_ROUTER);
    assert.equal(selected, undefined);
    assert.equal(state.selectedModel, "old/model");
    assert.equal(state.favoriteModelRouter, true);
    assert.equal(ModelSelect({ ...props, allowFavoriteRouter: true }).props.valueTitle, "Favorite model router");
    for (const value of ["a/model", "b/model", ""]) {
        const routed = ModelSelect({ ...props, value, allowFavoriteRouter: true });
        assert.equal(routed.props.valueTitle, "Favorite model router");
        assert.equal(routed.props.value, value);
    }
    field.props.onChange("a/model");
    assert.equal(selected, "a/model");
    assert.equal(state.favoriteModelRouter, false);
    assert.equal(ModelSelect({ ...props, allowFavoriteRouter: true }).props.valueTitle, undefined);
    state.favoriteModelsByType.language = ["a/model"];
    assert.deepEqual(ModelSelect({ ...props, allowFavoriteRouter: true }).props.virtualOptions, []);
    state.favoriteModelsByType.image = ["image"];
    assert.equal(ModelSelect({ ...props, allowFavoriteRouter: true, modelTypes: ["language", "image"] }).props.virtualOptions.length, 1);
    assert.deepEqual(ModelSelect({ ...props, allowFavoriteRouter: true }).props.virtualOptions, []);
});

test("agent picker exposes only current favorites, retains real values, and opts out on manual choice", () => {
    const state = initialState(), helper = helpers();
    state.setSelectedAgents = values => { state.selectedAgentNames = values; };
    const { AgentSelect } = load(root + "agents/AgentSelect.tsx", {
        react: { ...React, useMemo: factory => factory() },
        "aihappey-components": { useTheme: () => ({ Select: "Select" }) },
        "aihappey-state": { store: { setState: patch => Object.assign(state, patch) }, useAppStore: selector => selector(state) },
        "aihappey-i18n": { useTranslation: () => ({ t: (key, fallback) => fallback ?? key }) },
        "../../shell/responsive/useIsDesktop": { useIsDesktop: () => true },
        "./agentSelection": agentSelection,
        "./agentTags": load(root + "agents/agentTags.ts"),
        "../chat/context/ChatContext": { useChatContext: () => ({ config: { endpoints: {} } }) },
        "../chat/engine/favoriteRouter": helper,
    });
    let selected;
    const props = { localAgents: state.agents, remoteAgentModels: state.remoteAgentModels,
        favoriteAgentIds: state.favoriteAgentIds, values: ["local:Local"], onChange: id => { selected = id; } };
    function optionValues(node) {
        if (!React.isValidElement(node)) return [];
        return node.type === "option" ? [node.props.value] : React.Children.toArray(node.props.children).flatMap(optionValues);
    }
    assert.ok(!optionValues(AgentSelect(props)).includes(helper.FAVORITE_AGENT_ROUTER));
    assert.equal(AgentSelect(props).props.valueTitle, "Local");
    let picker = AgentSelect({ ...props, allowFavoriteRouter: true });
    assert.ok(optionValues(picker).includes(helper.FAVORITE_AGENT_ROUTER));
    picker.props.onChange(helper.FAVORITE_AGENT_ROUTER);
    assert.equal(selected, undefined);
    picker = AgentSelect({ ...props, allowFavoriteRouter: true });
    assert.deepEqual(picker.props.values, ["local:Local"]);
    assert.equal(picker.props.valueTitle, "Favorite agent router");
    for (const values of [["remote:Remote"], ["local:Local", "remote:Remote"], []]) {
        const routed = AgentSelect({ ...props, values, allowFavoriteRouter: true });
        assert.equal(routed.props.valueTitle, "Favorite agent router");
        assert.deepEqual(routed.props.values, values);
    }
    assert.equal(AgentSelect(props).props.valueTitle, "Local");
    picker.props.onChange("local:Local");
    assert.deepEqual(state.selectedAgentNames, ["local:Local"]);
    assert.equal(selected, undefined);
    assert.equal(state.favoriteAgentRouter, false);
    assert.equal(AgentSelect({ ...props, allowFavoriteRouter: true }).props.valueTitle, "Local");
    AgentSelect({ ...props, allowFavoriteRouter: true }).props.onChange("remote:Remote");
    assert.equal(selected, "remote:Remote");
    assert.ok(!optionValues(AgentSelect({ ...props, allowFavoriteRouter: true, favoriteAgentIds: ["local:Local", "missing"] })).includes(helper.FAVORITE_AGENT_ROUTER));
});

test("agent router can submit its first typed or attachment-only request without a prior manual winner", () => {
    const state = {
        ...initialState(), chatMode: "agent", favoriteAgentRouter: true,
        selectedAgentNames: [], mcpServers: {}, mcpServerContent: {},
    };
    let value = "", files = [], urls = [], resources = [];
    const sent = [], admitted = [];
    const { useMessageInput } = load(root + "chat/input/useMessageInput.ts", {
        react: { useState: () => [value, next => { value = next; }], useRef: initial => ({ current: initial }) },
        "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "usehooks-ts": { useDarkMode: () => ({ isDarkMode: false }) },
        "../context/ChatContext": { useChatContext: () => ({ config: {} }) },
        "../../../runtime/mcp/mcpResourceRuntime": { mcpResourceRuntime: {}, useSelectedResources: () => resources },
        "../../../runtime/files/fileAttachmentRuntime": { fileAttachmentRuntime: {}, useFileAttachments: () => files },
        "../../../runtime/files/urlAttachmentRuntime": { useUrlAttachments: () => urls },
        "./useChatAttachmentAdmission": { useChatAttachmentAdmission: () => additions => admitted.push(...additions) },
    });
    const render = () => useMessageInput({ onSend: text => sent.push(text) });
    assert.equal(render().canSend, false);
    render().setValue("First routed request");
    assert.equal(render().canSend, true);
    render().handleSubmit({ preventDefault() {} });
    assert.deepEqual(sent, ["First routed request"]);
    assert.deepEqual(state.selectedAgentNames, []);
    const file = { name: "request.txt" };
    render().handlePaste({ clipboardData: { items: [{ kind: "file", getAsFile: () => file }] } });
    assert.deepEqual(admitted, [file]);
    for (const kind of ["file", "url", "resource"]) {
        files = kind === "file" ? [file] : [];
        urls = kind === "url" ? [{ url: "https://example.org" }] : [];
        resources = kind === "resource" ? [{ uri: "resource://request" }] : [];
        assert.equal(render().canSend, true);
        render().handleSend();
        assert.equal(sent.at(-1), "");
    }
    files = []; urls = []; resources = [];
    state.favoriteAgentRouter = false;
    render().setValue("Manual request");
    assert.equal(render().canSend, false);
    state.selectedAgentNames = ["local:Local"];
    assert.equal(render().canSend, true);
    state.selectedAgentNames = [];
    state.chatMode = "chat";
    assert.equal(render().canSend, true);
});
