const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const base = "packages/aihappey-core/src/features/";
function load(path, mocks = {}) {
    const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
        fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => {
        if (id in mocks) return mocks[id];
        throw Error("Unmocked import " + id);
    }, module, module.exports);
    return module.exports;
}
const agentModels = load("packages/aihappey-types/src/agentModels.ts");
const validation = load("packages/aihappey-decisions/src/validation.ts");
const decisionTypes = load("packages/aihappey-decisions/src/types.ts");
const response = choice => ({ answers: { favorite: { type: "choice", choice } }, warnings: [] });

function harness(type, decide = () => response("b/" + type), azure = false) {
    let state = {
        modelsLoaded: true, gatewayEnabled: true,
        models: [
            ...["image", "video", "speech"].flatMap(type => ["a", "b"].map(p => ({ id: p + "/" + type, type }))),
            { id: "openai/decide", type: "decision", route: "gateway" },
        ],
        agents: [{ name: "SelectModelAgent", model: { id: "openai/decide" }, instructions: "Pick one" }],
        sideInferenceAgentNames: { selectModelAgent: "SelectModelAgent" },
        customHeaders: { "X-OpenAI-Key": "router-key", "X-Anthropic-Key": "unrelated-key", "X-Api-Key": "endpoint-key" },
        remoteAgentModels: [],
    };
    const calls = [], generation = [], listeners = new Set();
    let config = { baseUrl: "https://gateway", endpoints: {}, headers: { "X-Tenant": "tenant" },
        ...(azure ? { getAccessToken: async () => "entra-token" } : {}) };
    const router = load(base + "chat/engine/favoriteRouter.ts", {
        "aihappey-ai": { defaultEndpoints: { decisions: "/api/decisions" }, createDecisionProvider(config) {
            return { decisionModel(model) { return { async doDecide(options) {
                calls.push({ config, model, options }); return decide(options);
            } }; } };
        } },
        "aihappey-decisions": { ...decisionTypes, ...validation }, "aihappey-types": agentModels,
        "aihappey-state": { DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: { selectModelAgent: "SelectModelAgent" } },
        "../../agents/agentSelection": {},
        "../../provider-credentials/scopedRequest": require("./credential-test-loader.cjs").scoped,
    });
    let slots = [], index, effects, dirty;
    const react = {
        useRef(initial) { const i = index++; return slots[i] ??= { current: initial }; },
        useState(initial) { const i = index++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
            return [slots[i], next => { const value = typeof next === "function" ? next(slots[i]) : next;
                if (!Object.is(value, slots[i])) { slots[i] = value; dirty = true; } }]; },
        useCallback: fn => fn,
        useEffect(effect, deps) { const i = index++, previous = slots[i];
            if (!previous || deps.some((d, j) => !Object.is(d, previous.deps[j]))) {
                effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: effect() }; });
            }
        },
    };
    const store = { getState: () => state, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
    const { usePrimitiveModelSelection } = load(base + "models/usePrimitiveModelSelection.ts", {
        react, "aihappey-state": { store, useAppStore: fn => fn(state) },
        "../chat/context/ChatContext": { useChatContext: () => ({ config }) },
        "../chat/engine/favoriteRouter": router,
    });
    function render() {
        let result;
        do { dirty = false; index = 0; effects = []; result = usePrimitiveModelSelection(type, "a/" + type); effects.forEach(fn => fn()); } while (dirty);
        return result;
    }
    return {
        render, calls, generation, get state() { return state; },
        update(patch) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); },
        unmount() { slots.forEach(slot => slot?.cleanup?.()); },
        replaceConfig(next) { config = { ...config, ...next }; },
        run(text = "Prompt text") { return render().run(text, async (model, signal) => {
            signal.throwIfAborted(); generation.push(model); return model;
        }); },
    };
}

for (const type of ["image", "video", "speech"]) {
    for (const azure of [false, true]) test(`${type} routes one prompt to one same-type winner with ${azure ? "Azure" : "header"} auth`, async () => {
        const h = harness(type, undefined, azure);
        assert.equal(h.render().selectionProps.multiselect, true);
        h.render().selectionProps.onChange("b/" + type);
        assert.equal(h.render().singleModelSelected, false);
        await h.run("The actual submitted prompt");
        assert.deepEqual(h.generation, ["b/" + type]);
        assert.deepEqual(h.render().selectionProps.values, ["a/" + type, "b/" + type]);
        const call = h.calls[0];
        assert.deepEqual(Object.keys(call.options.questions.favorite.criteria), ["a/" + type, "b/" + type]);
        assert.equal(call.options.state.conversation[0].parts[0].text, "The actual submitted prompt");
        const headers = new Headers(call.config.headers);
        assert.equal(headers.get("X-OpenAI-Key"), "router-key");
        assert.equal(headers.get("X-Anthropic-Key"), null);
        assert.equal(headers.get("X-Api-Key"), "endpoint-key");
        assert.equal(headers.get("Authorization"), azure ? "Bearer entra-token" : null);
        await h.run("Another prompt"); assert.equal(h.calls.length, 2);
    });
    test(`${type} bypasses decisions for one candidate and retains the last checkbox`, async () => {
        const h = harness(type);
        h.render().selectionProps.onChange("a/" + type);
        await h.run();
        assert.equal(h.calls.length, 0); assert.deepEqual(h.generation, ["a/" + type]);
    });
    test(`${type} collapses to manual selection when routing is disabled or its model disappears`, () => {
        for (const patch of [
            { sideInferenceAgentNames: { selectModelAgent: "" } },
            { gatewayEnabled: false },
            { agents: [] },
        ]) {
            const h = harness(type);
            h.render().selectionProps.onChange("b/" + type);
            h.update(patch);
            assert.equal(h.render().selectionProps.multiselect, false);
            assert.deepEqual(h.render().selectionProps.values, ["a/" + type]);
        }
    });
}

