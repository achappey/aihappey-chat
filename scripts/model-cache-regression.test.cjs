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

function harness(saved, network = deferred(), query = "", defaults) {
  const render = renderer(), writes = [], requests = [], reads = [];
  const auth = load(authFile);
  const state = { models: [], modelsLoaded: false, modelsRefreshVersion: 0, customHeaders: {},
    apiKeyEncryptionStatus: "none",
    selectedModel: "p/preferred", userPreferredModel: ["p/preferred"],
    setModels: models => { state.models = models; state.modelsLoaded = true; },
    setModelsLoadingProgress: progress => { state.modelsLoadingProgress = progress; },
    setSelectedModel: value => { state.selectedModel = value; state.selectedChatModelIds = undefined; },
    setSelectedChatModelIds: ids => {
      state.selectedChatModelIds = [...new Set(ids)];
      if (!ids.includes(state.selectedModel)) state.selectedModel = ids[0];
    },
  };
  const mocks = { react: render.react, "aihappey-state": {
    ...load("packages/aihappey-state/src/slices/modelPreferences.ts"),
    store: { getState: () => state, setState: patch => Object.assign(state, patch) },
    useAppStore: selector => selector(state),
  },
    "../chat/engine/favoriteRouter": { favoriteRouterModel: state => state.routingEnabled
      && state.models.some(model => model.type === "decision") ? "p/decision" : undefined },
    "react-router": { useSearchParams: () => [new URLSearchParams(query)] },
    "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => providers },
    "../provider-credentials/providerAuthHeaders": { ...auth, listModelsWithSplitProviderHeaders: options => { requests.push(options); return network.promise; } },
    "aihappey-models": { ...catalog, modelCacheScope: async context => context.headers["x-context"] ?? "scope",
      localModelStore: { load: async scope => { reads.push(scope); return structuredClone(saved); }, replace: async (...args) => { writes.push(args); } } },
  };
  const providers = {};
  const filename = "packages/aihappey-core/src/features/models/useModels.ts";
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => { if (!(id in mocks)) throw Error("Unmocked import: " + id); return mocks[id]; }, module, module.exports);
  const useDefaultModel = defaults ? load("packages/aihappey-core/src/shell/bootstrap/useDefaultModel.ts", mocks).useDefaultModel : () => {};
  const Component = () => { useDefaultModel(false, defaults); module.exports.useModels("https://gateway.test/models"); return null; };
  return { state, writes, requests, reads, network, render: () => render.render(Component, {}), unmount: () => render.render(() => null, {}) };
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

test("language defaults initialize multiple candidates only after decision-model discovery without changing saved lists", async () => {
  for (const routingEnabled of [false, true]) {
    const first = { id: "p/first", type: "language" }, second = { id: "p/second", type: "language" };
    const h = harness(snapshot(first, second));
    h.state.selectedModel = undefined;
    h.state.userPreferredModel = [second.id, first.id];
    h.state.routingEnabled = routingEnabled;
    h.render(); await flush(); h.render();
    assert.equal(h.state.selectedModel, second.id);
    assert.equal(h.state.selectedChatModelIds, undefined);
    h.network.resolve({ data: [first, second, { id: "p/decision", type: "decision" }] });
    await flush(); h.render();
    assert.deepEqual(h.state.selectedChatModelIds, routingEnabled ? [second.id, first.id] : undefined);
    assert.deepEqual(h.state.userPreferredModel, [second.id, first.id]);
  }
});

test("discovery preserves explicit URL and current session choices instead of applying model lists", async () => {
  for (const query of ["", "model=p/explicit"]) {
    const first = { id: "p/first", type: "language" }, explicit = { id: "p/explicit", type: "language" };
    const h = harness(snapshot(first, explicit, { id: "p/decision", type: "decision" }), undefined, query);
    h.state.selectedModel = query ? undefined : explicit.id;
    h.state.userPreferredModel = [first.id, explicit.id]; h.state.routingEnabled = true;
    h.render(); await flush(); h.render();
    assert.equal(h.state.selectedModel, explicit.id);
    assert.equal(h.state.selectedChatModelIds, undefined);
    h.unmount();
  }
});

