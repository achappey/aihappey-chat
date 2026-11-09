const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { buildSync } = require("esbuild");
const { DefaultChatTransport } = require("ai");
const { load: loadShared } = require("./credential-test-loader.cjs");

const base = "packages/aihappey-core/src/features/";
const endpointState = loadShared("packages/aihappey-state/src/slices/chatEndpoint.ts");
const types = loadShared("packages/aihappey-types/src/index.ts");
const codeCache = new Map();
function harness() {
  const clock = { time: 1000, now() { return this.time; } };
  function load(file) {
    if (!codeCache.has(file)) codeCache.set(file, buildSync({ entryPoints: [path.resolve(file)], bundle: true,
      packages: "external", platform: "node", format: "cjs", write: false, logLevel: "silent" }).outputFiles[0].text);
    const module = { exports: {} };
    new Function("require", "module", "exports", "performance", codeCache.get(file))(id => {
      if (id === "aihappey-state") return { ...endpointState, getProviderHeadersForKey: (headers, key) => headers?.[key],
        store: { getState: () => ({ customProviders: {}, remoteAgentModels: [] }) } };
      if (id === "aihappey-types") return types;
      if (id === "aihappey-ai") return { DefaultChatTransport };
      if (id === "aihappey-components") return { canonicalizeAnthropicTools: value => value };
      return require(id);
    }, module, module.exports, clock);
    return module.exports;
  }
  return { clock, ...load(base + "benchmarks/benchmarkRunner.ts"),
    ...load(base + "benchmarks/benchmarkRouting.ts"), ...load(base + "benchmarks/benchmarkRequest.ts"),
    ...load(base + "chat/engine/genericChatEndpoint.ts") };
}
const providers = {
  openai: { name: "OpenAI", apiBaseUrl: "https://openai.test", chatEndpoints: ["/v1/responses", "/v1/chat/completions"] },
  anthropic: { name: "Anthropic", apiBaseUrl: "https://anthropic.test", chatEndpoints: ["/v1/messages"] },
  google: { name: "Google", apiBaseUrl: "https://google.test", chatEndpoints: ["/v1beta/interactions"] },
};
const keys = { "X-OpenAI-Key": "openai-secret", "X-Anthropic-Key": "anthropic-secret", "X-Google-Key": "google-secret" };
const model = (id, extra = {}) => ({ id, name: id, type: "language", owned_by: id.split("/")[0], tags: [], ...extra });
function environment(extra = {}) {
  return { config: { baseUrl: "https://gateway.test", headers: { Authorization: "gateway-secret", "X-Tenant": "gateway-only" } },
    customHeaders: { ...keys }, providers: structuredClone(providers),
    models: [model("openai/model", { providerModelId: "native/model", route: "gateway" }), model("anthropic/model"), model("google/model")], ...extra };
}
function target(extra = {}) {
  return { id: "target-1", ordinal: 1, color: "#4f8cff", modelId: "openai/model", mode: "default", endpoint: "/api/chat",
    settings: { temperature: 0.2, maxOutputTokens: 100, providerMetadata: { openai: { reasoning: { effort: "low" }, future_flag: false },
      anthropic: { thinking: { type: "adaptive" } } }, providerHeaders: { openai: { "OpenAI-Beta": "selected-beta" }, anthropic: { "anthropic-beta": "other-beta" } } }, ...extra };
}
const batch = (h, env, extra = {}) => h.snapshotBenchmarkBatch({ ordinal: 1, prompt: "Frozen prompt", repeats: 2, concurrency: 1, targets: [target()], ...extra }, env);
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function sse(events, options = {}) {
  let index = 0;
  return new Response(new ReadableStream({
    pull(controller) {
      if (index === events.length) { controller.close(); return; }
      let event = events[index++];
      if (Array.isArray(event)) { options.clock.time = event[0]; event = event[1]; }
      controller.enqueue(new TextEncoder().encode(`data: ${typeof event === "string" ? event : JSON.stringify(event)}\n\n`));
    }, cancel: options.onCancel,
  }, { highWaterMark: 0 }), { headers: { "Content-Type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" } });
}
const text = delta => ({ choices: [{ index: 0, delta: { content: delta } }] });
const usage = metadata => ({ choices: [], usage: { prompt_tokens: 9, completion_tokens: 100 }, metadata });
function response(endpoint, metadata = { providerMetadata: { gateway: { ttft: 7, tps: 70 } } }) {
  if (endpoint === "/api/chat") return sse([{ type: "start", messageId: "assistant" }, { type: "text-start", id: "t" },
    { type: "text-delta", id: "t", delta: "Answer" }, { type: "text-end", id: "t" }, { type: "finish", finishReason: "stop", messageMetadata: metadata }]);
  if (endpoint === "/v1/responses") return sse([{ type: "response.created", response: { id: "r", model: "model" } },
    { type: "response.output_text.delta", item_id: "msg", delta: "Answer" },
    { type: "response.completed", response: { id: "r", status: "completed", usage: { input_tokens: 9, output_tokens: 100 }, output: [], metadata: { gateway: metadata?.providerMetadata?.gateway } } }]);
  if (endpoint === "/v1/messages") return sse([{ type: "message_start", message: { id: "m", model: "model", usage: { input_tokens: 9 } } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Answer" } }, { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 100 } }, { type: "message_stop" }]);
  return sse([text("Answer"), usage({ gateway: metadata?.providerMetadata?.gateway }), "[DONE]"]);
}

test("Header authentication exposes exactly four Gateway endpoints and compatible provider endpoints", () => {
  const h = harness(), env = environment();
  assert.deepEqual(h.benchmarkEndpoints(target(), env), ["/api/chat", "/v1/responses", "/v1/messages", "/v1/chat/completions"]);
  for (const endpoint of h.benchmarkEndpoints(target(), env)) {
    const result = h.resolveBenchmarkTarget(target({ endpoint }), env);
    assert.equal(result.endpoint, endpoint); assert.equal(result.mode, "default"); assert.equal(result.baseUrl, env.config.baseUrl);
  }
  for (const [provider, definition] of Object.entries(providers)) {
    const direct = target({ mode: "direct", modelId: `${provider}/model`, endpoint: definition.chatEndpoints[0] });
    const result = h.resolveBenchmarkTarget(direct, env);
    assert.equal(result.baseUrl, definition.apiBaseUrl); assert.equal(result.providerKey, provider);
    assert.equal(result.requestModel, provider === "openai" ? "native/model" : "model");
    assert.deepEqual(h.benchmarkEndpoints(direct, env), definition.chatEndpoints);
  }
});

test("Azure auth permits all four Gateway protocols but rejects every direct route before dispatch", async () => {
  const h = harness(), env = environment(); let calls = 0;
  env.config.getAccessToken = async () => "entra-token";
  env.config.fetch = async (_url, init) => { calls++; const body = JSON.parse(init.body);
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer entra-token");
    assert.equal(new Headers(init.headers).get("X-OpenAI-Key"), null);
    assert.equal(body.model, "openai/model");
    return response(new URL(_url).pathname);
  };
  for (const endpoint of h.benchmarkEndpoints(target(), env)) {
    const snapshot = h.resolveBenchmarkTarget(target({ endpoint }), env);
    await h.executeBenchmarkRequest({ target: snapshot, env, prompt: "Hello", signal: new AbortController().signal, onMetrics() {} });
  }
  assert.equal(calls, 4);
  for (const provider of Object.keys(providers)) {
    const direct = target({ mode: "direct", modelId: `${provider}/model`, endpoint: providers[provider].chatEndpoints[0] });
    assert.deepEqual(h.benchmarkEndpoints(direct, env), []);
    assert.throws(() => h.resolveBenchmarkTarget(direct, env), /Azure authentication/);
    await assert.rejects(h.executeBenchmarkRequest({ target: direct, env, prompt: "Hi", signal: new AbortController().signal, onMetrics() {} }), /Azure authentication/);
  }
  assert.equal(calls, 4);
});

test("direct discovery identity stays internal while the exact upstream model ID is used", () => {
  const h = harness(), env = environment();
  env.models = [model("alias/chat__direct", { route: "direct", sourceProviderKey: "openai", providerModelId: "native/exact-ID" })];
  const selected = h.resolveBenchmarkTarget(target({ modelId: "alias/chat__direct", mode: "direct", endpoint: "/v1/responses" }), env);
  assert.equal(selected.requestModel, "native/exact-ID");
  assert.equal(selected.providerKey, "openai");
  assert.equal(selected.modelLabel, "alias/chat");
  assert.equal(selected.modelId, "alias/chat__direct");
});

test("unavailable models, missing owned keys, disabled Gateway and incompatible endpoints never fall back", async () => {
  const h = harness(); let dispatched = 0;
  const env = environment(); env.config.fetch = async () => { dispatched++; return response("/api/chat"); };
  const cases = [
    [target({ modelId: "missing/model" }), env],
    [target({ mode: "direct", endpoint: "/v1/responses" }), { ...env, customHeaders: { "X-OpenAIHK-Key": "not-owned" } }],
    [target({ mode: "direct", endpoint: "/v1/messages" }), env],
    [target({ endpoint: "/v1/conversations" }), env],
    [target(), { ...env, gatewayEnabled: false }],
    [target(), { ...env, models: [model("openai/model", { route: "direct" })] }],
  ];
  for (const [candidate, context] of cases) {
    assert.throws(() => h.resolveBenchmarkTarget(candidate, context));
    await assert.rejects(h.executeBenchmarkRequest({ target: candidate, env: context, prompt: "Hi", signal: new AbortController().signal, onMetrics() {} }));
  }
  assert.equal(dispatched, 0);
});

test("Gateway requests scope Header credentials and retain provider-keyed API Chat settings; native protocols use existing mapping", async () => {
  const h = harness(), env = environment(); const sent = [];
  env.config.fetch = async (url, init) => { sent.push({ url, headers: new Headers(init.headers), body: JSON.parse(init.body) }); return response(new URL(url).pathname); };
  for (const endpoint of h.benchmarkEndpoints(target(), env)) {
    await h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target({ endpoint }), env), env, prompt: "Shared", signal: new AbortController().signal, onMetrics() {} });
  }
  for (const request of sent) {
    assert.equal(request.headers.get("authorization"), "gateway-secret");
    assert.equal(request.headers.get("x-openai-key"), "openai-secret");
    assert.equal(request.headers.get("x-anthropic-key"), null);
    assert.equal(request.headers.get("openai-beta"), "selected-beta");
    assert.equal(request.headers.get("anthropic-beta"), null);
    assert.equal(request.body.model, "openai/model");
    assert.ok(!JSON.stringify(request.body).includes("other-beta"));
    assert.ok(!JSON.stringify(request.body).includes("secret"));
  }
  assert.deepEqual(sent[0].body.providerMetadata, target().settings.providerMetadata.openai && { openai: target().settings.providerMetadata.openai });
  assert.deepEqual(sent[1].body.reasoning, { effort: "low" });
  assert.equal(sent[1].body.future_flag, false);
  assert.equal(sent[1].body.providerMetadata, undefined);
});

