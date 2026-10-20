const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { load, auth, scoped } = require("./credential-test-loader.cjs");
const keys = { "X-OpenAI-Key": "openai-SECRET", "X-Google-Key": "google-SECRET", "X-Anthropic-Key": "anthropic-SECRET" };
const snapshot = init => Object.fromEntries(new Headers(init.headers).entries());
const root = path.resolve(__dirname, "..");

test("real speech, transcription, image, reranking, embedding and realtime adapters receive only scoped credentials", async () => {
    const original = global.fetch;
    let captured;
    global.fetch = async (url, init) => { captured = { url, init, headers: snapshot(init) }; return new Response("test failure after capture", { status: 503 }); };
    try {
        const cases = [
            ["createSpeechProvider", provider => provider.speechModel("openai/speech").doGenerate({ text: "test" })],
            ["createTranscriptionProvider", provider => provider.transcriptionModel("openai/transcription").doGenerate({ audio: "dGVzdA==", mediaType: "audio/wav" })],
            ["createImageProvider", provider => provider.imageModel("openai/image", 1).doGenerate({ prompt: "test", n: 1 })],
            ["createRerankProvider", provider => provider.rerankingModel("openai/rerank").doRerank({ query: "test", documents: ["test"] })],
            ["createEmbeddingsProvider", provider => provider.embeddingModel("openai/embed").doEmbed({ values: ["test"] })],
        ];
        for (const [name, invoke] of cases) {
            captured = undefined;
            const exports = load(`packages/aihappey-ai/src/${name}.ts`);
            const provider = exports[name]({ baseUrl: "https://gateway/media", headers: await scoped.buildOperationHeaders({ headers: keys, getAccessToken: async () => "entra-token" }, keys, "openai/model") });
            await invoke(provider).catch(() => {});
            assert.ok(captured, `${name} must reach its actual fetch boundary`);
            assert.equal(captured.headers["x-openai-key"], "openai-SECRET");
            assert.equal(captured.headers["x-google-key"], undefined);
            assert.equal(captured.headers["x-anthropic-key"], undefined);
            assert.equal(captured.headers.authorization, "Bearer entra-token");
            assert.ok(!String(captured.init.body).includes("google-SECRET"));
        }
        captured = undefined;
        const { getRealtimeToken } = load("packages/aihappey-ai/src/getRealtimeToken.ts");
        const client = await getRealtimeToken({ baseUrl: "https://gateway/realtime", headers: await scoped.buildOperationHeaders({ getAccessToken: async () => "entra-token" }, keys, "google/live") });
        await client({ model: "google/live" }).catch(() => {});
        assert.equal(captured.headers["x-google-key"], "google-SECRET");
        assert.equal(captured.headers["x-openai-key"], undefined);
        assert.equal(captured.headers.authorization, "Bearer entra-token");
    } finally { global.fetch = original; }
});

test("video polling scopes each pending operation independently from the currently selected model", async () => {
    const original = global.fetch;
    const captured = [];
    global.fetch = async (url, init) => { captured.push({ url, headers: snapshot(init) }); return new Response("after capture", { status: 503 }); };
    try {
        const { createVideoProvider } = load("packages/aihappey-ai/src/createVideoProvider.ts");
        const pending = [{ modelId: "openai/video", operation: "openai/task-a" }, { modelId: "google/video", operation: "google/task-b" }];
        await Promise.all(pending.map(async item => {
            const headers = await scoped.buildOperationHeaders({}, keys, item.operation.split("/")[0]);
            const model = createVideoProvider({ baseUrl: "https://gateway/videos", headers }).videoModel(item.modelId);
            await model.doStatus({ operation: item.operation }).catch(() => {});
        }));
        assert.equal(captured.length, 2);
        for (const item of captured) {
            const provider = item.url.includes("/google/") ? "google" : "openai";
            assert.equal(item.headers[`x-${provider}-key`], `${provider}-SECRET`);
            assert.equal(item.headers[`x-${provider === "google" ? "openai" : "google"}-key`], undefined);
            assert.equal(item.headers["x-anthropic-key"], undefined);
        }
    } finally { global.fetch = original; }
});