test("unavailable defaults are filtered for routing; manual mode keeps the existing newest-language fallback", async () => {
  for (const routingEnabled of [false, true]) {
    const second = { id: "p/second", type: "language", created: 1 };
    const newest = { id: "p/newest", type: "language", created: 10 };
    const h = harness(snapshot(second, newest, { id: "p/decision", type: "decision" }));
    h.state.selectedModel = undefined;
    h.state.userPreferredModel = ["p/missing", second.id]; h.state.routingEnabled = routingEnabled;
    h.render(); await flush(); h.render();
    assert.equal(h.state.selectedModel, routingEnabled ? second.id : newest.id);
    assert.deepEqual(h.state.userPreferredModel, ["p/missing", second.id]);
    h.unmount();
  }
});

test("locked startup waits for decrypted headers and then applies saved or app-configured defaults", async () => {
  const first = { id: "p/first", type: "language" }, second = { id: "p/second", type: "language" };
  const fallback = { id: "p/public", type: "language", created: 100 };
  const ids = [second.id, first.id];
  for (const configured of [false, true]) for (const routingEnabled of [false, true]) {
    for (const saved of [undefined, snapshot(fallback)]) {
      const h = harness(saved, undefined, "", configured ? { language: ids } : undefined);
      h.state.selectedModel = undefined;
      h.state.userPreferredModel = configured ? undefined : [...ids];
      h.state.apiKeyEncryptionStatus = "locked";
      h.state.routingEnabled = routingEnabled;
      h.render(); await flush(); h.render(); await flush();
      assert.equal(h.requests.length, 0, "Do not discover an anonymous catalog while the password prompt is open");
      assert.equal(h.reads.length, 0, "Do not publish an incomplete catalog before credentials are ready");
      assert.equal(h.state.modelsLoaded, false);
      assert.equal(h.state.selectedModel, undefined);
      assert.deepEqual(h.state.userPreferredModel, ids);

      h.state.customHeaders = { "X-P-Key": "decrypted-key" };
      h.state.apiKeyEncryptionStatus = "unlocked";
      h.render(); await flush(); h.render();
      assert.equal(h.requests.length, 1);
      assert.equal(h.requests[0].customHeaders["X-P-Key"], "decrypted-key");
      h.network.resolve({ data: [fallback, first, second, { id: "p/decision", type: "decision" }] });
      await flush(); h.render();
      assert.equal(h.state.selectedModel, second.id);
      assert.deepEqual(h.state.selectedChatModelIds, routingEnabled ? ids : undefined);
      assert.deepEqual(h.state.userPreferredModel, ids, "Discovery must never rewrite durable preferences");
      h.unmount();
    }
  }
});

test("a cached automatic fallback yields to the preferred model when the full catalog arrives", async () => {
  for (const routingEnabled of [false, true]) {
    const fallback = { id: "p/public", type: "language", created: 100 };
    const preferred = { id: "p/preferred", type: "language", created: 1 };
    const decision = { id: "p/decision", type: "decision" };
    const h = harness(snapshot(fallback, decision));
    h.state.selectedModel = undefined; h.state.routingEnabled = routingEnabled;
    h.render(); await flush(); h.render();
    assert.equal(h.state.selectedModel, fallback.id);
    h.network.resolve({ data: [fallback, preferred, decision] });
    await flush(); h.render();
    assert.equal(h.state.selectedModel, preferred.id);
    assert.deepEqual(h.state.selectedChatModelIds, routingEnabled ? [preferred.id] : undefined);
    assert.deepEqual(h.state.userPreferredModel, [preferred.id]);
    h.unmount();
  }
});

test("partial default candidates expand in preference order when more defaults are discovered", async () => {
  const first = { id: "p/first", type: "language" }, second = { id: "p/second", type: "language" };
  const decision = { id: "p/decision", type: "decision" };
  for (const routingEnabled of [false, true]) {
    const h = harness(snapshot(second, decision));
    h.state.selectedModel = undefined; h.state.routingEnabled = routingEnabled;
    h.state.userPreferredModel = [first.id, second.id];
    h.render(); await flush(); h.render();
    assert.equal(h.state.selectedModel, second.id);
    h.network.resolve({ data: [second, first, decision] });
    await flush(); h.render();
    assert.deepEqual(h.state.selectedChatModelIds, routingEnabled ? [first.id, second.id] : undefined);
    assert.equal(h.state.selectedModel, routingEnabled ? second.id : first.id);
    assert.deepEqual(h.state.userPreferredModel, [first.id, second.id]);
    h.unmount();
  }
});

