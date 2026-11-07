const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const { DefaultChatTransport } = require("ai");
const { load } = require("./credential-test-loader.cjs");

const base = "packages/aihappey-core/src/features/chat/engine/";
const state = {
    ...load("packages/aihappey-state/src/slices/chatEndpoint.ts"),
    ...load("packages/aihappey-state/src/slices/providerHeaders.ts"),
};
const mocks = {
    "aihappey-state": state,
    "aihappey-ai": { DefaultChatTransport },
    "aihappey-components": { canonicalizeAnthropicTools: value => value },
};
const { isGenericChatEndpoint, GenericChatEndpointTransport } = load(base + "genericChatEndpoint.ts", mocks);
const { buildGenericChatEndpointBody } = load(base + "genericEndpointMappers/index.ts", mocks);
const { resolveEndpointProfileRequestProviderHeaders } = load(base + "endpointProfiles.ts", mocks);
const { createChatRouteHeaders } = load(base + "chatRouteHeaders.ts");
const source = ts.createSourceFile(base + "VercelChatInner.tsx",
    fs.readFileSync(base + "VercelChatInner.tsx", "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function evaluate(expression, bindings) {
    const code = ts.transpileModule(`module.exports = ${expression};`, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function(...Object.keys(bindings), "module", code)(...Object.values(bindings), module);
    return module.exports;
}

// Execute the production callbacks, not a duplicate of the header merge condition.
function engineCallback(name, bindings = {}) {
    let expression;
    function visit(node) {
        if (ts.isPropertyAssignment(node) && node.name.getText(source) === name) expression = node.initializer.getText(source);
        if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) expression = node.initializer.arguments[0].getText(source);
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.ok(expression, `Missing engine callback ${name}`);
    return evaluate(expression, bindings);
}

const getGatewayProviderHeaders = engineCallback("getGatewayProviderHeaders");
const { useAuthFetch } = (() => {
    const code = ts.transpileModule(fs.readFileSync(base + "useAuthFetch.ts", "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => ({
        react: { useMemo: factory => factory() },
        "../../provider-credentials/scopedRequest": { createCredentialScopedFetch: fetcher => fetcher },
        "./apiDebug": { setApiDebugHeader() {} },
    })[id], module, module.exports);
    return module.exports;
})();

const providers = {
    anthropic: { name: "Anthropic" }, openai: { name: "OpenAI" }, openrouter: { name: "OpenRouter" },
};
const credentials = { "X-Anthropic-Key": "anthropic-key", "X-OpenAI-Key": "openai-key", "X-OpenRouter-Key": "openrouter-key" };
const settings = () => ({
    anthropic: { "anthropic-beta": "advisor-tool-2026-03-01,context-management-2025-06-27", "X-Trace": "anthropic" },
    openai: { "OpenAI-Beta": "responses=test", "X-Trace": "openai" },
    openrouter: { "HTTP-Referer": "https://chat.test", "X-Title": "Chat", "X-Trace": "openrouter" },
});
const user = id => ({ id, role: "user", parts: [{ type: "text", text: "hello" }] });
const lifecycle = [
    ["initial", [user("u1")], "submit-message"],
    ["follow-up", [user("u1"), { id: "a1", role: "assistant", parts: [{ type: "text", text: "hi" }] }, user("u2")], "submit-message"],
    ["regeneration", [user("u1")], "regenerate-message"],
    ["tool continuation", [user("u1"), { id: "a1", role: "assistant", parts: [{
        type: "tool-lookup", toolCallId: "call1", state: "output-available", input: { query: "hello" }, output: { ok: true },
    }] }], "submit-message"],
];

function prepare({ endpoint, provider, providerHeaders, direct = false, chatMode = "chat" }) {
    const baseBody = {
        model: direct ? "model" : `${provider}/model`,
        providerHeaders,
        providerMetadata: { [provider]: { metadata: { tag: "keep" } } },
        ...(direct ? { providerRequestConfigProviderKey: provider } : {}),
        tools: [{ name: "lookup", inputSchema: { type: "object" } }], toolChoice: "auto", maxOutputTokens: 1024,
    };
    return engineCallback("prepareSendMessagesRequest", {
        baseBody, chatMode, requestEndpoint: endpoint, isProviderEndpointProfile: direct,
        requestEndpointProfile: direct ? { providerKey: provider } : undefined, model: `${provider}/model`,
        isGenericChatEndpoint, buildGenericChatEndpointBody, getGatewayProviderHeaders,
        applyOverrides: messages => messages, mapToolOutputContentForRequest: messages => messages,
        agentRequestMessages: messages => messages,
        toolOutputContentSettings: {}, conversationId: "conversation", useToolNamespaces: false, hasSourceNamespaces: false,
        shapeToolsForRequest: tools => tools, deferClientToolSearchCandidates: tools => tools,
        toolRequestConfig: {}, maxToolCalls: undefined, stopTools: [], shouldForceToolChoiceNone: () => false,
        api: `https://${direct ? "provider" : "gateway"}.test${endpoint}`,
        config: { agentScopes: ["agent-scope"] }, customHeaders: {}, selectedAgentNames: [], agents: [], remoteAgentModels: [],
        workflowType: undefined, magenticManagerAgentKey: undefined, abortRef: { current: undefined },
        prepareSelectedAgentRequest: async () => ({ entries: [] }),
        agentContinuationRef: { current: { submitted() {} } }, agentToolCatalogRef: { current: { tools: [] } },
        managedAgentMcpCatalog: { tools: [] }, agentToolSignalRef: {}, agentToolMessageRef: {}, agentToolRunActiveRef: {},
        managedAgentStopTools: () => [], headers: {}, agentApiKeyHeaders: {},
    });
}

function response(endpoint) {
    const events = endpoint === "/api/chat" ? [{ type: "start", messageId: "reply" }, { type: "finish" }]
        : endpoint === "/v1/messages" ? [{ type: "message_start", message: { id: "reply", model: "model", usage: {} } },
            { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: {} }, { type: "message_stop" }]
        : endpoint === "/v1/responses" ? [{ type: "response.completed", response: { id: "reply", model: "model", output: [], usage: {} } }]
        : [];
    return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join("")
        + (endpoint === "/v1/chat/completions" ? "data: [DONE]\n\n" : ""), { headers: { "Content-Type": "text/event-stream" } });
}

