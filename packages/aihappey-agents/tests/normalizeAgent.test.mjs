import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAgent } from "../dist/index.js";

const agent = (mcpClient) => ({
  name: "compatibility-test",
  description: "Compatibility test agent",
  instructions: "Test legacy imports",
  model: { id: "test/model" },
  ...(mcpClient === undefined ? {} : { mcpClient }),
});

test("leaves agents without MCP client capabilities valid", () => {
  assert.equal(normalizeAgent(agent()).mcpClient, undefined);
  assert.deepEqual(normalizeAgent(agent({ policy: { readOnlyHint: true } })).mcpClient, {
    policy: { readOnlyHint: true },
  });
});

for (const elicitation of [false, true, null, {}, { form: {} }, ["legacy"]]) {
  test(`silently removes legacy elicitation value ${JSON.stringify(elicitation)}`, () => {
    assert.deepEqual(
      normalizeAgent(agent({ capabilities: { elicitation } })).mcpClient,
      {},
    );
  });
}

test("preserves unrelated current and future capability keys", () => {
  assert.deepEqual(
    normalizeAgent(agent({
      policy: { openWorldHint: true },
      capabilities: {
        elicitation: { form: {} },
        sampling: { context: true },
        futureCapability: false,
      },
    })).mcpClient,
    {
      policy: { openWorldHint: true },
      capabilities: {
        sampling: { context: true },
        futureCapability: false,
      },
    },
  );
});

test("does not throw when an old import contains malformed MCP client data", () => {
  assert.doesNotThrow(() => normalizeAgent(agent({ capabilities: "legacy" })));
  assert.doesNotThrow(() => normalizeAgent(agent(null)));
});