test("manual and conversation choices made during refresh replace automatic selection ownership", async () => {
  const preferred = { id: "p/preferred", type: "language" }, manual = { id: "p/manual", type: "language" };
  const fallback = { id: "p/public", type: "language", created: 100 };
  const decision = { id: "p/decision", type: "decision" };
  for (const candidates of [undefined, [manual.id], []]) {
    const h = harness(snapshot(fallback, manual, decision));
    h.state.selectedModel = undefined; h.state.routingEnabled = true;
    h.render(); await flush(); h.render();
    assert.equal(h.state.selectedModel, fallback.id);
    if (candidates === undefined) h.state.setSelectedModel(manual.id);
    else h.state.setSelectedChatModelIds(candidates);
    h.render();
    h.network.resolve({ data: [manual, preferred, decision] });
    await flush(); h.render();
    assert.deepEqual(h.state.selectedChatModelIds, candidates);
    assert.equal(h.state.selectedModel, candidates?.length === 0 ? undefined : manual.id);
    h.unmount();
  }
});

test("an explicitly reselected default candidate list is not expanded by a later refresh", async () => {
  const first = { id: "p/first", type: "language" }, second = { id: "p/second", type: "language" };
  const decision = { id: "p/decision", type: "decision" };
  const h = harness(snapshot(second, decision));
  h.state.selectedModel = undefined; h.state.routingEnabled = true;
  h.state.userPreferredModel = [first.id, second.id];
  h.render(); await flush(); h.render();
  h.state.setSelectedChatModelIds([second.id]); h.render();
  h.network.resolve({ data: [first, second, decision] });
  await flush(); h.render();
  assert.deepEqual(h.state.selectedChatModelIds, [second.id]);
  assert.equal(h.state.selectedModel, second.id);
  h.unmount();
});

test("unlock preserves explicit URL, manual, and conversation selections", async () => {
  const preferred = { id: "p/preferred", type: "language" }, manual = { id: "p/manual", type: "language" };
  for (const choice of ["url", "manual", "conversation", "cleared"]) {
    const h = harness(undefined, undefined, choice === "url" ? "model=p/manual" : "");
    h.state.selectedModel = choice === "manual" ? manual.id : undefined;
    if (choice === "conversation") h.state.setSelectedChatModelIds([manual.id]);
    if (choice === "cleared") h.state.setSelectedChatModelIds([]);
    h.state.apiKeyEncryptionStatus = "locked"; h.state.routingEnabled = true;
    h.render(); await flush();
    h.state.customHeaders = { "X-P-Key": "decrypted-key" };
    h.state.apiKeyEncryptionStatus = "unlocked";
    h.render(); await flush();
    h.network.resolve({ data: [preferred, manual, { id: "p/decision", type: "decision" }] });
    await flush(); h.render();
    assert.equal(h.state.selectedModel, choice === "cleared" ? undefined : manual.id);
    assert.deepEqual(h.state.selectedChatModelIds, choice === "conversation" ? [manual.id] : choice === "cleared" ? [] : undefined);
    assert.deepEqual(h.state.userPreferredModel, [preferred.id]);
    h.unmount();
  }
});

test("locking keys cancels a pending discovery so it cannot publish or persist after lock", async () => {
  const h = harness(undefined);
  h.render(); await flush();
  assert.equal(h.requests.length, 1);
  h.state.apiKeyEncryptionStatus = "locked"; h.render();
  h.network.resolve({ data: [{ id: "p/private", type: "language" }] });
  await flush(); h.render();
  assert.equal(h.state.modelsLoaded, false);
  assert.deepEqual(h.state.models, []);
  assert.equal(h.writes.length, 0);
  h.unmount();
});
