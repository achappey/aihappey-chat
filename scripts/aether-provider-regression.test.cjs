// Run with: node --test scripts/aether-provider-regression.test.cjs
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Match the source-loading approach used by provider-settings-regression.test.cjs.
function load(relativePath, mocks = {}) {
    const filename = path.resolve(__dirname, "..", relativePath);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        fileName: filename,
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)((id) => {
        if (Object.hasOwn(mocks, id)) return mocks[id];
        throw new Error(`Unmocked import ${id} in ${relativePath}`);
    }, module, module.exports);
    return module.exports;
}

const { aether } = load("packages/aihappey-core/src/runtime/providers/catalog/aether.ts");
const { HIDDEN_DIRECT_MODEL_ID_SUFFIX } = load("packages/aihappey-types/src/modelIdentity.ts");
const { createHttpClient } = load("packages/aihappey-http/src/index.ts");
const modelTypes = load("packages/aihappey-core/src/features/models/modelTypeEnrichment.ts");
const { resolvePreferredProviderChatEndpoint } = load("packages/aihappey-state/src/slices/chatEndpoint.ts");

function modelLoader(data) {
    const calls = [];
    const api = load("packages/aihappey-core/src/features/provider-credentials/providerAuthHeaders.ts", {
        "aihappey-http": {
            createHttpClient: (config) => createHttpClient({
                ...config,
                fetch: async (url, init) => {
                    calls.push({ url, headers: init.headers });
                    return new Response(JSON.stringify({ object: "list", data }));
                },
            }),
        },
        "../../runtime/providers/providerMetadata": { PROVIDERS: { aether } },
        "../models/modelTypeEnrichment": modelTypes,
        "aihappey-types": { HIDDEN_DIRECT_MODEL_ID_SUFFIX },
        "../../runtime/providers/catalog/models/zai.json": { data: [] },
        // Aether has no static pricing catalogue; preserve the response as production does.
        "../../runtime/providers/catalog/providerPricing": {
            enrichDirectModelsWithProviderPricing: (response) => response,
        },
    });
    return { ...api, calls };
}

test("Aether uses its official logo and documented chat routes", () => {
    assert.equal(aether.icons[0].src, "https://aetherapi.dev/logo-icon-black.png");
    assert.equal(aether.urls.docs, "https://aetherapi.dev/#/docs/quickstart");
    assert.equal(resolvePreferredProviderChatEndpoint(aether.chatEndpoints), "/v1/chat/completions");
    assert.equal(resolvePreferredProviderChatEndpoint(aether.chatEndpoints, "/v1/responses"), "/v1/chat/completions");
});

test("a configured Aether key fetches direct models with isolated bearer authentication", async () => {
    const api = modelLoader([
        { id: "example-chat", object: "model", owned_by: "Example", context: "128000" },
        { id: "text-embedding-example", object: "model" },
        { id: "example-image", object: "model" },
    ]);
    const response = await api.listModelsWithSplitProviderHeaders({
        modelsApi: "https://gateway.invalid/v1/models",
        customHeaders: { "X-Aether-Key": "test-aether-key", "X-OpenAI-Key": "other-test-key" },
        directProviderModels: true,
        includeGatewayModels: false,
        providers: { aether },
    });
    assert.deepEqual(api.calls, [{
        url: "https://api.aetherapi.dev/v1/models",
        headers: { Authorization: "Bearer test-aether-key" },
    }]);
    assert.equal(response.data.length, 3);
    assert.deepEqual(response.data.map((model) => model.type), ["language", "embedding", "image"]);
    for (const model of response.data) {
        assert.equal(model.route, "direct");
        assert.equal(model.providerKey, "aether");
        assert.equal(model.id, `aether/${model.providerModelId}${HIDDEN_DIRECT_MODEL_ID_SUFFIX}`);
    }
    assert.equal(response.data[0].providerModelId, "example-chat");
    assert.equal(response.data[0].context, "128000");
});

test("Aether direct discovery skips absent and blank keys", async () => {
    for (const customHeaders of [{}, { "X-Aether-Key": "   " }, { "X-OpenAI-Key": "other-test-key" }]) {
        const api = modelLoader([{ id: "example-chat" }]);
        const response = await api.listModelsWithSplitProviderHeaders({
            modelsApi: "https://gateway.invalid/v1/models",
            customHeaders,
            directProviderModels: true,
            includeGatewayModels: false,
            providers: { aether },
        });
        assert.deepEqual(api.calls, []);
        assert.deepEqual(response.data, []);
    }
});

test("Aether preserves already-prefixed model IDs and avoids a duplicated bearer prefix", async () => {
    const api = modelLoader([{ id: "aether/example-chat" }]);
    const response = await api.listModelsWithSplitProviderHeaders({
        modelsApi: "https://gateway.invalid/v1/models",
        customHeaders: { "X-Aether-Key": "Bearer test-aether-key" },
        directProviderModels: true,
        includeGatewayModels: false,
        providers: { aether },
    });
    assert.equal(api.calls[0].headers.Authorization, "Bearer test-aether-key");
    assert.equal(response.data[0].id, `aether/example-chat${HIDDEN_DIRECT_MODEL_ID_SUFFIX}`);
    assert.equal(response.data[0].providerModelId, "aether/example-chat");
});
