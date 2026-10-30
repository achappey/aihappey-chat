const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");

function load(filename, mocks = {}) {
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => {
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports);
    return module.exports;
}

const root = "packages/aihappey-core/src/";
const agentModels = load("packages/aihappey-types/src/agentModels.ts");
const decisions = { ...load("packages/aihappey-decisions/src/types.ts"), ...load("packages/aihappey-decisions/src/validation.ts") };
const provider = load("packages/aihappey-ai/src/createDecisionProvider.ts");
const search = load(root + "runtime/chat-app/searchDecisionCall.ts", {
    "aihappey-ai": { ...provider, defaultEndpoints: { decisions: "/api/decisions" } },
    "aihappey-decisions": decisions, "aihappey-types": agentModels,
    "../../features/provider-credentials/scopedRequest": require("./credential-test-loader.cjs").scoped,
});
const toolCatalog = load(root + "features/tools/clientToolSearch.ts");
const resourceCatalog = load(root + "features/tools/clientResourceSearch.ts");
const model = { id: "openai/router", type: "decision", name: "Router" };
const tools = Array.from({ length: 12 }, (_, i) => ({ name: `tool_${i}`, description: `Capability ${i}`, inputSchema: { type: "object" } }));

function rankedResponse(body) {
    return { answers: Object.fromEntries(Object.entries(body.questions).map(([id, question]) => {
        const keys = Object.keys(question.criteria), sum = keys.length * (keys.length + 1) / 2;
        return [id, { type: "choice", choice: keys.at(-1), probabilities: Object.fromEntries(keys.map((key, i) => [key, (i + 1) / sum])) }];
    })), warnings: [] };
}

function harness(options = {}) {
    const requests = [], llm = [];
    const state = {
        models: [model, { id: "anthropic/chat", type: "language" }], selectedModel: "anthropic/chat",
        userPreferredDecisionModel: "unrelated/default", gatewayEnabled: true,
        agents: ["ToolSearchAgent", "ResourceSearchAgent"].map(name => ({ name, instructions: "Find useful entries", model: { id: model.id } })),
        customHeaders: { "X-OpenAI-Key": "router-key", "X-Anthropic-Key": "do-not-send", "X-Tenant": "tenant" },
        sideInferenceAgentNames: { toolSearchAgent: "ToolSearchAgent", resourceSearchAgent: "ResourceSearchAgent" },
        ...options.state,
    };
    const mocks = {
        react: { useMemo: factory => factory(), useCallback: callback => callback },
        "aihappey-state": {
            store: { getState: () => state }, useAppStore: select => select(state),
            DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: { toolSearchAgent: "ToolSearchAgent", resourceSearchAgent: "ResourceSearchAgent" },
        },
        "../../../runtime/chat-app/searchDecisionCall": search,
        "../../../runtime/chat-app/sideInferenceAgentCall": { async invokeSideInferenceAgent(args) {
            llm.push(args);
            return args.feature === "toolSearch" ? '{"selectedToolNames":["tool_0"]}'
                : '{"selectedResourceUris":["mail://0"],"selectedResourceTemplateUriTemplates":[]}';
        } },
    };
    const args = {
        api: "https://gateway/", tools: options.tools ?? tools, getAccessToken: async () => "access-token",
        customFetch: async (url, init) => {
            const body = JSON.parse(init.body);
            requests.push({ url, init, body });
            if (options.onRequest) await options.onRequest(body, state, init);
            return new Response(JSON.stringify(options.response ? options.response(body) : rankedResponse(body)), {
                status: options.status ?? 200, headers: { "content-type": "application/json" },
            });
        },
        mcpServers: { mail: { config: { url: "https://mcp/mail" } } },
        mcpServerContent: { mail: options.content ?? { instructions: "Mail server guidance", resources: [{ uri: "mail://0", name: "Inbox" }] } },
    };
    const toolRuntime = load(root + "features/tools/toolcalls/useClientToolSearchToolCall.ts", { ...mocks, "../clientToolSearch": toolCatalog }).useClientToolSearchRuntime(args);
    const resourceRuntime = load(root + "features/tools/toolcalls/useClientResourceSearchToolCall.ts", { ...mocks, "../clientResourceSearch": resourceCatalog }).useClientResourceSearchRuntime(args);
    return { state, requests, llm, args, toolRuntime, resourceRuntime };
}