function harness({ endpoint, provider = "anthropic", allHeaders = settings(), authenticated = false, direct = false }) {
    const selected = resolveEndpointProfileRequestProviderHeaders({
        providerHeaders: allHeaders, selectedModelProviderKey: provider,
        endpointProfile: direct ? { kind: "provider", providerKey: provider } : { kind: "default" },
    });
    const requests = [];
    const routeHeaders = createChatRouteHeaders({
        configuredHeaders: { Authorization: "gateway-config", "X-Tenant": "gateway-only" },
        customHeaders: credentials, modelId: `${provider}/model`, endpoint, providers, authenticated,
        ...(direct ? { directProviderKey: provider, providerHeaders: selected?.[provider] } : {}),
    });
    const fetcher = useAuthFetch({ chatMode: "chat", customHeaders: routeHeaders,
        ...(authenticated ? { getAccessToken: async () => "entra-token" } : {}),
        ...(direct ? { directBaseUrl: "https://provider.test" } : {}),
        customFetch: async (url, init) => {
            requests.push({ url, headers: new Headers(init.headers), body: JSON.parse(init.body), credentials: init.credentials });
            return response(endpoint);
        },
    });
    const options = { api: `https://${direct ? "provider" : "gateway"}.test${endpoint}`, fetch: fetcher,
        prepareSendMessagesRequest: prepare({ endpoint, provider, providerHeaders: selected, direct }) };
    const transport = isGenericChatEndpoint(endpoint)
        ? new GenericChatEndpointTransport(endpoint, direct ? provider : undefined, providers, options)
        : new DefaultChatTransport(options);
    return { requests, async send(messages = [user("u1")], trigger = "submit-message", extra = {}) {
        const stream = await transport.sendMessages({ chatId: "conversation", messages, trigger, ...extra });
        for await (const chunk of stream) assert.notEqual(chunk.type, "error", chunk.errorText);
        return requests.at(-1);
    } };
}

