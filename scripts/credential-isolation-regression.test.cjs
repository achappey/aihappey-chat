const assert = require("node:assert/strict");
const { test } = require("node:test");
const { load, auth } = require("./credential-test-loader.cjs");

const keys = {
    "X-OpenAI-Key": "openai-SECRET", "X-Anthropic-Key": "anthropic-SECRET",
    "X-Google-Key": "google-SECRET", "X-GoogleTranslate-Key": "translate-SECRET",
    "X-OpenAIHK-Key": "openaihk-SECRET", "X-Unknown-Key": "unknown-SECRET",
};
const snapshot = value => Object.fromEntries(new Headers(value).entries());
const credentialValues = value => Object.entries(snapshot(value)).filter(([key]) => /^x-.+-key$/.test(key)).map(([, value]) => value).sort();

test("exact case-insensitive ownership never selects overlapping providers or unknown keys", () => {
    for (const [model, expected] of [["openai/model", "openai-SECRET"], ["google/model", "google-SECRET"], ["anthropic/model", "anthropic-SECRET"]]) {
        assert.deepEqual(credentialValues(auth.scopeHeadersForModels(keys, model)), [expected]);
    }
    assert.deepEqual(credentialValues(auth.scopeHeadersForModels(keys, "unknown/model")), []);
    assert.deepEqual(credentialValues(auth.scopeHeadersForModels(keys, undefined)), []);
    assert.equal(auth.isProviderHeader("x-oPeNaI-key", "openai"), true);
    assert.equal(auth.isProviderHeader("X-OpenAIHK-Key", "openai"), false);
    const custom = { custom: { name: "My Custom Service" } };
    assert.deepEqual(auth.scopeHeadersForModels({ "X-My Custom Service-Key": "custom" }, "custom/model", custom), { "X-My Custom Service-Key": "custom" });
});

test("merged operation headers retain AzureAuth and endpoint/native authentication, not unrelated provider keys", async () => {
    let tokens = 0;
    const headers = await auth.buildOperationHeaders({
        headers: { ...keys, Authorization: "old", "X-Request-Id": "request" },
        getAccessToken: async () => { tokens++; return "entra-token"; },
    }, { "x-openai-key": "selected-override", "X-Api-Key": "endpoint-key", "x-goog-api-key": "native-google" }, "openai/model");
    assert.equal(tokens, 1);
    assert.equal(snapshot(headers).authorization, "Bearer entra-token");
    assert.equal(snapshot(headers)["x-openai-key"], "selected-override");
    assert.equal(snapshot(headers)["x-api-key"], "endpoint-key");
    assert.equal(snapshot(headers)["x-goog-api-key"], "native-google");
    assert.equal(snapshot(headers)["x-request-id"], "request");
    for (const key of ["anthropic", "google", "unknown", "openaihk"]) assert.equal(snapshot(headers)[`x-${key}-key`], undefined);
    await assert.rejects(auth.buildOperationHeaders({ getAccessToken: async () => { throw Error("token failure"); } }, keys, "openai/model"), /token failure/);
});