test("SDK-created requests scope at send time and retain AzureAuth token and custom-provider BYOK", async () => {
    const original = global.fetch;
    const captured = [];
    global.fetch = async (url, init) => { captured.push(snapshot(init)); return Response.json({}); };
    try {
        const backend = load("packages/aihappey-ai/src/createBackendProvider.ts", { "@ai-sdk/openai": { createOpenAI: config => config } });
        const wrapper = load("packages/aihappey-core/src/features/provider-credentials/scopedBackendProvider.ts", {
            "aihappey-ai": backend,
            "aihappey-state": { store: { getState: () => ({ customProviders: { custom: { name: "CustomService" } }, remoteAgentModels: [] }) } },
        });
        const sdk = wrapper.createBackendProvider("test", "https://gateway", { ...keys, "X-CustomService-Key": "custom-SECRET" }, async () => "entra-token");
        for (const model of ["openai/model", "google/model", "custom/model"]) await sdk.fetch("https://gateway/v1/responses", { body: JSON.stringify({ model }), headers: { "X-Anthropic-Key": "override-must-not-leak" } });
        assert.equal(captured[0]["x-openai-key"], "openai-SECRET");
        assert.equal(captured[1]["x-google-key"], "google-SECRET");
        assert.equal(captured[2]["x-customservice-key"], "custom-SECRET");
        for (const item of captured) {
            assert.equal(item["x-anthropic-key"], undefined);
            assert.equal(item.authorization, "Bearer entra-token");
            assert.equal(Object.keys(item).filter(key => /^x-.+-key$/.test(key)).length, 1);
        }
    } finally { global.fetch = original; }
});

test("media pages and shared callers remain connected to operation/final-boundary scoping", () => {
    const base = "packages/aihappey-core/src/features/";
    for (const [file, expected] of [
        ["speech/SpeechPage.tsx", "buildOperationHeaders(config, customHeaders, selectedModel"],
        ["transcriptions/TranscriptionsPage.tsx", "buildOperationHeaders(config, customHeaders, selectedModel"],
        ["images/ImagePage.tsx", "buildOperationHeaders(config, customHeaders, selectedModel"],
        ["chat/input/useDictation.ts", "buildOperationHeaders(config, customHeaders, resolvedModelId"],
        ["chat/messages/useMessageSpeechPlayback.ts", "buildStreamingHeaders(config, customHeaders, model)"],
        ["transcriptions/realtime/useRealtimeTranscriptionController.ts", "buildOperationHeaders(config, customHeaders, selectedModel.id"],
        ["videos/VideoPage.tsx", "createRequestHeaders(String(pending.operation).split(\"/\")[0])"],
        ["jobs/JobsPage.tsx", "createCredentialScopedFetch(config.fetch)"],
        ["tools/toolcalls/useLocalAgentsToolCall.ts", "createCredentialScopedFetch(config.fetch)"],
        ["chat/engine/useAuthFetch.ts", "createCredentialScopedFetch(f)"],
        ["playground/playgroundChat.ts", "createCredentialScopedFetch(customFetch ?? fetch)"],
        ["json-render/useUIStream.ts", "makeHeaders(getAccessToken, customHeaders, model)"],
    ]) assert.ok(fs.readFileSync(path.join(root, base + file), "utf8").includes(expected), file);
    for (const file of ["StreamingSpeechPage.tsx", "StreamingImagePage.tsx", "StreamingTranscriptionsPage.tsx"]) {
        assert.ok(fs.readFileSync(path.join(root, base + "streaming/" + file), "utf8").includes("buildStreamingHeaders(config, customHeaders, selectedModel)"));
    }
});

test("existing media token-error fallback is preserved without reintroducing unrelated keys", async () => {
    const fallback = await auth.buildOperationHeaders({ headers: { Authorization: "Bearer configured" }, getAccessToken: async () => { throw Error("auth failure"); } }, keys, "openai/model", undefined, true);
    assert.equal(fallback.authorization, "Bearer configured");
    assert.equal(fallback["x-openai-key"], "openai-SECRET");
    assert.equal(fallback["x-google-key"], undefined);
});

test("public policy documents verified scoping, unknown requirements and remaining credential exposure", () => {
    const policy = fs.readFileSync(path.join(root, "samples/chathappey/PRIVACY.md"), "utf8");
    assert.match(policy, /scopes saved provider API keys to the selected\s+provider and operation/);
    assert.match(policy, /does not fall back to\s+sending all saved provider keys/);
    assert.match(policy, /Endpoint authentication and applicable\s+OAuth tokens are handled separately/);
    assert.match(policy, /credentials remain visible to their intended gateway/);
    assert.doesNotMatch(policy, /browser can send its configured credential headers together/);
});