test("direct requests preserve native model IDs/settings and isolate provider auth, metadata and cookies", async () => {
  const h = harness(), env = environment(), sent = [];
  env.config.fetch = async (url, init) => { sent.push({ url, init, headers: new Headers(init.headers), body: JSON.parse(init.body) }); return response(new URL(url).pathname, undefined); };
  const selected = target({ mode: "direct", endpoint: "/v1/responses" });
  selected.settings.providerMetadata.openai.headers = { "x-legacy": "ignored", Authorization: "wrong-key" };
  Object.assign(selected.settings.providerHeaders.openai, { "x-local": "kept", Authorization: "wrong-key", "X-Anthropic-Key": "foreign" });
  await h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(selected, env), env, prompt: "Direct prompt", signal: new AbortController().signal, onMetrics() {} });
  const [request] = sent;
  assert.equal(request.url, "https://openai.test/v1/responses"); assert.equal(request.body.model, "native/model");
  assert.equal(request.headers.get("authorization"), "Bearer openai-secret"); assert.equal(request.headers.get("x-tenant"), null);
  assert.equal(request.headers.get("x-anthropic-key"), null); assert.equal(request.headers.get("x-local"), "kept");
  assert.equal(request.headers.get("x-legacy"), null);
  assert.equal(request.headers.get("openai-beta"), "selected-beta"); assert.equal(request.init.credentials, "omit");
  assert.deepEqual(request.body.reasoning, { effort: "low" }); assert.equal(request.body.future_flag, false);
  assert.equal(request.body.providerMetadata, undefined); assert.equal(request.body.providerRequestConfig, undefined);
});

