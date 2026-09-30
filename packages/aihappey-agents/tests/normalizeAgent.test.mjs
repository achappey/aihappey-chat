import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeAgent,
  setAgentElicitationEnabled,
  setAgentElicitationFormEnabled,
} from "../dist/index.js";

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

for (const elicitation of [false, true, null, ["legacy"]]) {
  test(`silently removes malformed elicitation value ${JSON.stringify(elicitation)}`, () => {
    assert.deepEqual(
      normalizeAgent(agent({ capabilities: { elicitation } })).mcpClient,
      {},
    );
  });
}

for (const elicitation of [{}, { form: {} }, { url: {} }, { form: {}, url: {} }]) {
  test(`preserves agent elicitation value ${JSON.stringify(elicitation)}`, () => {
    assert.deepEqual(
      normalizeAgent(agent({ capabilities: { elicitation } })).mcpClient,
      { capabilities: { elicitation } },
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
        elicitation: { form: {} },
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

test("agent elicitation is off by default; enabling does not enable form or URL", () => {
  const initial = agent({ policy: { readOnlyHint: true }, capabilities: { sampling: {} } });
  const enabled = setAgentElicitationEnabled(initial, true);

  assert.deepEqual(enabled.mcpClient, {
    policy: { readOnlyHint: true },
    capabilities: { sampling: {}, elicitation: {} },
  });
  assert.deepEqual(normalizeAgent(enabled).mcpClient, enabled.mcpClient);
  assert.equal(initial.mcpClient.capabilities.elicitation, undefined);
});

test("form toggle adds and removes only the form mode; URL remains untouched", () => {
  const initial = agent({
    policy: { readOnlyHint: true },
    capabilities: { elicitation: { url: {} }, sampling: {} },
  });
  const enabled = setAgentElicitationFormEnabled(initial, true);
  assert.deepEqual(enabled.mcpClient.capabilities.elicitation, { url: {}, form: {} });

  const disabled = setAgentElicitationFormEnabled(enabled, false);
  assert.deepEqual(disabled.mcpClient, initial.mcpClient);
  assert.equal(setAgentElicitationFormEnabled(agent(), true).mcpClient, undefined);
});

test("disabling elicitation removes only its capability, including form, on save", () => {
  const initial = agent({ policy: { readOnlyHint: true }, capabilities: { sampling: {} } });
  const enabled = setAgentElicitationFormEnabled(setAgentElicitationEnabled(initial, true), true);
  assert.deepEqual(enabled.mcpClient.capabilities.elicitation, { form: {} });

  const disabled = normalizeAgent(setAgentElicitationEnabled(enabled, false));
  assert.deepEqual(disabled.mcpClient, initial.mcpClient);
  assert.deepEqual(setAgentElicitationEnabled(agent(), false).mcpClient, { capabilities: undefined });
});
