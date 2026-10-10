const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");
const { readCatalog, generate, validateMetadata, parseJson } = require("../packages/aihappey-core/scripts/generate-provider-catalog.cjs");
const { moduleLoader } = require("./migrate-provider-catalog.cjs");

const root = path.resolve(__dirname, "..");
const base = "packages/aihappey-core/src/runtime/providers";
const load = moduleLoader((file) => fs.readFileSync(path.join(root, file), "utf8"));
const entries = readCatalog();
const { PROVIDER_CATALOG } = load(`${base}/catalog.generated.ts`);
const { PROVIDERS } = load(`${base}/providers.ts`);
const { PROVIDER_GATEWAY_METADATA, withProviderGatewayMetadata } = load(`${base}/gatewayMetadata.ts`);
const { withProviderIconFallbacks, buildGstaticFaviconUrl } = load(`${base}/providerIcons.ts`);

test("every indexed JSON provider is imported with identical metadata and exact registry order", () => {
  const ids = entries.map(({ id }) => id);
  assert.deepEqual(Object.keys(PROVIDER_CATALOG), ids);
  assert.deepEqual(Object.keys(PROVIDERS), ids);
  for (const { id, metadata } of entries) {
    assert.deepEqual(PROVIDER_CATALOG[id], metadata, id);
    assert.ok(!Object.hasOwn(metadata, "createGatewayMetadata"));
    const { createGatewayMetadata, ...runtime } = PROVIDERS[id];
    const expected = metadata.icons?.length || !metadata.urls?.homepage ? metadata : {
      ...metadata, icons: [{ src: buildGstaticFaviconUrl(metadata.urls.homepage) }],
    };
    assert.deepEqual(runtime, expected, `Runtime metadata for ${id}`);
    assert.equal(createGatewayMetadata, PROVIDER_GATEWAY_METADATA[id]);
  }
  assert.deepEqual(entries.find(({ id }) => id === "ai302"), {
    id: "ai302", file: "302ai.json", metadata: PROVIDER_CATALOG.ai302,
  });
  assert.equal(load(`${base}/providerMetadata.ts`).PROVIDERS, PROVIDERS);
});

test("generated imports are deterministic and up to date, and no TypeScript metadata modules remain", () => {
  const actual = fs.readFileSync(path.join(root, base, "catalog.generated.ts"), "utf8").replace(/\r\n/g, "\n");
  assert.equal(actual, generate(entries));
  assert.equal(generate(entries), generate(entries));
  const sourceFiles = fs.readdirSync(path.join(root, base, "catalog")).filter((file) => file.endsWith(".ts")).sort();
  assert.deepEqual(sourceFiles, ["pricing.generated.ts", "providerPricing.ts"]);
});

test("fallback icons preserve explicit icons, handle empty icons and never mutate source metadata", () => {
  const input = {
    explicit: { name: "Explicit", urls: { homepage: "https://example.test" }, icons: [{ src: "official", theme: "dark" }] },
    empty: { name: "Empty", urls: { homepage: "https://example.test/path?a=1&b=2" }, icons: [] },
    absent: { name: "Absent" },
  };
  const before = structuredClone(input);
  const result = withProviderIconFallbacks(input);
  assert.equal(result.explicit, input.explicit);
  assert.equal(result.absent, input.absent);
  assert.equal(result.empty.icons[0].src, "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https%3A%2F%2Fexample.test%2Fpath%3Fa%3D1%26b%3D2&size=128");
  assert.deepEqual(input, before);
});

test("handler attachment is limited to existing providers and does not mutate raw JSON", () => {
  const input = { openrouter: { name: "OpenRouter" }, custom: { name: "Custom" }, constructor: { name: "Constructor" } };
  const before = structuredClone(input);
  const result = withProviderGatewayMetadata(input);
  assert.deepEqual(Object.keys(result), ["openrouter", "custom", "constructor"]);
  assert.equal(result.openrouter.createGatewayMetadata, PROVIDER_GATEWAY_METADATA.openrouter);
  assert.equal(result.custom, input.custom);
  assert.equal(result.constructor, input.constructor);
  assert.deepEqual(input, before);
  assert.deepEqual(Object.keys(PROVIDER_GATEWAY_METADATA).sort(), ["anthropic", "deepinfra", "minimax", "moonshot", "openrouter", "requesty", "spacexai", "zai"]);
  for (const id of Object.keys(PROVIDER_GATEWAY_METADATA)) assert.ok(Object.hasOwn(PROVIDER_CATALOG, id));
});

test("response-cost handlers preserve numeric parsing, nested usage, zero cost, existing metadata and xAI scaling", () => {
  for (const [id, field, scale] of [
    ["openrouter", "cost", 1], ["requesty", "cost", 1],
    ["deepinfra", "estimated_cost", 1], ["spacexai", "cost_in_usd_ticks", 10_000_000_000],
  ]) {
    const handler = PROVIDERS[id].createGatewayMetadata;
    for (const nested of [false, true]) {
      for (const value of [0, "0", 2.5, "2.5"]) {
        const usage = { [field]: value };
        const event = nested ? { response: { usage } } : { usage };
        assert.deepEqual(handler({ event, currentGateway: { preserved: true, cost: 999 } }), { preserved: true, cost: Number(value) / scale });
      }
    }
    for (const value of [undefined, null, "invalid", Infinity, NaN, true]) {
      assert.equal(handler({ event: { usage: { [field]: value } } }), undefined);
    }
    assert.equal(handler({ event: {} }), undefined);
  }
});