test("mixed Gateway/direct requests pin each route and its credentials for the entire batch", async () => {
  const h = harness(), env = environment(), sent = [];
  env.config.fetch = async (url, init) => {
    sent.push({ url, headers: new Headers(init.headers) });
    env.customHeaders["X-OpenAI-Key"] = "edited-key";
    env.customHeaders["X-Anthropic-Key"] = "edited-other-key";
    env.config.headers.Authorization = "edited-gateway";
    return response(new URL(url).pathname);
  };
  const targets = [target(), target({ id: "t2", ordinal: 2, mode: "direct", endpoint: "/v1/responses" }),
    target({ id: "t3", ordinal: 3, modelId: "anthropic/model", mode: "direct", endpoint: "/v1/messages" })];
  const records = new Map();
  await h.startBenchmarkBatch(batch(h, env, { targets, repeats: 1 }), env, run => records.set(run.id, run)).done;
  assert.ok([...records.values()].every(run => run.status === "completed"));
  assert.deepEqual(sent.map(request => request.url), ["https://gateway.test/api/chat", "https://openai.test/v1/responses", "https://anthropic.test/v1/messages"]);
  assert.equal(sent[0].headers.get("authorization"), "gateway-secret");
  assert.equal(sent[1].headers.get("authorization"), "Bearer openai-secret");
  assert.equal(sent[2].headers.get("x-api-key"), "anthropic-secret");
  assert.equal(sent[2].headers.get("authorization"), null);
  assert.equal(sent[2].headers.get("x-openai-key"), null);
});

test("snapshots and reruns deeply freeze inputs and refuse route changes rather than rewriting earlier batches", () => {
  const h = harness(), env = environment(), selected = target();
  const first = batch(h, env, { targets: [selected] });
  selected.settings.providerMetadata.openai.reasoning.effort = "high";
  selected.settings.providerHeaders.openai["OpenAI-Beta"] = "edited";
  selected.endpoint = "/v1/responses";
  env.models[0].name = "Renamed";
  assert.equal(first.targets[0].settings.providerMetadata.openai.reasoning.effort, "low");
  assert.equal(first.targets[0].endpoint, "/api/chat"); assert.equal(first.targets[0].model.name, "openai/model");
  assert.ok(Object.isFrozen(first.targets[0].settings.providerMetadata.openai.reasoning));
  const again = h.repeatBenchmarkBatch(first, 2, env);
  assert.notEqual(again.id, first.id); assert.equal(again.ordinal, 2);
  assert.equal(again.prompt, first.prompt); assert.deepEqual(again.targets, first.targets);
  env.config.baseUrl = "https://changed.test";
  assert.throws(() => h.repeatBenchmarkBatch(first, 3, env), /route has changed/);
});

