const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { load } = require("./credential-test-loader.cjs");

const features = "packages/aihappey-core/src/features/";
const { buildAgentResponseSelection } = load(features + "agents/agentResponseRequest.ts");
const { buildSelectedAgentRequest } = load(features + "agents/agentSelection.ts");
const { createResponsesProvider } = load("packages/aihappey-ai/src/createResponsesProvider.ts");
const { wrapGenericChatFetch } = load(features + "chat/engine/genericChatEndpoint.ts", {
    "aihappey-ai": { DefaultChatTransport: class {} },
    "aihappey-components": { canonicalizeAnthropicTools: value => value },
});
const local = {
    name: "Researcher", description: "Research", instructions: "Cite sources.",
    models: [{ id: "openai/model" }],
    tools: [{ type: "function", name: "search" }],
    mcpServers: { search: { type: "http", url: "https://search.example/mcp" } },
};
const remoteDefinition = { ...local, name: "Reviewer", models: [{ id: "anthropic/model" }] };
const catalog = [{ id: "reviewer", source: "remote", agent: remoteDefinition }];
const metadata = { label: "Application data", agents: [remoteDefinition], workflowType: "not-routing" };

function scopedFetch(state) {
    return load(features + "provider-credentials/scopedRequest.ts", {
        "aihappey-state": { store: { getState: () => state } },
    }).createCredentialScopedFetch;
}

function loadRuntime(mocks) {
    const filename = path.resolve(__dirname, "..", features + "tools/toolcalls/useLocalAgentsToolCall.ts");
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => {
        assert.ok(id in mocks, `Unmocked import: ${id}`);
        return mocks[id];
    }, module, module.exports);
    return module.exports;
}

for (const background of [false, true]) {
    for (const kind of ["local", "remote"]) test(`agent-run tool sends ${kind} selection at root (${background ? "background" : "foreground"})`, async () => {
        const state = {
            agents: [local], remoteAgentModels: catalog, customProviders: {},
            customHeaders: { "X-OpenAI-Key": "openai-secret", "X-Anthropic-Key": "anthropic-secret" },
        };
        const sent = [];
        const config = {
            baseUrl: "https://gateway.example", agentEndpoint: "https://agents.example",
            endpoints: { responses: "/v1/responses" },
            getAgentAccessToken: async () => "agent-token",
            getAccessToken: async () => { throw new Error("Wrong authentication"); },
            fetch: async (url, init) => {
                sent.push({ url, body: JSON.parse(init.body), headers: new Headers(init.headers) });
                return Response.json({ id: "response-1", status: background ? "queued" : "completed" });
            },
        };
        const { useLocalAgentsRuntime } = loadRuntime({
            react: { useCallback: callback => callback },
            "aihappey-state": { useAppStore: selector => selector(state) },
            "aihappey-ai": { createResponsesProvider },
            "../../provider-credentials/scopedRequest": { createCredentialScopedFetch: scopedFetch(state) },
            "../../chat/context/ChatContext": { useChatContext: () => ({ config }) },
            "../../agents/agentResponseRequest": { buildAgentResponseSelection },
        });
        const result = await useLocalAgentsRuntime().handle({
            toolName: "local_agents_run",
            input: { agentId: kind === "local" ? local.name : "reviewer", prompt: "  Research this  ", background },
        });
        assert.equal(result.isError, false);
        assert.equal(sent.length, 1);
        assert.equal(sent[0].url, "https://agents.example/v1/responses");
        assert.deepEqual(sent[0].body, {
            input: [{ role: "user", content: [{ type: "input_text", text: "Research this" }] }],
            background, store: background, stream: false,
            ...(kind === "local" ? { agents: [local] } : { model: "reviewer" }),
        });
        assert.equal(sent[0].headers.get("Authorization"), "Bearer agent-token");
        assert.equal(sent[0].headers.get("X-OpenAI-Key"), kind === "local" ? "openai-secret" : null);
        assert.equal(sent[0].headers.get("X-Anthropic-Key"), kind === "remote" ? "anthropic-secret" : null);
        assert.equal(result.structuredContent.id, "response-1");
    });
}

test("mixed magentic selection preserves hydrated definitions and manager order at the root", () => {
    const selection = buildSelectedAgentRequest(["local:Researcher", "remote:reviewer"], [local], catalog, {
        workflowType: "magentic", managerAgentKey: "remote:reviewer",
    });
    assert.deepEqual(buildAgentResponseSelection(selection), { agents: [remoteDefinition, local] });
    assert.deepEqual(buildAgentResponseSelection({ requestAgents: [], models: [] }), {});
});