test("primitive routing rejects invalid decisions without generation and resets loading", async () => {
    for (const decide of [() => response("unselected"), () => ({}), () => { throw Error("network"); }]) {
        const h = harness("image", decide);
        h.render().selectionProps.onChange("b/image");
        await assert.rejects(h.run());
        assert.equal(h.render().processing, false); assert.deepEqual(h.generation, []);
    }
});

test("primitive routing blocks concurrent sends and late winners after selection, catalog, account/config changes or unmount", async () => {
    for (const change of [h => h.unmount(), h => { h.render().selectionProps.onChange("b/image"); h.render(); },
        h => h.update({ models: [...h.state.models] }), h => h.update({ customHeaders: {} }),
        h => { h.replaceConfig({ baseUrl: "https://other-account" }); h.render(); }]) {
        let finish;
        const h = harness("image", () => new Promise(resolve => { finish = resolve; }));
        h.render().selectionProps.onChange("b/image");
        const pending = h.run(); await new Promise(setImmediate);
        assert.equal(h.render().processing, true);
        await h.run(); assert.equal(h.calls.length, 1);
        change(h); finish(response("b/image"));
        await assert.rejects(pending);
        assert.deepEqual(h.generation, []);
    }
});

test("model discovery forwards configured header-auth credentials and preserves custom overrides", async () => {
    let options;
    const state = { modelsLoaded: false, customHeaders: { "X-Tenant": "override" }, models: [],
        setModels: () => {}, resetModels: () => {}, setSelectedModel: () => {} };
    const { useModels } = load(base + "models/useModels.ts", {
        react: { useEffect: effect => effect(), useRef: value => ({ current: value }), useState: initial => [typeof initial === "function" ? initial() : initial, () => {}] },
        "aihappey-state": { store: { getState: () => state }, useAppStore: selector => selector(state) },
        "react-router": { useSearchParams: () => [new URLSearchParams()] },
        "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => ({}) },
        "../provider-credentials/providerAuthHeaders": { listModelsWithSplitProviderHeaders: async request => { options = request; return { data: [] }; } },
    });
    useModels("https://gateway/api/models", undefined, { headers: { "X-Api-Key": "configured-auth", "X-OpenAI-Key": "router-key", "X-Tenant": "base" } });
    assert.deepEqual(options.customHeaders, { "X-Api-Key": "configured-auth", "X-OpenAI-Key": "router-key", "X-Tenant": "override" });
    await new Promise(setImmediate);
});

test("header-auth discovery preserves decision and language entries sharing an ID and isolates each provider key", async () => {
    const requests = [];
    const { listModelsWithSplitProviderHeaders } = require("./credential-test-loader.cjs").load(
        base + "provider-credentials/providerAuthHeaders.ts", {
            "aihappey-http": { createHttpClient: options => ({ get: async url => {
                requests.push({ url, ...options });
                return { data: options.headers["X-OpenAI-Key"] ? [
                    { id: "openai/decide", type: "language" }, { id: "openai/decide", type: "decision" },
                ] : [] };
            } }) },
        });
    const result = await listModelsWithSplitProviderHeaders({ modelsApi: "https://gateway/api/models", includeGatewayModels: true,
        customHeaders: { "X-Api-Key": "endpoint", "X-OpenAI-Key": "openai", "X-Anthropic-Key": "anthropic" },
        providers: { openai: { name: "OpenAI" }, anthropic: { name: "Anthropic" } },
    });
    assert.equal(result.data.filter(m => m.id === "openai/decide").length, 2);
    assert.equal(result.data.find(m => m.type === "decision").route, "gateway");
    assert.equal(requests.length, 3);
    for (const request of requests) {
        assert.equal(request.headers["X-Api-Key"], "endpoint");
        assert.ok(!request.headers["X-OpenAI-Key"] || !request.headers["X-Anthropic-Key"]);
    }
});
