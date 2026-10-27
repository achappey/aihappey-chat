import assert from "node:assert/strict";
import test from "node:test";
import * as agents from "aihappey-agents";

test("plain Node loads the built public entry and its runtime dependencies", () => {
  for (const name of [
    "IndexedDBAgentStore", "resolveAgentHydration",
    "normalizeAgent", "normalizeAgentProviderHeaders",
    "setAgentElicitationEnabled", "setAgentElicitationFormEnabled",
  ]) {
    assert.equal(typeof agents[name], "function", name);
  }
  assert.ok(agents.localAgentStore instanceof agents.IndexedDBAgentStore);
  const model = { id: "openai/test" };
  const result = agents.resolveAgentHydration({
    defaults: [{ name: " public-export ", models: [model, model] }],
  });
  assert.equal(result.source, "defaults");
  assert.equal(result.agents[0].name, "public-export");
  assert.deepEqual(result.agents[0].models, [{ ...model, providerHeaders: undefined }]);
});