test("Responses client serializes singular and plural root selectors without interpreting application metadata", async () => {
    const state = { remoteAgentModels: catalog, customProviders: {} };
    const sent = [];
    const fetcher = scopedFetch(state)(async (url, init) => {
        sent.push({ url, body: init.body ? JSON.parse(init.body) : undefined, headers: new Headers(init.headers) });
        return Response.json({ id: "response-1" });
    });
    const client = createResponsesProvider({
        baseUrl: "https://agents.example/v1/responses",
        headers: { Authorization: "Bearer agent-token", "X-OpenAI-Key": "openai-secret", "X-Anthropic-Key": "anthropic-secret" },
        fetch: fetcher,
    });
    for (const selector of [{ agent: local }, { agents: [local] }]) {
        const request = { ...selector, input: "Research this", background: false, metadata };
        const snapshot = structuredClone(request);
        await client.create(request);
        assert.deepEqual(request, snapshot, "request must not be mutated");
        assert.deepEqual(sent.at(-1).body, { ...request, store: false, stream: false });
        assert.equal(sent.at(-1).headers.get("X-OpenAI-Key"), "openai-secret");
        assert.equal(sent.at(-1).headers.get("X-Anthropic-Key"), null, "metadata cannot select credentials");
    }
    await client.create({ input: "No root selector", metadata });
    assert.equal(sent.at(-1).body.agent, undefined, "do not lift legacy metadata into routing fields");
    assert.equal(sent.at(-1).body.agents, undefined);
    assert.equal(sent.at(-1).headers.get("X-Anthropic-Key"), null);
    assert.equal(sent.at(-1).headers.get("X-OpenAI-Key"), null);
    await client.retrieve("response/1");
    assert.equal(sent.at(-1).url, "https://agents.example/v1/responses/response%2F1");
    assert.equal(sent.at(-1).headers.get("X-OpenAI-Key"), null);
});

async function mappedRequest(body, preserveAgentSelection) {
    let sent;
    const upstream = Response.json({ error: "capture only" }, { status: 400 });
    const fetcher = wrapGenericChatFetch({
        endpoint: "/v1/responses", preserveAgentSelection,
        fetcher: async (_, init) => { sent = JSON.parse(init.body); return upstream; },
    });
    const snapshot = structuredClone(body);
    assert.equal(await fetcher("https://example.test/v1/responses", {
        method: "POST", body: JSON.stringify(body),
    }), upstream);
    assert.deepEqual(body, snapshot, "mapping must not mutate source history or selection");
    return sent;
}

const uiMessages = [{ id: "message-1", role: "user", parts: [{ type: "text", text: "Research this" }] }];

for (const selector of [{ agent: local }, { agents: [local] }, { model: "reviewer" }, { models: ["reviewer"] }, {
    agents: [local], models: ["reviewer"],
}]) test(`interactive agent Responses preserves root selection: ${Object.keys(selector).join("+")}`, async () => {
    const body = await mappedRequest({
        ...selector, messages: uiMessages, workflowType: "groupchat",
        workflowMetadata: { groupchat: { maximumIterationCount: 7 } }, metadata,
        tools: [{ name: "lookup", inputSchema: { type: "object", properties: {} } }],
    }, true);
    for (const [key, value] of Object.entries(selector)) assert.deepEqual(body[key], value);
    assert.equal(body.workflowType, "groupchat");
    assert.deepEqual(body.workflowMetadata, { groupchat: { maximumIterationCount: 7 } });
    assert.deepEqual(body.metadata, metadata);
    assert.equal(body.stream, true);
    assert.equal(body.store, false);
    assert.equal(body.input[0].content[0].text, "Research this");
    assert.equal(body.tools[0].type, "function");
    assert.equal(body.tools[0].name, "lookup");
    assert.equal(body.messages, undefined);
});

test("interactive Responses accepts root workflow aliases and gives canonical fields precedence", async () => {
    const aliases = { workflow_type: "decisions", workflow_metadata: { decisions: { model: "openai/router" } } };
    let body = await mappedRequest({ agents: [local], messages: uiMessages, ...aliases }, true);
    assert.equal(body.workflowType, "decisions");
    assert.deepEqual(body.workflowMetadata, aliases.workflow_metadata);
    body = await mappedRequest({ agents: [local], messages: uiMessages, ...aliases,
        workflowType: "handoff", workflowMetadata: { handoff: { handoffs: [] } },
    }, true);
    assert.equal(body.workflowType, "handoff");
    assert.deepEqual(body.workflowMetadata, { handoff: { handoffs: [] } });
    assert.equal(body.workflow_type, undefined);
    assert.equal(body.workflow_metadata, undefined);
});

test("direct-provider Responses keeps native settings and application metadata but excludes backend routing", async () => {
    const body = await mappedRequest({
        model: "openai/model", messages: uiMessages, agents: [local], agent: local, models: ["reviewer"],
        workflowType: "groupchat", workflowMetadata: { groupchat: { maximumIterationCount: 7 } },
        workflow_type: "handoff", workflow_metadata: { handoff: {} },
        providerRequestConfigProviderKey: "openai",
        providerRequestConfig: { metadata: { label: "Provider application data" }, reasoning: { effort: "low" } },
    }, false);
    for (const key of ["agent", "agents", "models", "workflowType", "workflowMetadata", "workflow_type", "workflow_metadata"]) {
        assert.equal(Object.hasOwn(body, key), false, key);
    }
    assert.equal(body.model, "openai/model");
    assert.deepEqual(body.reasoning, { effort: "low" });
    assert.deepEqual(body.metadata, { label: "Provider application data" });
});

test("interactive Responses never promotes application metadata to execution selectors", async () => {
    const body = await mappedRequest({ messages: uiMessages, metadata }, true);
    assert.deepEqual(body.metadata, metadata);
    assert.equal(body.agent, undefined);
    assert.equal(body.agents, undefined);
    assert.equal(body.model, undefined);
    assert.equal(body.models, undefined);
    assert.equal(body.workflowType, undefined);
});
