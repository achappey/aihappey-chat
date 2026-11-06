const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const { load } = require("./credential-test-loader.cjs");
const { renderer } = require("./react-test-renderer.cjs");
const catalog = require("aihappey-models");
const authFile = "packages/aihappey-core/src/features/provider-credentials/providerAuthHeaders.ts";
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const snapshot = (...models) => ({ version: 1, sources: { "gateway:anonymous": { updatedAt: 1, response: { data: models } } } });

test("IndexedDB catalog storage round-trips JSON and treats missing, corrupt, quota and privacy failures as misses", async () => {
  global.window = {};
  const values = new Map(); let fail = false;
  const { IndexedDBModelStore } = load("packages/aihappey-models/src/IndexedDBModelStore.ts", {
    "idb-keyval": { get: async key => { if (fail) throw Error("privacy"); return values.get(key); },
      set: async (key, value) => { if (fail) throw Error("quota"); values.set(key, value); }, del: async key => values.delete(key) },
  });
  const store = new IndexedDBModelStore(), scope = "a".repeat(64);
  assert.equal(await store.load(scope), undefined);
  const saved = snapshot({ id: "p/model", future: { nested: [1, 2] } });
  await store.replace(scope, saved);
  assert.deepEqual(await store.load(scope), saved);
  saved.sources["gateway:anonymous"].response.data[0].future.nested.push(3);
  assert.deepEqual((await store.load(scope)).sources["gateway:anonymous"].response.data[0].future.nested, [1, 2]);
  await store.clear(scope); assert.equal(await store.load(scope), undefined);
  values.set("aihappey_models_v1:" + scope, { version: 2 }); assert.equal(await store.load(scope), undefined);
  fail = true; await store.replace(scope, snapshot()); assert.equal(await store.load(scope), undefined);
  delete global.window;
});

test("partial discovery refresh replaces successful sources, preserves failed ones, and accepts authoritative empty responses", async () => {
  const sources = {};
  const auth = load(authFile, { "aihappey-http": { createHttpClient: () => ({ get: async url => {
    if (url.startsWith("https://p.test")) throw Error("offline");
    return { data: [] };
  } }) } });
  const result = await auth.listModelsWithSplitProviderHeaders({ modelsApi: "https://gateway.test/models", directProviderModels: true, includeGatewayModels: true,
    providers: { p: { name: "P", apiBaseUrl: "https://p.test" } }, customHeaders: { "X-P-Key": "secret" },
    cachedSources: { "gateway:anonymous": { data: [{ id: "removed", type: "language" }] },
      "direct:p": { data: [{ id: "p/retained", type: "language", route: "direct", future: 7 }] } },
    onSource: (key, response) => { sources[key] = response; },
  });
  assert.deepEqual(result.data.map(model => model.id), ["p/retained"]);
  assert.equal(result.data[0].future, 7);
  assert.deepEqual(sources["gateway:anonymous"], { data: [] });
  assert.equal(sources["direct:p"], undefined);
});

function harness(saved, network = deferred()) {
  const render = renderer(), writes = [], requests = [];
  const auth = load(authFile);
  const state = { models: [], modelsLoaded: false, modelsRefreshVersion: 0, customHeaders: {},
    selectedModel: "p/preferred", userPreferredModel: "p/preferred",
    setModels: models => { state.models = models; state.modelsLoaded = true; },
    setModelsLoadingProgress: progress => { state.modelsLoadingProgress = progress; },
    setSelectedModel: value => { state.selectedModel = value; },
  };
  const mocks = { react: render.react, "aihappey-state": { store: { getState: () => state }, useAppStore: selector => selector(state) },
    "react-router": { useSearchParams: () => [new URLSearchParams()] },
    "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => providers },
    "../provider-credentials/providerAuthHeaders": { ...auth, listModelsWithSplitProviderHeaders: options => { requests.push(options); return network.promise; } },
    "aihappey-models": { ...catalog, modelCacheScope: async context => context.headers["x-context"] ?? "scope",
      localModelStore: { load: async () => structuredClone(saved), replace: async (...args) => { writes.push(args); } } },
  };
  const providers = {};
  const filename = "packages/aihappey-core/src/features/models/useModels.ts";
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => { if (!(id in mocks)) throw Error("Unmocked import: " + id); return mocks[id]; }, module, module.exports);
  const Component = () => { module.exports.useModels("https://gateway.test/models"); return null; };
  return { state, writes, requests, network, render: () => render.render(Component, {}), unmount: () => render.render(() => null, {}) };
}

test("repeat visits publish cached models while refresh is pending and refresh does not cancel itself after hydration", async () => {
  const h = harness(snapshot({ id: "p/preferred", type: "language", future: true }));
  h.render(); await flush(); h.render(); await flush();
  assert.equal(h.state.modelsLoaded, true);
  assert.equal(h.state.models[0].future, true);
  assert.equal(h.requests.length, 1);
  h.state.selectedModel = "p/explicit"; h.render();
  const fresh = [{ id: "p/preferred", type: "language" }, { id: "p/explicit", type: "language" }];
  h.requests[0].onSource("gateway:anonymous", { data: fresh });
  h.network.resolve({ data: fresh }); await flush();
  assert.equal(h.state.models.length, 2);
  assert.equal(h.state.selectedModel, "p/explicit");
  assert.equal(h.writes.length, 1);
  assert.deepEqual(h.writes[0][1].sources["gateway:anonymous"].response.data, fresh);
});

test("failed refresh keeps cached models and explicit chat candidates; a cache miss still settles", async () => {
  for (const saved of [snapshot({ id: "p/preferred", type: "language" }), undefined]) {
    const h = harness(saved); h.state.selectedChatModelIds = ["p/manual"];
    h.render(); await flush(); h.network.reject(Error("offline")); await flush();
    assert.equal(h.state.modelsLoaded, true);
    assert.equal(h.state.models.length, saved ? 1 : 0);
    assert.equal(h.state.selectedModel, "p/preferred");
    assert.equal(h.state.modelsLoadingProgress, undefined);
    assert.equal(h.writes.length, 0);
  }
});

test("obsolete refreshes cannot publish or persist across context changes or unmount", async () => {
  const h = harness(snapshot({ id: "old", type: "language" }));
  h.render(); await flush(); h.unmount();
  h.network.resolve({ data: [{ id: "late", type: "language" }] }); await flush();
  assert.equal(h.state.models[0].id, "old"); assert.equal(h.writes.length, 0);
});