test("final fetch boundary isolates concurrent chat, tools, decisions, embeddings and agent requests", async () => {
    const state = { customProviders: {}, remoteAgentModels: [
        { id: "remote-known", agent: { model: { id: "anthropic/model" } } },
        { id: "remote-opaque" },
    ] };
    const { createCredentialScopedFetch } = load("packages/aihappey-core/src/features/provider-credentials/scopedRequest.ts", {
        "aihappey-state": { store: { getState: () => state } },
    });
    const seen = [];
    const fetcher = createCredentialScopedFetch(async (url, init) => {
        seen.push({ url, headers: snapshot(init.headers), body: init.body });
        return new Response("{}");
    });
    const cases = [
        [{ model: "openai/model" }, ["openai-SECRET"]],
        [{ model: "google/model" }, ["google-SECRET"]],
        [{ metadata: { agents: [{ model: { id: "openai/model" } }, { model: { id: "anthropic/model" } }] } }, ["anthropic-SECRET", "openai-SECRET"]],
        [{ models: ["remote-known"] }, ["anthropic-SECRET"]],
        [{ model: "remote-opaque" }, []],
        [{ model: "unknown/model" }, []],
        [{ metadata: { model: "openai/model" } }, []],
    ];
    await Promise.all(cases.map(([body], index) => fetcher(`https://gateway/${index}`, {
        method: "POST", headers: new Headers({ ...keys, Authorization: "Bearer entra" }), body: JSON.stringify(body),
    })));
    for (let i = 0; i < cases.length; i++) {
        assert.deepEqual(credentialValues(seen[i].headers), cases[i][1]);
        assert.equal(seen[i].headers.authorization, "Bearer entra");
        assert.equal(seen[i].body, JSON.stringify(cases[i][0]));
    }
    await fetcher("https://agents/responses/id", { headers: keys });
    assert.deepEqual(credentialValues(seen.at(-1).headers), [], "retrieval needs no execution keys");
    const form = new FormData(); form.set("model", "openai/transcribe");
    await fetcher("https://gateway/audio", { method: "POST", headers: keys, body: form });
    assert.deepEqual(credentialValues(seen.at(-1).headers), ["openai-SECRET"]);
    const request = new Request("https://gateway/chat", { method: "POST", headers: keys, body: JSON.stringify({ model: "google/model" }) });
    await fetcher(request);
    assert.deepEqual(credentialValues(seen.at(-1).headers), ["google-SECRET"]);
});

test("all streaming/realtime operation builders preserve only the operation provider and AzureAuth token", async () => {
    const streaming = load("packages/aihappey-core/src/features/streaming/streamingRequest.ts");
    const realtime = load("packages/aihappey-core/src/features/realtime/realtimeConversationConfig.ts");
    for (const [builder, model] of [[streaming.buildStreamingHeaders, "google/audio"], [realtime.buildRealtimeBackendHeaders, "openai/realtime"]]) {
        const headers = await builder({ headers: keys, getAccessToken: async () => "entra" }, keys, model);
        assert.deepEqual(credentialValues(headers), [model.startsWith("google") ? "google-SECRET" : "openai-SECRET"]);
        assert.equal(snapshot(headers).authorization, "Bearer entra");
    }
});

test("model discovery splits BYOK keys and never bundles them into AzureAuth catalog requests", async () => {
    const original = global.fetch;
    const seen = [];
    global.fetch = async (url, init) => { seen.push(snapshot(init.headers)); return Response.json({ data: [] }); };
    try {
        await auth.listModelsWithSplitProviderHeaders({ modelsApi: "https://gateway/models", customHeaders: keys, getAccessToken: async () => "entra" });
        assert.equal(seen.length, 1);
        assert.deepEqual(credentialValues(seen[0]), []);
        assert.equal(seen[0].authorization, "Bearer entra");
        seen.length = 0;
        await auth.listModelsWithSplitProviderHeaders({ modelsApi: "https://gateway/models", customHeaders: { "X-OpenAI-Key": keys["X-OpenAI-Key"], "X-Anthropic-Key": keys["X-Anthropic-Key"] } });
        assert.deepEqual(seen.map(credentialValues), [[], ["openai-SECRET"], ["anthropic-SECRET"]]);
    } finally { global.fetch = original; }
});

test("shared HTTP header merging preserves Headers/tuple inputs and AzureAuth bearer precedence", async () => {
    const { createHttpClient } = load("packages/aihappey-http/src/index.ts");
    let captured;
    const client = createHttpClient({ headers: { authorization: "old", "X-Endpoint": "required" }, getAccessToken: async () => "entra", fetch: async (_, init) => {
        captured = snapshot(init.headers); return Response.json({});
    } });
    await client.post("https://gateway/operation", "{}", new Headers({ "Content-Type": "application/json" }));
    assert.equal(captured.authorization, "Bearer entra");
    assert.equal(captured["x-endpoint"], "required");
    assert.equal(captured["content-type"], "application/json");
});