test("sequential round-robin scheduling isolates failures and never starts overlapping requests", async () => {
  const h = harness(), env = environment(), seen = [], latest = new Map(); let active = 0, peak = 0;
  const selected = [target(), target({ id: "target-2", ordinal: 2, endpoint: "/v1/responses" })];
  const execution = h.startBenchmarkBatch(batch(h, env, { targets: selected }), env, run => latest.set(run.id, run), async args => {
    peak = Math.max(peak, ++active); seen.push(args.target.id); await tick(); active--;
    if (seen.length === 2) throw new Error("isolated failure");
    args.onMetrics({ ttft: 0, tps: 12 });
  });
  await execution.done;
  assert.equal(peak, 1); assert.deepEqual(seen, ["target-1", "target-2", "target-1", "target-2"]);
  assert.deepEqual([...latest.values()].map(run => run.status), ["completed", "failed", "completed", "completed"]);
  assert.equal([...latest.values()][0].ttft, 0);
  assert.equal(JSON.stringify([...latest.values()]).includes("providerMetadata"), false);
});

test("bounded parallel scheduling reaches but never exceeds the configured worker limit", async () => {
  const h = harness(), env = environment(), releases = []; let active = 0, peak = 0, dispatched = 0;
  const execution = h.startBenchmarkBatch(batch(h, env, { repeats: 7, concurrency: 3 }), env, () => {}, async () => {
    dispatched++; peak = Math.max(peak, ++active); const wait = deferred(); releases.push(wait); await wait.promise; active--;
  });
  assert.equal(dispatched, 3);
  while (releases.length) { releases.shift().resolve(); await tick(); }
  await execution.done;
  assert.equal(dispatched, 7); assert.equal(peak, 3);
});

test("Stop cancels active and queued runs, prevents further dispatch, and ignores late metrics/completions", async () => {
  const h = harness(), env = environment(), latest = new Map(), pending = []; let dispatched = 0;
  const execution = h.startBenchmarkBatch(batch(h, env, { repeats: 6, concurrency: 2 }), env, run => latest.set(run.id, run), async args => {
    dispatched++; const wait = deferred(); pending.push({ args, wait }); await wait.promise;
    args.onMetrics({ ttft: 99, tps: 999 });
  });
  execution.stop(); execution.stop();
  assert.equal(dispatched, 2); assert.ok(pending.every(({ args }) => args.signal.aborted));
  assert.ok([...latest.values()].every(run => run.status === "cancelled"));
  pending.forEach(({ wait }) => wait.resolve()); await execution.done;
  assert.equal(dispatched, 2); assert.ok([...latest.values()].every(run => run.status === "cancelled" && run.tps === undefined));
});

test("setup rejects empty prompts/targets and non-integer or unbounded scheduling values", () => {
  const h = harness();
  for (const args of [[" ", 1, 1, [1]], ["p", 1, 1, []], ["p", 0, 1, [1]], ["p", 101, 1, [1]],
    ["p", 1.5, 1, [1]], ["p", 1, 0, [1]], ["p", 1, 9, [1]], ["p", 1, NaN, [1]], ["p", 1, 1.5, [1]]]) {
    assert.throws(() => h.validateBenchmarkSetup(...args));
  }
});

test("direct benchmarks match existing TTFT/TPS exactly and keep independent upstream values authoritative", async () => {
  for (const gateway of [undefined, { ttft: 0 }, { tps: 0 }, { ttft: 9, tps: 99 }]) {
    const h = harness(), env = environment(), metrics = [];
    const events = () => [[2100, text("")], [3000, text("Answer")], [7000, usage(gateway && { gateway })], [8000, "[DONE]"]];
    env.config.fetch = async () => sse(events(), { clock: h.clock });
    const snapshot = h.resolveBenchmarkTarget(target({ mode: "direct", endpoint: "/v1/chat/completions" }), env);
    await h.executeBenchmarkRequest({ target: snapshot, env, prompt: "Hi", signal: new AbortController().signal, onMetrics: value => metrics.push(value) });
    const actual = Object.assign({}, ...metrics);
    assert.deepEqual(actual, { ttft: 2, tps: 20, ...gateway });
    h.clock.time = 1000;
    const original = new h.GenericChatEndpointTransport("/v1/chat/completions", "openai", env.providers,
      { api: "https://openai.test/v1/chat/completions", fetch: env.config.fetch });
    const chunks = [];
    for await (const chunk of await original.sendMessages({ chatId: "baseline", trigger: "submit-message", messages: [] })) chunks.push(chunk);
    assert.deepEqual(actual, h.benchmarkMetrics(chunks.findLast(chunk => chunk.type === "finish").messageMetadata));
  }
});

