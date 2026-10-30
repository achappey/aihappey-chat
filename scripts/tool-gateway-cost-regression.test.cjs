const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const { load: bundle } = require("./credential-test-loader.cjs");

// Keep hook dependencies explicit while exercising the real gateway adapters and AI SDK.
function load(filename, mocks = {}) {
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id} in ${filename}`);
    }, module, module.exports);
    return module.exports;
}
const root = "packages/aihappey-core/src/";
const costs = load(root + "features/tools/toolGatewayCost.ts");
const backend = bundle("packages/aihappey-ai/src/createBackendProvider.ts");
const ai = { ...require("ai"), ...backend };
const react = { useCallback: fn => fn };

test("optional gateway cost extraction accepts known formats, omits malformed values, and never guesses provider prices", () => {
    for (const value of [0, 0.000267, "0.1"]) {
        for (const key of ["metadata", "providerMetadata", "_meta"]) {
            assert.equal(costs.gatewayResponseCost({ [key]: { gateway: { cost: value } } }), Number(value));
        }
    }
    for (const value of [undefined, null, "", " ", "bad", false, true, [], {}, NaN, Infinity, -Infinity]) {
        assert.equal(costs.gatewayResponseCost({ metadata: { gateway: { cost: value } } }), undefined);
    }
    assert.equal(costs.gatewayResponseCost({ metadata: { openai: { cost: 12 } }, cost: 12 }), undefined);
    // Multiple representations of the same response are alternatives, never additive.
    assert.equal(costs.gatewayResponseCost({ metadata: { gateway: { cost: 2 } }, providerMetadata: { gateway: { cost: 2 } } }), 2);
});

test("result attachment preserves metadata and content without mutations, and leaves unpriced results identical", () => {
    const collector = costs.createToolGatewayCostCollector();
    const result = { content: [], structuredContent: { found: true }, _meta: { ui: { resourceUri: "ui://test" }, gateway: { trace: "keep" } } };
    const before = JSON.stringify(result);
    assert.equal(collector.withCost(result), result);
    collector.recordResponse({ metadata: { gateway: { cost: 0 } } });
    const attached = collector.withCost(result);
    assert.equal(attached._meta.gateway.cost, 0);
    assert.equal(attached._meta.gateway.trace, "keep");
    assert.equal(attached._meta.ui, result._meta.ui);
    assert.equal(attached.content, result.content);
    assert.equal(attached.structuredContent, result.structuredContent);
    assert.equal(JSON.stringify(result), before);
});

test("raw response capture leaves request/response data untouched, handles malformed bodies, and isolates concurrent tools", async () => {
    const a = costs.createToolGatewayCostCollector(), b = costs.createToolGatewayCostCollector();
    const responses = [Response.json({ metadata: { gateway: { cost: 0.1 } } }), Response.json({ providerMetadata: { gateway: { cost: 0.2 } } })];
    const init = { method: "POST", body: "original" };
    const fetcher = index => async (url, options) => {
        assert.equal(options, init);
        assert.equal(url, "https://gateway");
        await new Promise(resolve => setTimeout(resolve, index ? 1 : 10));
        return responses[index];
    };
    const received = await Promise.all([a.wrapFetch(fetcher(0))("https://gateway", init), b.wrapFetch(fetcher(1))("https://gateway", init)]);
    assert.equal(received[0], responses[0]);
    assert.deepEqual(await received[0].json(), { metadata: { gateway: { cost: 0.1 } } });
    assert.equal(a.withCost({})._meta.gateway.cost, 0.1);
    assert.equal(b.withCost({})._meta.gateway.cost, 0.2);
    await a.wrapFetch(async () => new Response("not JSON"))("https://gateway");
    assert.equal(a.withCost({})._meta.gateway.cost, 0.1);
});

const responseBody = (text, cost, output) => ({
    id: "resp_test", object: "response", created_at: 1, model: "gpt-5-mini", status: "completed",
    output: output ?? [{ type: "message", id: "msg_test", role: "assistant", status: "completed",
        content: [{ type: "output_text", text, annotations: [] }] }],
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    metadata: { gateway: { cost } },
});

function sdkHarness(options = {}) {
    const requests = [];
    const fetch = async (url, init) => {
        const body = JSON.parse(init.body);
        requests.push({ url, init, body });
        return Response.json(options.response ? await options.response(body, requests.length) : responseBody(options.text ?? "done", options.cost ?? 0.000267));
    };
    const state = { customHeaders: { "X-OpenAI-Key": "secret", "X-Anthropic-Key": "do-not-send" } };
    const scoped = bundle(root + "features/provider-credentials/scopedBackendProvider.ts", {
        "aihappey-ai": ai,
    });
    const mocks = {
        react, "aihappey-state": { useAppStore: select => select(state) },
        "aihappey-ai": ai,
        "../toolGatewayCost": costs,
        "../../provider-credentials/scopedBackendProvider": scoped,
        "aihappey-tools": { useLocalTools: () => ({ list: async () => options.tools ?? [] }) },
        zod: require("zod"), "json-schema-to-zod": require("json-schema-to-zod"),
    };
    return { mocks, requests, fetch };
}

test("real SDK text and recipe generation retain raw gateway costs without exposing unrelated provider metadata", async () => {
    const recipe = { recipe: { name: "Lasagna", ingredients: [], steps: ["Bake"] } };
    for (const [toolName, text] of [["vercel_ai_generate_text", "hello"], ["vercel_ai_generate_lasagna_recipe", JSON.stringify(recipe)]]) {
        const h = sdkHarness({ text });
        const runtime = load(root + "features/tools/toolcalls/useVercelAIToolCall.ts", h.mocks)
            .useVercelAIToolCall("https://gateway", undefined, {}, h.fetch);
        const result = await runtime.handle({ toolName, input: { model: "openai/gpt-5-mini", prompt: "hello" } });
        assert.equal(result.isError, false);
        assert.equal(result._meta.gateway.cost, 0.000267);
        assert.deepEqual(Object.keys(result._meta), ["gateway"]);
        assert.equal(h.requests.length, 1);
        if (toolName.endsWith("recipe")) assert.deepEqual(result.structuredContent, recipe);
    }
});

test("real SDK tool-loop agents sum requests once instead of double counting SDK steps and final response metadata", async () => {
    const h = sdkHarness({
        tools: [{ id: "local_step", description: "Run a step", inputSchema: '{"type":"object","properties":{},"additionalProperties":false}', execute: 'async () => ({ done: true })' }],
        response: (_body, index) => index === 1
            ? responseBody("", 0.1, [{ type: "function_call", id: "fc_test", call_id: "call_test", name: "local_step", arguments: "{}", status: "completed" }])
            : responseBody("finished", 0.2),
    });
    const runtime = load(root + "features/tools/toolcalls/useVercelAIToolCall.ts", h.mocks)
        .useVercelAIToolCall("https://gateway", undefined, {}, h.fetch);
    const result = await runtime.handle({ toolName: "vercel_ai_tool_loop_agent", input: { model: "openai/gpt-5-mini", tools: ["local_step"], instructions: "Use the step", prompt: "Run", maxStepCount: 3 } });
    assert.equal(result.isError, false, JSON.stringify(result));
    assert.equal(h.requests.length, 2);
    assert.ok(Math.abs(result._meta.gateway.cost - 0.3) < 1e-12);
});

test("SDK output parsing failures retain an already returned cost", async () => {
    const h = sdkHarness({ text: "not a JSON recipe", cost: 0.5 });
    const runtime = load(root + "features/tools/toolcalls/useVercelAIToolCall.ts", h.mocks)
        .useVercelAIToolCall("https://gateway", undefined, {}, h.fetch);
    const result = await runtime.handle({ toolName: "vercel_ai_generate_lasagna_recipe", input: { model: "openai/gpt-5-mini" } });
    assert.equal(result.isError, true);
    assert.equal(result._meta.gateway.cost, 0.5);
});

test("structured-output execution and create/update validation preserve costs, including subsequent storage failures", async () => {
    for (const toolName of ["local_structured_outputs_execute", "local_structured_outputs_create", "local_structured_outputs_update"]) {
        for (const storageFailure of [false, true]) {
            const h = sdkHarness({ text: '{"answer":"yes"}' });
            const schema = '{"type":"object","properties":{"answer":{"type":"string"}},"required":["answer"],"additionalProperties":false}';
            const item = { id: "schema", json_schema: schema };
            const save = async () => { if (storageFailure) throw Error("storage failed"); return item; };
            h.mocks["aihappey-structured-outputs"] = { useStructuredOutputs: () => ({ items: [item], add: save, update: save }) };
            const runtime = load(root + "features/tools/toolcalls/useLocalStructuredOutputsToolCall.ts", h.mocks)
                .useLocalStructuredOutputsRuntime("https://gateway");
            // A default fetch is captured when wrapFetch is constructed, before provider creation.
            const previous = globalThis.fetch;
            globalThis.fetch = h.fetch;
            try {
                const result = await runtime.handle({ toolName, input: { id: "schema", schemaId: "schema", name: "Schema", schema, prompt: "Answer" } });
                assert.equal(result._meta.gateway.cost, 0.000267);
                assert.equal(result.isError, storageFailure && toolName !== "local_structured_outputs_execute");
                assert.equal(h.requests.length, 1);
            } finally { globalThis.fetch = previous; }
        }
    }
});

test("text-inference observer preserves the original text contract and raw cost even for fallback responses", async () => {
    const { invokeSideInferenceAgent } = load(root + "runtime/chat-app/sideInferenceAgentCall.ts", {
        "../../features/provider-credentials/providerAuthHeaders": require("./credential-test-loader.cjs").auth,
        "../../features/chat/engine/endpointProfiles": { resolveProviderRequestModelId: ({ modelId }) => modelId },
        "../../features/chat/engine/genericChatEndpoint": { isGenericChatEndpoint: () => true },
        "../providers/providerRequestConfig": { sanitizeProviderRequestConfigForProvider: () => undefined },
        "../providers/providerMetadata": { PROVIDERS: {} },
    });
    const collector = costs.createToolGatewayCostCollector();
    const options = { feature: "resourceSearch", input: {}, baseUrl: "https://gateway", agentName: "Helper",
        agents: [{ name: "Helper", model: { id: "openai/test" } }], models: [{ id: "openai/test" }],
        fallback: "fallback", onResponse: collector.recordResponse };
    assert.equal(await invokeSideInferenceAgent({ ...options, fetch: async () => Response.json({ output_text: " selected ", metadata: { gateway: { cost: 0.1 } } }) }), "selected");
    assert.equal(await invokeSideInferenceAgent({ ...options, fetch: async () => Response.json({ metadata: { gateway: { cost: 0.2 } } }) }), "fallback");
    assert.ok(Math.abs(collector.withCost({})._meta.gateway.cost - 0.3) < 1e-12);
});

test("custom MCP passthrough preserves gateway metadata with and without UI augmentation", async () => {
    const output = { content: [], _meta: { gateway: { cost: 0.2, trace: "retain" }, ui: { resourceUri: "ui://test" } } };
    const before = JSON.stringify(output);
    const { useMcpPassthroughToolCall } = load(root + "features/tools/toolcalls/useMcpPassthroughToolCall.ts", {
        react, "../../../runtime/mcp/readResource": { readResource: async () => ({ contents: [{ mimeType: "text/html;profile=mcp-app", text: "<p>app</p>" }] }) },
    });
    for (const enableApps of [false, true]) {
        const { handleMcpPassthroughToolCall } = useMcpPassthroughToolCall({ callTool: async () => output, enableApps,
            mcpServerContent: { server: { tools: [{ name: "research" }] } }, locale: "en" });
        const result = await handleMcpPassthroughToolCall({ toolName: "research", toolCallId: "call", input: {} });
        assert.equal(result._meta.gateway, output._meta.gateway);
        assert.equal(result._meta["chat/html"], enableApps ? "<p>app</p>" : undefined);
    }
    assert.equal(JSON.stringify(output), before);
});

test("saved conversations retain local/custom-MCP costs in totals, preserve the two-entry rule and do not count display fragments", async () => {
    const { LocalConversationStore } = load("packages/aihappey-conversations/src/stores/LocalConversationStore.ts");
    const { conversationGatewayCostTotal, summarizeAssistantGatewayCost, toChatMessages } = load(root + "features/chat/messages/toChatMessages.ts", { "aihappey-types": { SYSTEM_ROLE: "system" } });
    const previousWindow = globalThis.window, previousStorage = globalThis.localStorage;
    const storage = new Map();
    globalThis.window = {};
    globalThis.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) };
    try {
        const local = costs.createToolGatewayCostCollector();
        local.recordResponse({ metadata: { gateway: { cost: 0.1 } } });
        const message = { id: "assistant", role: "assistant", metadata: { providerMetadata: { gateway: { cost: 0.5 } } }, parts: [
            { type: "text", text: "Before" },
            { type: "tool-search_resources", toolCallId: "local", state: "output-available", input: {}, output: local.withCost({ content: [] }) },
            { type: "text", text: "Between" },
            { type: "tool-research", toolCallId: "mcp", state: "output-available", input: {}, output: { content: [], _meta: { gateway: { cost: 0.2 } } } },
            { type: "text", text: "After" },
        ] };
        const store = new LocalConversationStore();
        const conv = await store.create("Costs");
        await store.addMessage(conv.id, { ...message, parts: [] });
        await store.updateMessage(conv.id, message.id, message);
        const saved = await new LocalConversationStore().get(conv.id);
        assert.deepEqual(saved.messages[0], message);
        assert.ok(Math.abs(conversationGatewayCostTotal(saved.messages) - 0.8) < 1e-12);
        assert.equal(summarizeAssistantGatewayCost(saved.messages[0]).count, 3);
        assert.ok(toChatMessages(saved.messages).length > 1); // Display splitting must not inflate the raw-message total.
        assert.equal(conversationGatewayCostTotal([{ role: "assistant", parts: [], metadata: { gateway: { cost: 1 } } }]), undefined);
        assert.equal(conversationGatewayCostTotal([{ role: "assistant", parts: [], metadata: { gateway: { cost: 0 } } }, { role: "assistant", parts: [], metadata: { gateway: { cost: 0 } } }]), 0);
        assert.equal(conversationGatewayCostTotal([{ role: "assistant", parts: [message.parts[1], message.parts[3]] }]), 0.1 + 0.2);
        assert.equal(conversationGatewayCostTotal([{ role: "assistant", parts: [{ output: "unpriced" }] }, { role: "user", metadata: { gateway: { cost: 99 } }, parts: [] }]), undefined);
    } finally { globalThis.window = previousWindow; globalThis.localStorage = previousStorage; }
});