test("tool helper decision uses choice probabilities, original schemas and the existing ten-tool cap", async () => {
    const h = harness();
    h.state.agents[0].models = [{ id: model.id, providerMetadata: { effort: "low" }, providerHeaders: { "X-Helper": "selected" } }];
    h.state.agents[0].model = { id: "anthropic/chat" }; // Collection takes precedence over legacy configuration.
    const result = await h.toolRuntime.handle({ input: { goal: "Find capabilities" } });
    assert.deepEqual(result.structuredContent.selectedTools.map(tool => tool.name), tools.slice(2).reverse().map(tool => tool.name));
    assert.deepEqual(result.structuredContent.selectedTools[0].inputSchema, tools[11].inputSchema);
    assert.equal(h.llm.length, 0);
    const { body, init, url } = h.requests[0];
    assert.equal(h.requests.length, 1);
    assert.equal(url, "https://gateway/api/decisions");
    assert.equal(body.model, model.id);
    assert.deepEqual(body.state, { goal: "Find capabilities" });
    assert.equal(body.questions.tools.type, "choice");
    assert.equal(Object.keys(body.questions.tools.criteria).length, 12);
    assert.match(body.questions.tools.instructions, /Find useful entries/);
    assert.deepEqual(body.providerOptions, { openai: { effort: "low" } });
    const headers = new Headers(init.headers);
    assert.equal(headers.get("authorization"), "Bearer access-token");
    assert.equal(headers.get("x-openai-key"), "router-key");
    assert.equal(headers.get("x-anthropic-key"), null);
    assert.equal(headers.get("x-helper"), "selected");
    assert.doesNotMatch(JSON.stringify(body), /router-key|do-not-send|access-token/);
});

test("resources and templates are separate choices in one request, scoped, capped and shape-preserving", async () => {
    const resources = Array.from({ length: 22 }, (_, i) => ({ uri: `mail://${i}`, name: `Mail ${i}`, _meta: { keep: i } }));
    const resourceTemplates = Array.from({ length: 22 }, (_, i) => ({ uriTemplate: `mail://${i}`, name: `Template ${i}`, mimeType: "text/plain" }));
    const h = harness({ content: { instructions: "Server-specific guidance", resources: [...resources, { uri: "secret://hidden", annotations: { audience: ["user"] } }], resourceTemplates } });
    const result = await h.resourceRuntime.handle({ input: { serverUrl: "https://mcp/mail", query: "Mail" } });
    assert.equal(h.requests.length, 1);
    assert.equal(h.llm.length, 0);
    assert.deepEqual(Object.keys(h.requests[0].body.questions), ["resources", "resourceTemplates"]);
    assert.equal(h.requests[0].body.state.mcpServerInstructions, "Server-specific guidance");
    assert.doesNotMatch(JSON.stringify(h.requests[0].body), /secret:\/\/hidden/);
    assert.deepEqual(result.structuredContent.resources, resources.slice(2).reverse());
    assert.deepEqual(result.structuredContent.resourceTemplates, resourceTemplates.slice(2).reverse());
    assert.equal(result.structuredContent.resources[0], resources[21]);
    assert.equal(result.structuredContent.resourceTemplates[0], resourceTemplates[21]);
});

test("empty resource categories are omitted and server validation remains local", async () => {
    const h = harness({ content: { resourceTemplates: [{ uriTemplate: "mail://{id}", name: "Mail" }] } });
    const result = await h.resourceRuntime.handle({ input: { serverUrl: "https://mcp/mail", query: "Mail" } });
    assert.deepEqual(Object.keys(h.requests[0].body.questions), ["resourceTemplates"]);
    assert.deepEqual(result.structuredContent.resources, []);
    assert.equal(result.structuredContent.resourceTemplates.length, 1);
    await assert.rejects(h.resourceRuntime.handle({ input: { serverUrl: "https://other", query: "Mail" } }), /Invalid url/);
    assert.equal(h.requests.length, 1);
});

test("language helper or missing helper retains the LLM path regardless of default decisions", async () => {
    for (const agents of [[], [{ name: "ToolSearchAgent", model: { id: "anthropic/chat" } }, { name: "ResourceSearchAgent", model: { id: "anthropic/chat" } }]]) {
        const h = harness({ state: { agents } });
        assert.equal((await h.toolRuntime.handle({ input: { goal: "tools" } })).structuredContent.selectedTools[0].name, "tool_0");
        assert.equal((await h.resourceRuntime.handle({ input: { serverUrl: "https://mcp/mail", query: "Mail" } })).structuredContent.resources[0].uri, "mail://0");
        assert.equal(h.requests.length, 0);
        assert.equal(h.llm.length, 2);
    }
});