test("metric extraction keeps genuine zero, ignores invalid values and never estimates missing TPS", () => {
  const h = harness();
  assert.deepEqual(h.benchmarkMetrics({ providerMetadata: { gateway: { ttft: 0, tps: 0, cost: 12 } } }), { ttft: 0, tps: 0 });
  for (const invalid of ["12", NaN, Infinity, -1, null, undefined]) {
    assert.deepEqual(h.benchmarkMetrics({ providerMetadata: { gateway: { ttft: invalid, tps: invalid } } }), {});
  }
  assert.deepEqual(h.benchmarkMetrics({ usage: { completionTokens: 100 }, providerMetadata: { gateway: { ttft: 2 } } }), { ttft: 2 });
});

test("API Chat publishes live reported metrics and Gateway native streams never get local timing fallbacks", async () => {
  const h = harness(), env = environment(), metrics = [], gate = deferred(); let sink;
  env.config.fetch = async () => new Response(new ReadableStream({ start(controller) { sink = controller; } }), {
    headers: { "Content-Type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
  });
  const send = event => sink.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
  const pending = h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target(), env), env, prompt: "Hi", signal: new AbortController().signal,
    onMetrics(value) { metrics.push(value); if (value.ttft !== undefined) gate.resolve(); } });
  while (!sink) await tick();
  send({ type: "start", messageId: "m" });
  send({ type: "message-metadata", messageMetadata: { providerMetadata: { gateway: { ttft: 0.25 } } } });
  await gate.promise;
  assert.deepEqual(Object.assign({}, ...metrics), { ttft: 0.25 });
  send({ type: "finish", finishReason: "stop", messageMetadata: { providerMetadata: { gateway: { ttft: 0.25, tps: 30 } } } }); sink.close();
  await pending;
  assert.deepEqual(Object.assign({}, ...metrics), { ttft: 0.25, tps: 30 });
  const absent = [];
  env.config.fetch = async () => sse([text("Answer"), usage(), "[DONE]"]);
  await h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target({ endpoint: "/v1/chat/completions" }), env), env, prompt: "Hi", signal: new AbortController().signal, onMetrics: metric => absent.push(metric) });
  assert.deepEqual(Object.assign({}, ...absent), {});
});

test("HTTP failures, error chunks and missing completion events are failures rather than successful benchmark runs", async () => {
  const h = harness(), env = environment();
  for (const fetcher of [async () => new Response("denied", { status: 401 }),
    async () => sse([{ type: "error", errorText: "stream failure" }]),
    async () => sse([{ type: "start", messageId: "m" }])]) {
    env.config.fetch = fetcher;
    await assert.rejects(h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target(), env), env, prompt: "Hi", signal: new AbortController().signal, onMetrics() {} }));
  }
  env.config.fetch = async () => sse([text("Answer"), { error: { message: "provider failed" } }]);
  await assert.rejects(h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target({ mode: "direct", endpoint: "/v1/chat/completions" }), env), env, prompt: "Hi", signal: new AbortController().signal, onMetrics() {} }));
});