for (const endpoint of ["/api/chat", "/v1/messages", "/v1/responses", "/v1/chat/completions"]) {
    for (const provider of Object.keys(providers)) for (const authenticated of [false, true]) {
        test(`${endpoint}: ${provider} headers survive every request lifecycle (${authenticated ? "Entra" : "BYOK"})`, async () => {
            const allHeaders = settings(), before = structuredClone(allHeaders);
            const h = harness({ endpoint, provider, allHeaders, authenticated });
            for (const [name, messages, trigger] of lifecycle) {
                const request = await h.send(messages, trigger);
                for (const [key, value] of Object.entries(before[provider])) assert.equal(request.headers.get(key), value, `${name}: ${key}`);
                for (const other of Object.keys(providers).filter(key => key !== provider)) {
                    for (const key of Object.keys(before[other]).filter(key => !(key in before[provider])))
                        assert.equal(request.headers.has(key), false, `${name}: leaked ${other} header ${key}`);
                }
                assert.equal(request.headers.get("Authorization"), authenticated ? "Bearer entra-token" : "gateway-config");
                assert.equal(request.headers.get("X-Tenant"), "gateway-only");
                for (const [key, value] of Object.entries(credentials))
                    assert.equal(request.headers.get(key), !authenticated && key.toLowerCase() === `x-${provider}-key` ? value : null);
                if (endpoint !== "/api/chat") {
                    assert.equal(request.headers.get("Accept"), "text/event-stream");
                    assert.equal(request.headers.get("Content-Type"), "application/json");
                    for (const key of ["providerHeaders", "providerRequestHeaders", ...Object.keys(before[provider])])
                        assert.equal(Object.hasOwn(request.body, key), false, `headers must not enter native body: ${key}`);
                    assert.deepEqual(request.body.metadata, { tag: "keep" });
                    const withoutHeaders = await prepare({ endpoint, provider })({ messages, trigger });
                    assert.deepEqual(request.body, JSON.parse(JSON.stringify(withoutHeaders.body)), "header settings must not change native payloads");
                } else assert.deepEqual(request.body.providerHeaders, { [provider]: before[provider] });
            }
            assert.deepEqual(allHeaders, before, "dispatch must not mutate settings");
        });
    }

    test(`${endpoint}: beta disabled, absent, and empty settings do not create headers`, async () => {
        for (const allHeaders of [{}, { openai: settings().openai }, { anthropic: {} },
            { anthropic: { "anthropic-beta": "", "X-Empty": "  ", "X-Null": null } }]) {
            const h = harness({ endpoint, allHeaders });
            const request = await h.send();
            for (const key of ["anthropic-beta", "OpenAI-Beta", "X-Empty", "X-Null"]) assert.equal(request.headers.has(key), false);
        }
    });

    test(`${endpoint}: Entra authorization remains authoritative over provider and per-call headers`, async () => {
        const h = harness({ endpoint, authenticated: true, allHeaders: {
            anthropic: { ...settings().anthropic, Authorization: "provider-setting" },
        } });
        const request = await h.send(undefined, undefined, { headers: { authorization: "per-call" } });
        assert.equal(request.headers.get("Authorization"), "Bearer entra-token");
        assert.equal(request.headers.get("anthropic-beta"), settings().anthropic["anthropic-beta"]);
    });

    test(`${endpoint}: provider headers keep existing case-insensitive precedence and per-call body overrides`, async () => {
        const h = harness({ endpoint });
        const request = await h.send(undefined, undefined, {
            headers: { "ANTHROPIC-BETA": "per-call", "x-trace": "per-call", "X-Request-Only": "keep" },
            body: { providerHeaders: { anthropic: { "Anthropic-Beta": "override-beta", "X-Trace": "override-trace" } } },
        });
        assert.equal(request.headers.get("anthropic-beta"), "override-beta");
        assert.equal(request.headers.get("x-trace"), "override-trace");
        assert.equal(request.headers.get("X-Request-Only"), "keep");
        assert.equal([...request.headers.keys()].filter(key => key === "anthropic-beta").length, 1);
        const fallback = await h.send(undefined, undefined, { body: { providerHeaders: undefined } });
        assert.equal(fallback.headers.get("anthropic-beta"), settings().anthropic["anthropic-beta"]);
        const cleared = await h.send(undefined, undefined, { body: { providerHeaders: {} } });
        assert.equal(cleared.headers.has("anthropic-beta"), false);
    });

    test(`${endpoint}: a pinned transport retains selected-provider headers for tool continuation`, async () => {
        const allHeaders = settings();
        const h = harness({ endpoint, allHeaders });
        await h.send();
        allHeaders.anthropic = { "anthropic-beta": "changed-after-send" };
        const continued = await h.send(lifecycle[3][1]);
        assert.equal(continued.headers.get("anthropic-beta"), settings().anthropic["anthropic-beta"]);
        const nextRun = harness({ endpoint, allHeaders });
        assert.equal((await nextRun.send()).headers.get("anthropic-beta"), "changed-after-send");
        const toggledOff = harness({ endpoint, allHeaders: {} });
        assert.equal((await toggledOff.send()).headers.has("anthropic-beta"), false);
    });
}

