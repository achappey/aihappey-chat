import assert from "node:assert/strict";
import { test } from "node:test";
import { modelCacheScope, readModelSnapshot, isCatalogResponse } from "../dist/index.js";

test("versioned snapshots preserve complete model JSON and distinguish an empty catalog from a miss", () => {
  const snapshot = { version: 1, sources: { gateway: { updatedAt: 123,
    response: { object: "list", future: true, data: [{ id: "p/model", type: "language", pricing: { future: 7 }, future: { nested: [1, 2] } }] } } } };
  assert.deepEqual(readModelSnapshot(JSON.parse(JSON.stringify(snapshot))), snapshot);
  assert.ok(readModelSnapshot({ version: 1, sources: { gateway: { updatedAt: 0, response: { data: [] } } } }));
  for (const value of [undefined, [], {}, { ...snapshot, version: 2 }, { version: 1, sources: [] },
    { version: 1, sources: { gateway: { updatedAt: 1, response: { data: [{ id: "" }] } } } }]) {
    assert.equal(readModelSnapshot(value), undefined);
  }
  assert.equal(isCatalogResponse({}), false);
});

test("scope is stable and isolated without exposing credentials or waiting for a token", async () => {
  const context = { endpoint: "https://gateway.test/v1/models", authenticated: false, gatewayEnabled: true,
    headers: { "X-Key": "secret", "X-Other": "other" }, providers: { p: { apiBaseUrl: "https://p.test" } } };
  const scope = await modelCacheScope(context);
  assert.match(scope, /^[a-f0-9]{64}$/);
  assert.equal(scope, await modelCacheScope({ ...context, headers: { "x-other": "other", "x-key": "secret" } }));
  for (const change of [{ endpoint: "https://other.test" }, { headers: { "X-Key": "new" } }, { gatewayEnabled: false },
    { providers: { p: { apiBaseUrl: "https://other.test" } } }, { authenticated: true, identity: "tenant/account" }]) {
    assert.notEqual(scope, await modelCacheScope({ ...context, ...change }));
  }
  assert.equal(await modelCacheScope({ ...context, authenticated: true }), undefined);
  const signedIn = { ...context, authenticated: true, identity: "tenant/account" };
  assert.notEqual(await modelCacheScope(signedIn), await modelCacheScope({ ...signedIn, identity: "tenant/other" }));
});