test("aborting a live native stream cancels its source and does not finalize throughput", async () => {
  const h = harness(), env = environment(), abort = new AbortController(), metrics = []; let sink, cancelled = 0;
  env.config.fetch = async () => new Response(new ReadableStream({ start(controller) { sink = controller; }, cancel() { cancelled++; } }), { headers: { "Content-Type": "text/event-stream" } });
  const pending = h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target({ mode: "direct", endpoint: "/v1/chat/completions" }), env), env,
    prompt: "Hi", signal: abort.signal, onMetrics: metric => metrics.push(metric) });
  while (!sink) await tick();
  sink.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(text("Answer"))}\n\n`)); await tick();
  abort.abort(); await assert.rejects(pending, { name: "AbortError" });
  // The SDK's chained TransformStreams propagate upstream cancellation asynchronously.
  await tick();
  assert.equal(cancelled, 1); assert.ok(metrics.every(metric => metric.tps === undefined));
});

test("cancellation during token acquisition prevents dispatch; a fetch that resolves after abort has its stream cancelled", async () => {
  const h = harness(), env = environment(), token = deferred(), abort = new AbortController(); let dispatched = 0;
  env.config.getAccessToken = () => token.promise;
  env.config.fetch = async () => { dispatched++; return response("/api/chat"); };
  const pending = h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target(), env), env, prompt: "Hi", signal: abort.signal, onMetrics() {} });
  abort.abort(); await assert.rejects(pending, { name: "AbortError" }); token.resolve("late-token"); await tick();
  assert.equal(dispatched, 0);
  delete env.config.getAccessToken;
  const late = deferred(), secondAbort = new AbortController(); let cancelled = 0;
  env.config.fetch = () => late.promise;
  const second = h.executeBenchmarkRequest({ target: h.resolveBenchmarkTarget(target(), env), env, prompt: "Hi", signal: secondAbort.signal, onMetrics() {} });
  await tick(); secondAbort.abort(); await assert.rejects(second, { name: "AbortError" });
  late.resolve(new Response(new ReadableStream({ cancel() { cancelled++; } }), { headers: { "Content-Type": "text/event-stream" } }));
  await tick(); await tick(); assert.equal(cancelled, 1);
});

test("result errors redact configured provider and endpoint secrets", () => {
  const h = harness(), env = environment(), snapshot = h.resolveBenchmarkTarget(target(), env);
  const message = h.redactBenchmarkError(new Error("gateway-secret Bearer openai-secret anthropic-secret selected-beta"), env, snapshot);
  for (const value of ["gateway-secret", "openai-secret", "anthropic-secret", "selected-beta"]) assert.ok(!message.includes(value));
});

const React = require("react");
const ts = require("typescript");
const { renderer, nodes } = require("./react-test-renderer.cjs");
const theme = new Proxy({}, { get: (_, key) => key });
const themed = new Proxy({ useTheme: () => theme }, { get: (object, key) => object[key] ?? key });
const i18n = { useTranslation: () => ({ t: (key, args) => args?.number ? `${key} ${args.number}` : key }) };
function transpile(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => {
    if (id in mocks) return mocks[id];
    if (id === "react/jsx-runtime") return require(id);
    throw Error(`Unmocked import ${id} in ${file}`);
  }, module, module.exports);
  return module.exports;
}
function uiHarness({ execute = async () => {}, azure = false } = {}) {
  const h = renderer(), api = harness(), env = environment();
  if (azure) env.config.getAccessToken = async () => "entra";
  const calls = [], executions = [];
  const state = { selectedModel: "openai/model", effectiveChatEndpointMode: "default", effectiveChatEndpoint: "/api/chat",
    models: env.models, modelsLoaded: true, customHeaders: env.customHeaders,
    providerMetadata: target().settings.providerMetadata, providerHeaders: target().settings.providerHeaders,
    temperature: 0.2, maxOutputTokens: 100 };
  const before = structuredClone(state);
  const store = { getState: () => state };
  const useAppStore = selector => selector(state);
  const runner = { ...api, startBenchmarkBatch: (batch, environment, onRun) => {
    calls.push({ batch, environment });
    const execution = api.startBenchmarkBatch(batch, environment, onRun, execute);
    executions.push(execution); return execution;
  } };
  const session = transpile(base + "benchmarks/useBenchmarkSession.ts", { react: h.react,
    "./benchmarkRunner": runner, "./benchmarkRequest": api });
  const sharedForm = transpile(base + "chat-settings/ProviderChatForm.tsx", {
    react: h.react, "aihappey-components": themed, "../provider-config/google/GoogleChatConfig": { GoogleChatConfig: "GoogleChatConfig" },
  });
  const skills = { items: [] };
  const modal = transpile(base + "benchmarks/BenchmarkSettingsModal.tsx", { react: h.react, "aihappey-components": themed, "aihappey-i18n": i18n,
    "aihappey-skills": { useSkills: () => skills }, "../chat/engine/endpointProfiles": { getModelProviderKey: types.getModelProviderKey },
    "../chat-settings/ProviderChatForm": sharedForm, "../provider-config/openai/openAISkillOptions": {
      buildOpenAISkillOptions: () => [], createOpenAIShellSkillResolver: () => () => {},
    } });
  const { BenchmarksPage } = transpile(base + "benchmarks/BenchmarksPage.tsx", { react: h.react,
    "aihappey-components": themed, "aihappey-i18n": i18n, "aihappey-state": { store, useAppStore },
    "../chat/context/ChatContext": { useChatContext: () => ({ config: env.config }) },
    "../models/ModelSelect": { ModelSelect: "ModelSelect" }, "../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => env.providers },
    "../../ui/layout/OverviewPageHeader": { OverviewPageHeader: "OverviewPageHeader" },
    "../usage/UsageDashboardPrimitives": { Grid: "Grid", Section: "Section", palette: ["#111111", "#222222", "#333333"] },
    "./benchmarkRouting": api, "./benchmarkRunner": runner, "./BenchmarkSettingsModal": modal,
    "./BenchmarkResults": { BenchmarkResults: "BenchmarkResults" }, "./useBenchmarkSession": session,
  });
  const render = () => h.render(BenchmarksPage);
  const button = (tree, label, index = 0) => nodes(tree, "Button").filter(node => node.props.children === label)[index];
  const results = tree => nodes(tree, "BenchmarkResults")[0].props;
  return { h, env, state, before, calls, executions, render, button, results,
    unmount: () => h.render(() => null) };
}

test("page reuses model selection without automatic substitution and adds/duplicates/removes independent target settings", () => {
  const h = uiHarness(); let tree = h.render();
  assert.equal(nodes(tree, "ModelSelect")[0].props.autoSelectFallback, false);
  assert.equal(h.button(tree, "ai.benchmarks.start").props.disabled, true);
  h.button(tree, "ai.benchmarks.duplicate").props.onClick(); tree = h.render();
  assert.equal(nodes(tree, "ModelSelect").length, 2);
  h.button(tree, "ai.benchmarks.settings", 1).props.onClick(); tree = h.render();
  nodes(tree, "OpenAIChatConfigForm")[0].props.updateConfig({ reasoning: { effort: "high" } }); tree = h.render();
  h.button(tree, "save").props.onClick(); tree = h.render();
  h.button(tree, "ai.benchmarks.settings", 0).props.onClick(); tree = h.render();
  assert.equal(nodes(tree, "OpenAIChatConfigForm")[0].props.config.reasoning.effort, "low");
  nodes(tree, "OpenAIChatConfigForm")[0].props.updateConfig({ reasoning: { effort: "discard" } }); tree = h.render();
  h.button(tree, "cancel").props.onClick(); tree = h.render();
  h.button(tree, "ai.benchmarks.settings", 0).props.onClick(); tree = h.render();
  assert.equal(nodes(tree, "OpenAIChatConfigForm")[0].props.config.reasoning.effort, "low");
  h.button(tree, "cancel").props.onClick(); tree = h.render();
  h.button(tree, "ai.benchmarks.settings", 1).props.onClick(); tree = h.render();
  assert.equal(nodes(tree, "OpenAIChatConfigForm")[0].props.config.reasoning.effort, "high");
  h.button(tree, "cancel").props.onClick(); tree = h.render();
  h.button(tree, "ai.benchmarks.remove", 0).props.onClick(); tree = h.render();
  assert.equal(nodes(tree, "ModelSelect").length, 1);
  h.button(tree, "ai.benchmarks.addTarget").props.onClick(); tree = h.render();
  assert.equal(nodes(tree, "ModelSelect").length, 2);
  assert.deepEqual(h.state, h.before, "page-local edits must never change chat preferences or global selection");
  h.unmount();
});

test("Start uses current edits, Run again uses the frozen prior batch and appends results, Clear removes results only", async () => {
  const dispatched = [], h = uiHarness({ execute: async args => { dispatched.push(args.prompt); args.onMetrics({ ttft: 0.3 }); } });
  let tree = h.render();
  nodes(tree, "TextArea")[0].props.onChange("Original prompt");
  nodes(tree, "Input").find(node => node.props.label === "ai.benchmarks.repeatCount").props.onChange({ target: { value: "1" } });
  tree = h.render(); const firstStart = h.button(tree, "ai.benchmarks.start");
  firstStart.props.onClick(); firstStart.props.onClick(); await tick(); tree = h.render();
  assert.equal(h.calls.length, 1, "same-tick duplicate Starts must not overlap");
  assert.equal(h.results(tree).runs.length, 1);
  nodes(tree, "TextArea")[0].props.onChange("Edited prompt"); tree = h.render();
  h.button(tree, "ai.benchmarks.runAgain").props.onClick(); await tick(); tree = h.render();
  assert.deepEqual(dispatched, ["Original prompt", "Original prompt"]);
  assert.equal(h.results(tree).runs.length, 2); assert.equal(h.results(tree).batches.length, 2);
  assert.equal(h.results(tree).batches[0].prompt, "Original prompt");
  h.button(tree, "ai.benchmarks.start").props.onClick(); await tick(); tree = h.render();
  assert.deepEqual(dispatched, ["Original prompt", "Original prompt", "Edited prompt"]);
  h.button(tree, "ai.benchmarks.clear").props.onClick(); tree = h.render();
  assert.equal(h.results(tree).runs.length, 0); assert.equal(h.results(tree).batches.length, 0);
  assert.equal(nodes(tree, "TextArea")[0].props.value, "Edited prompt");
  assert.equal(h.button(tree, "ai.benchmarks.runAgain").props.disabled, false);
  h.button(tree, "ai.benchmarks.runAgain").props.onClick(); await tick(); tree = h.render();
  assert.equal(dispatched.at(-1), "Edited prompt"); assert.equal(h.results(tree).runs.length, 1);
  h.unmount();
});

test("editing target settings during execution cannot mutate any run in the active batch", async () => {
  const seen = [], gates = [], h = uiHarness({ execute: async args => {
    seen.push(args.target.settings.providerMetadata.openai.reasoning.effort);
    const gate = deferred(); gates.push(gate); await gate.promise;
  } });
  let tree = h.render(); nodes(tree, "TextArea")[0].props.onChange("Frozen"); tree = h.render();
  h.button(tree, "ai.benchmarks.start").props.onClick(); tree = h.render();
  h.button(tree, "ai.benchmarks.settings").props.onClick(); tree = h.render();
  nodes(tree, "OpenAIChatConfigForm")[0].props.updateConfig({ reasoning: { effort: "high" } }); tree = h.render();
  h.button(tree, "save").props.onClick(); tree = h.render();
  while (gates.length) { gates.shift().resolve(); await tick(); }
  tree = h.render();
  assert.deepEqual(seen, ["low", "low", "low"]);
  assert.equal(h.results(tree).batches[0].targets[0].settings.providerMetadata.openai.reasoning.effort, "low");
  assert.deepEqual(h.state, h.before);
  h.unmount();
});

test("unmount aborts active work and drops late callbacks; returning to the page has no retained benchmark results", async () => {
  const pending = [], h = uiHarness({ execute: async args => { const gate = deferred(); pending.push({ args, gate }); await gate.promise; args.onMetrics({ tps: 99 }); } });
  let tree = h.render(); nodes(tree, "TextArea")[0].props.onChange("Cancel me"); tree = h.render();
  h.button(tree, "ai.benchmarks.start").props.onClick(); tree = h.render();
  assert.equal(h.button(tree, "ai.benchmarks.clear").props.disabled, true);
  h.button(tree, "ai.benchmarks.clear").props.onClick(); tree = h.render();
  assert.equal(h.results(tree).runs.length, 3, "Clear must not discard an active batch");
  h.unmount(); assert.ok(pending[0].args.signal.aborted);
  pending[0].gate.resolve(); await h.executions[0].done; await tick();
  tree = h.render(); assert.equal(h.results(tree).runs.length, 0); assert.equal(h.calls.length, 1);
  assert.equal(nodes(tree, "TextArea")[0].props.value, "");
  h.unmount();
});

test("page authentication restrictions and explicit endpoint validation remain visible and never rewrite selections", () => {
  const h = uiHarness({ azure: true }); let tree = h.render();
  const route = nodes(tree, "Select").find(node => node.props.label === "ai.benchmarks.routing");
  const direct = nodes(route, "option").find(node => node.props.value === "direct");
  assert.equal(direct.props.disabled, true);
  assert.ok(nodes(tree, "Alert").some(node => node.props.children === "ai.benchmarks.azureRestriction"));
  h.unmount();
  const header = uiHarness(); tree = header.render();
  nodes(tree, "Select").find(node => node.props.label === "ai.benchmarks.routing").props.onChange("direct"); tree = header.render();
  const endpoint = nodes(tree, "Select").find(node => node.props.label === "ai.benchmarks.endpoint");
  assert.equal(endpoint.props.value, "/api/chat", "unsupported selection stays explicit, not replaced by a provider default");
  assert.equal(header.button(tree, "ai.benchmarks.start").props.disabled, true);
  nodes(tree, "ModelSelect")[0].props.onChange("missing/model"); tree = header.render();
  assert.equal(nodes(tree, "ModelSelect")[0].props.value, "missing/model");
  header.unmount();
});

test("charts contain individual reported values only, retain zeros and missing gaps, and use frozen target labels/colors", () => {
  const { benchmarkChartData, BenchmarkResults } = transpile(base + "benchmarks/BenchmarkResults.tsx", {
    "aihappey-components": themed, "aihappey-i18n": i18n,
    "../usage/UsageDashboardPrimitives": { ChartCard: "ChartCard", Grid: "Grid", Section: "Section", chartOptions: () => ({}),
      formatMetric: value => value === undefined ? "—" : String(value), tableStyle: {}, tdStyle: {}, thStyle: {} },
  });
  const first = { id: "r1", batchId: "b1", batchOrdinal: 1, targetId: "t1", targetOrdinal: 1, repetition: 1,
    status: "completed", ttft: 0, tps: 10, mode: "default", endpoint: "/api/chat", modelLabel: "Frozen name", color: "#123456" };
  const runs = [first, { ...first, id: "r2", repetition: 2, ttft: undefined, tps: undefined, status: "failed" },
    { ...first, id: "r3", batchId: "b2", batchOrdinal: 2, modelLabel: "Edited name", ttft: 2, tps: 20 }];
  const data = benchmarkChartData(runs, "ttft", run => run.modelLabel);
  assert.deepEqual(data.labels, ["1", "2"]); assert.equal(data.datasets.length, 2);
  assert.deepEqual(data.datasets[0].data, [0, null]); assert.deepEqual(data.datasets[1].data, [2, null]);
  assert.equal(data.datasets[0].label, "Frozen name"); assert.equal(data.datasets[0].borderColor, first.color);
  assert.equal(data.datasets[1].borderColor, first.color);
  const h = renderer(), tree = h.render(BenchmarkResults, { runs, batches: [] });
  assert.equal(nodes(tree, "ChartCard").length, 2); assert.equal(nodes(tree, "table").length, 1);
  assert.equal(nodes(tree, "tbody")[0].children[0].length, 3);
});

test("navigation places Benchmarks beside Usage under Artificial Intelligence and registers its dedicated page", () => {
  const sidebar = fs.readFileSync("packages/aihappey-core/src/shell/navigation/ConversationSidebar.tsx", "utf8");
  const root = fs.readFileSync("packages/aihappey-core/src/shell/CoreRoot.tsx", "utf8");
  const aiSection = sidebar.slice(sidebar.indexOf('label: t("ai.title")'), sidebar.indexOf('label: t("streaming.title")'));
  assert.ok(aiSection.indexOf('key: "benchmarks"') > aiSection.indexOf('key: "usage"'));
  assert.match(aiSection, /href: "\/benchmarks"/);
  assert.match(sidebar, /location\.pathname === "\/benchmarks"\s*\? "benchmarks"/);
  assert.match(sidebar, /id === "benchmarks"[\s\S]*?navigate\("\/benchmarks"\)/);
  assert.match(root, /path: "benchmarks", element: <BenchmarksPage \/>/);
  const strings = JSON.parse(fs.readFileSync("packages/aihappey-i18n/src/locales/en/en.json", "utf8").replace(/^\uFEFF/, ""));
  assert.equal(strings.ai.benchmarks.title, "Benchmarks");
});