test("pricing handlers retain direct-endpoint gating and per-provider pricing/cache accounting", () => {
  const catalogs = load(`${base}/catalog/pricing.generated.ts`).PROVIDER_PRICING_CATALOGS;
  for (const id of ["anthropic", "minimax", "moonshot", "zai"]) {
    const [model, entry] = Object.entries(catalogs[id]).find(([, entry]) => entry.pricing);
    const pricing = entry.pricing;
    const usage = { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 100, cache_creation_input_tokens: 50 };
    const expected = 1000 * Number(pricing.input) + 500 * Number(pricing.output)
      + (pricing.input_cache_read === undefined ? 0 : 100 * Number(pricing.input_cache_read))
      + (pricing.input_cache_write === undefined ? 0 : 50 * Number(pricing.input_cache_write));
    const handler = PROVIDERS[id].createGatewayMetadata;
    const context = { event: { usage }, requestModel: model, currentGateway: { preserved: true } };
    assert.equal(handler(context), undefined);
    assert.equal(handler({ ...context, directProviderEndpoint: false }), undefined);
    for (const event of [{ usage }, { message: { usage } }, { response: { usage } }, { conversation: { usage } }, { interaction: { usage } }, { metadata: { total_usage: usage } }]) {
      assert.deepEqual(handler({ ...context, event, directProviderEndpoint: true }), { preserved: true, cost: expected });
    }
    assert.equal(handler({ ...context, requestModel: "unknown-model", directProviderEndpoint: true }), undefined);
    assert.equal(handler({ ...context, event: {}, directProviderEndpoint: true }), undefined);
  }
});

test("custom providers still override defaults without changing the built-in registry", () => {
  const file = `${base}/useProviderRegistry.ts`;
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mocks = { react: {}, "aihappey-state": {}, "./providerMetadata": { PROVIDERS } };
  const module = { exports: {} };
  new Function("require", "module", "exports", output)((id) => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id}`);
    return mocks[id];
  }, module, module.exports);
  const { getProviderRegistry } = module.exports;
  const override = { name: "Custom OpenAI", apiBaseUrl: "https://custom.test", createGatewayMetadata: () => ({ cost: 1 }) };
  const additional = { name: "Added provider" };
  const result = getProviderRegistry({ openai: override, added: additional });
  assert.equal(result.openai, override);
  assert.equal(result.added, additional);
  assert.notEqual(PROVIDERS.openai, override);
  assert.ok(!Object.hasOwn(PROVIDERS, "added"));
  assert.deepEqual(Object.keys(result), [...Object.keys(PROVIDERS), "added"]);
  assert.deepEqual(getProviderRegistry(), PROVIDERS);
});

function withFixture(t, index, metadata = { name: "Example" }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aihappey-provider-catalog-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, "index.json"), JSON.stringify(index));
  fs.writeFileSync(path.join(directory, "example.json"), JSON.stringify(metadata));
  return directory;
}

test("index validation rejects duplicates, traversal, missing files, unindexed files and invalid metadata", (t) => {
  const entry = { id: "example", file: "example.json" };
  const valid = withFixture(t, [entry]);
  assert.equal(readCatalog(valid).length, 1);
  assert.throws(() => readCatalog(withFixture(t, [entry, entry])), /Duplicate provider ID/);
  assert.throws(() => readCatalog(withFixture(t, [entry, { id: "other", file: "example.json" }])), /Duplicate provider file/);
  assert.throws(() => readCatalog(withFixture(t, [{ id: "example", file: "../example.json" }])), /local JSON filename/);
  assert.throws(() => readCatalog(withFixture(t, [{ id: "example", file: "missing.json" }])), /ENOENT/);
  assert.throws(() => readCatalog(withFixture(t, [{ ...entry, ignored: true }])), /only id and file/);
  fs.writeFileSync(path.join(valid, "unindexed.json"), '{"name":"Unindexed"}');
  assert.throws(() => readCatalog(valid), /Unindexed or missing/);
  for (const metadata of [{}, { name: "X", category: "invalid" }, { name: "X", icons: [{ src: "url", theme: "invalid" }] }, { name: "X", createGatewayMetadata: "function" }, { name: "X", experimental: "false" }]) {
    assert.throws(() => readCatalog(withFixture(t, [entry], metadata)), /Invalid provider metadata/);
  }
});

test("schema is strict JSON with no silently discarded duplicate fields, comments or trailing commas", () => {
  for (const text of ['{"name":"A","name":"B"}', '{"urls":{"homepage":"A","homepage":"B"}}', '{"name":"A",}', '{/*comment*/"name":"A"}']) {
    assert.throws(() => parseJson(text, "example.json"));
  }
  assert.deepEqual(parseJson('{"name":"Example"}', "example.json"), { name: "Example" });
  validateMetadata({ name: "Example", icons: [{ src: "url", sizes: ["any"], mimeType: "image/svg+xml", theme: "dark" }] }, "example.json");
});