for (const [provider, endpoint] of [["anthropic", "/v1/messages"], ["openai", "/v1/responses"],
    ["openai", "/v1/chat/completions"], ["openrouter", "/v1/chat/completions"]]) {
    test(`direct ${provider} ${endpoint}: native credentials and provider headers remain isolated`, async () => {
        const h = harness({ endpoint, provider, direct: true });
        for (const [, messages, trigger] of lifecycle) {
            const request = await h.send(messages, trigger, { credentials: "include", headers: {
                Authorization: "gateway-override", "X-OpenAI-Key": "wrong-key", "x-api-key": "wrong-key",
            } });
            for (const [key, value] of Object.entries(settings()[provider])) assert.equal(request.headers.get(key), value);
            assert.equal(request.headers.get("X-Tenant"), null);
            for (const key of Object.keys(credentials)) assert.equal(request.headers.get(key), null);
            if (provider === "anthropic") {
                assert.equal(request.headers.get("x-api-key"), "anthropic-key");
                assert.equal(request.headers.get("Authorization"), null);
                assert.equal(request.headers.get("anthropic-version"), "2023-06-01");
            } else assert.equal(request.headers.get("Authorization"), `Bearer ${provider}-key`);
            assert.equal(request.credentials, "omit");
        }
        const overridden = await h.send(undefined, undefined, { body: { providerHeaders: {
            unrelated: { "X-Unrelated-Provider": "must-not-leak" }, [provider]: { "X-Trace": "raw-body-override" },
        } } });
        assert.equal(overridden.headers.get("X-Unrelated-Provider"), null);
        assert.equal(overridden.headers.get("X-Trace"), provider, "direct requests must keep their dedicated header construction");
    });
}

test("agent header collection remains unchanged: single-model headers merge; multi-model headers stay in payload", () => {
    const body = { providerHeaders: { anthropic: { "anthropic-beta": "chat" } }, agents: [
        { model: { id: "openai/model", providerHeaders: { "OpenAI-Beta": "flat" } } },
        { model: { id: "anthropic/model", providerHeaders: { anthropic: { "anthropic-beta": "agent" } } } },
        { models: [{ id: "openai/model", providerHeaders: { "X-Multi-Model": "must-not-merge" } }],
            model: { id: "openai/model", providerHeaders: { "X-Multi-Model": "must-not-merge" } } },
    ] };
    assert.deepEqual(getGatewayProviderHeaders(body), { "anthropic-beta": "agent", "OpenAI-Beta": "flat" });
});

for (const endpoint of ["/api/chat", "/v1/messages", "/v1/responses", "/v1/chat/completions"]) {
    test(`${endpoint}: managed-agent request preparation keeps its existing header behavior`, async () => {
        const result = await prepare({ endpoint, provider: "anthropic", providerHeaders: { anthropic: settings().anthropic }, chatMode: "agent" })({ messages: [user("u1")] });
        assert.equal(result.headers.get("anthropic-beta"), endpoint === "/api/chat" ? settings().anthropic["anthropic-beta"] : null);
    });
}