test("catalog model type overrides saved hints and chat uses only the helper's primary model", async () => {
    const h = harness();
    h.state.agents[0].models = [{ id: "anthropic/chat", type: "decision" }, { id: model.id }];
    await h.toolRuntime.handle({ input: { goal: "tools" } });
    assert.equal(h.requests.length, 0);
    assert.equal(h.llm.length, 1);
    await h.resourceRuntime.handle({ input: { serverUrl: "https://mcp/mail", query: "Mail" } });
    assert.equal(h.requests.length, 1); // Independently configured resource helper still uses decisions.
});

test("explicit None and empty searches do not invoke either inference path", async () => {
    const h = harness({ state: { sideInferenceAgentNames: { toolSearchAgent: "", resourceSearchAgent: "" } } });
    assert.deepEqual((await h.toolRuntime.handle({ input: { goal: "tools" } })).structuredContent.selectedTools, []);
    assert.deepEqual((await h.resourceRuntime.handle({ input: {} })).structuredContent.resources, []);
    const empty = harness({ tools: [], content: {} });
    await empty.toolRuntime.handle({ input: { goal: "tools" } });
    await empty.resourceRuntime.handle({ input: { serverUrl: "https://mcp/mail", query: "Mail" } });
    assert.equal(h.requests.length + h.llm.length + empty.requests.length + empty.llm.length, 0);
});

const invalidAnswers = {
    refusal: { type: "refusal" },
    noProbabilities: { type: "choice", choice: "0" },
    incomplete: { type: "choice", choice: "0", probabilities: { 0: 1 } },
    unknownChoice: { type: "choice", choice: "outside", probabilities: { 0: 0.5, 1: 0.5 } },
    unknownProbability: { type: "choice", choice: "0", probabilities: { 0: 0.5, outside: 0.5 } },
    outOfRange: { type: "choice", choice: "0", probabilities: { 0: 2, 1: -1 } },
    notNormalized: { type: "choice", choice: "0", probabilities: { 0: 0.6, 1: 0.6 } },
    nonMaximal: { type: "choice", choice: "0", probabilities: { 0: 0.2, 1: 0.8 } },
    wrongType: { type: "boolean", probability: 0.9 },
};
for (const [name, answer] of Object.entries(invalidAnswers)) test(`unusable ${name} decisions return empty without an LLM retry`, async () => {
    const h = harness({ tools: tools.slice(0, 2), response: () => ({ answers: { tools: answer }, warnings: [] }) });
    assert.deepEqual((await h.toolRuntime.handle({ input: { goal: "tools" } })).structuredContent.selectedTools, []);
    assert.equal(h.requests.length, 1);
    assert.equal(h.llm.length, 0);
});

test("HTTP failure and disabled gateway never retry a selected decision helper through an LLM", async () => {
    for (const options of [{ status: 503 }, { state: { gatewayEnabled: false } }]) {
        const h = harness(options);
        assert.deepEqual((await h.toolRuntime.handle({ input: { goal: "tools" } })).structuredContent.selectedTools, []);
        assert.equal(h.llm.length, 0);
        assert.equal(h.requests.length, options.status ? 1 : 0);
    }
});

test("equal probabilities preserve catalog order and declared rounding is respected", async () => {
    const h = harness({ tools: tools.slice(0, 3), response: () => ({
        answers: { tools: { type: "choice", choice: "1", probabilities: { 2: 0.33, 1: 0.33, 0: 0.33 } } },
        rounding: { probabilityDecimals: 2 }, warnings: [],
    }) });
    assert.deepEqual((await h.toolRuntime.handle({ input: { goal: "tools" } })).structuredContent.selectedTools.map(tool => tool.name), tools.slice(0, 3).map(tool => tool.name));
});

test("decision cancellation propagates and late disabling discards the selection", async () => {
    const controller = new AbortController();
    controller.abort();
    const h = harness();
    await assert.rejects(h.toolRuntime.handle({ input: { goal: "tools" } }, controller.signal), { name: "AbortError" });
    assert.equal(h.requests.length, 0);
    const late = harness({ onRequest: (_body, state) => { state.sideInferenceAgentNames.toolSearchAgent = ""; } });
    assert.deepEqual((await late.toolRuntime.handle({ input: { goal: "tools" } })).structuredContent.selectedTools, []);
    const inflight = harness({ onRequest: (_body, _state, init) => {
        assert.equal(init.signal, inFlightController.signal);
        inFlightController.abort();
    } });
    const inFlightController = new AbortController();
    await assert.rejects(inflight.toolRuntime.handle({ input: { goal: "tools" } }, inFlightController.signal), { name: "AbortError" });
    assert.equal(inflight.llm.length, 0);
});
