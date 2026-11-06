const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { DefaultChatTransport } = require('ai');
const { Chat } = require('@ai-sdk/react');

const base = 'packages/aihappey-core/src/features/';
function harness() {
  const clock = { time: 1000, calls: [], now() { this.calls.push(this.time); return this.time; } };
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} }; cache.set(file, module.exports);
    new Function('require', 'module', 'exports', 'performance', output)(id => {
      if (id === 'aihappey-ai') return { DefaultChatTransport };
      if (id === 'aihappey-types') return { SYSTEM_ROLE: 'system' };
      if (id === 'aihappey-components') return { canonicalizeAnthropicTools: value => value };
      if (!id.startsWith('.')) return require(id);
      const target = path.resolve(path.dirname(file), id);
      return load(['.ts', '.tsx', '/index.ts'].map(ext => target + ext).find(p => fs.existsSync(p)));
    }, module, module.exports, clock);
    cache.set(file, module.exports); return module.exports;
  }
  const api = load(base + 'chat/engine/genericChatEndpoint.ts');
  return { clock, load, ...api };
}

// A zero-size queue ensures the next event cannot advance the clock before the
// adapter has processed the previous event. No wall-clock waits or global mocks.
function nativeResponse(clock, events, { fragment = Infinity, onCancel } = {}) {
  let index = 0, bytes, offset = 0;
  return new Response(new ReadableStream({
    pull(controller) {
      if (!bytes || offset >= bytes.length) {
        if (index === events.length) { controller.close(); return; }
        const [at, event, eventName] = events[index++];
        clock.time = at;
        const raw = typeof event === 'string' ? event : JSON.stringify(event);
        bytes = new TextEncoder().encode((eventName ? `event: ${eventName}\r\n` : '') + `data: ${raw}\r\n\r\n`);
        offset = 0;
      }
      controller.enqueue(bytes.slice(offset, offset + fragment));
      offset += fragment;
    },
    cancel: onCancel,
  }, { highWaterMark: 0 }), { headers: { 'Content-Type': 'text/event-stream' } });
}
const textEvent = text => ({ object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: text } }] });
const reasoningEvent = text => ({ object: 'chat.completion.chunk', choices: [{ index: 0, delta: { reasoning_content: text } }] });
const usageEvent = (tokens = 100, metadata) => ({ usage: { prompt_tokens: 9, completion_tokens: tokens }, metadata, choices: [] });
const finishChunk = chunks => chunks.findLast(chunk => chunk.type === 'finish');
const gateway = chunks => finishChunk(chunks)?.messageMetadata?.providerMetadata?.gateway;
async function wrappedChunks(h, endpoint, events, options = {}) {
  const fetcher = h.wrapGenericChatFetch({ endpoint, providerKey: 'testprovider', ...options,
    fetcher: options.fetcher ?? (async () => {
      assert.equal(h.clock.time, 1000, 'dispatch timing must precede awaiting response headers');
      h.clock.time = 2000;
      return nativeResponse(h.clock, events, options);
    }),
  });
  const response = await fetcher(`https://provider.test${endpoint}`, {
    body: JSON.stringify({ model: 'native-model' }),
  });
  return (await response.text()).split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)));
}
async function drain(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}

for (const endpoint of ['/v1/chat/completions', '/paas/v4/chat/completions', '/v1/openai/chat/completions', '/chat/completions']) {
  test(`${endpoint}: delayed headers, empty output and late usage use dispatch-to-output TTFT and generation-only TPS`, async () => {
    const h = harness();
    const chunks = await wrappedChunks(h, endpoint, [
      [2100, { choices: [{ delta: { role: 'assistant' } }] }], [2200, ': keepalive'],
      [2300, textEvent('')], [3000, textEvent('Hello')],
      [5000, { choices: [{ delta: {}, finish_reason: 'stop' }] }],
      [6000, usageEvent()], [8000, '[DONE]'],
    ], { fragment: 7 });
    assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20 });
    assert.deepEqual(h.clock.calls, [1000, 3000, 8000]);
    assert.equal(finishChunk(chunks).messageMetadata.usage.completionTokens, 100);
    assert.deepEqual(finishChunk(chunks).messageMetadata.providerMetadata.testprovider.usage, usageEvent().usage);
  });
}

test('Chat Completions reasoning and named tool calls count as output before answer text', async () => {
  for (const first of [reasoningEvent('Thinking'), {
    choices: [{ delta: { tool_calls: [{ id: 'call', index: 0, function: { name: 'lookup', arguments: '' } }] } }],
  }]) {
    const h = harness();
    const chunks = await wrappedChunks(h, '/v1/chat/completions', [
      [3000, first], [5000, textEvent('Answer')], [7000, usageEvent()], [8000, '[DONE]'],
    ]);
    assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20 });
  }
});

test('Messages merges partial usage snapshots and starts at genuine thinking, not block or message lifecycle', async () => {
  const h = harness();
  const chunks = await wrappedChunks(h, '/v1/messages', [
    [2100, { type: 'message_start', message: { id: 'msg', model: 'native-model', usage: { input_tokens: 9, output_tokens: 0 } } }],
    [2200, { type: 'ping' }],
    [2300, { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } }],
    [2400, { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: '' } }],
    [3000, { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'Thinking' } }],
    [4000, { type: 'content_block_stop', index: 0 }],
    [7000, { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 100 } }],
    [8000, { type: 'message_stop' }],
  ], { fragment: 5 });
  assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20 });
  assert.deepEqual(finishChunk(chunks).messageMetadata.usage, { promptTokens: 9, completionTokens: 100, totalTokens: 109 });
});

test('Responses ignores lifecycle and empty reasoning; named function calls start the clock before arguments', async () => {
  const h = harness();
  const item = { type: 'function_call', id: 'fc', call_id: 'call', name: 'lookup', arguments: '' };
  const chunks = await wrappedChunks(h, '/v1/responses', [
    [2100, { type: 'response.created', response: { model: 'native-model' } }],
    [2200, { type: 'response.output_item.added', item: { type: 'reasoning', id: 'r' } }],
    [2300, { type: 'response.reasoning_text.delta', item_id: 'r', delta: '' }],
    [3000, { type: 'response.output_item.added', item }],
    [4000, { type: 'response.function_call_arguments.delta', item_id: 'fc', delta: '{}' }],
    [5000, { type: 'response.output_item.done', item: { ...item, status: 'completed', arguments: '{}' } }],
    [8000, { type: 'response.completed', response: { status: 'completed', usage: { input_tokens: 9, output_tokens: 100 }, output: [] } }],
    [9000, '[DONE]'],
  ]);
  assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20 });
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-available').length, 1);
  assert.equal(chunks.filter(chunk => chunk.type === 'finish').length, 1);
});

test('Interactions uses generated thought summaries and reported total output usage', async () => {
  const h = harness();
  const chunks = await wrappedChunks(h, '/v1beta/interactions', [
    [2100, { interaction: { model: 'native-model' } }, 'interaction.created'],
    [2200, { index: 0, step: { type: 'thought' } }, 'step.start'],
    [2300, { index: 0, delta: { type: 'thought_signature', signature: 'opaque' } }, 'step.delta'],
    [3000, { index: 0, delta: { type: 'thought_summary', text: 'Thinking' } }, 'step.delta'],
    [8000, { interaction: { usage: { total_input_tokens: 9, total_output_tokens: 100 }, steps: [] } }, 'interaction.completed'],
  ]);
  assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20 });
});

test('Conversations excludes response-start events and uses its final aggregated usage', async () => {
  const h = harness();
  const chunks = await wrappedChunks(h, '/v1/conversations', [
    [2100, { type: 'conversation.response.started' }],
    [2200, { type: 'message.output.delta', content: '' }],
    [3000, { type: 'message.output.delta', content: 'Hello' }],
    [8000, { type: 'conversation.response.done', metadata: { total_usage: { input_tokens: 9, output_tokens: 100 } } }],
  ]);
  assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20 });
});

test('Agents excludes synthesized async-status text but includes actual thinking output', async () => {
  const h = harness();
  const chunks = await wrappedChunks(h, '/v1/agents', [
    [2100, { agent_id: 'agent', async_id: 'async', status: 'created' }],
    [2200, { agent_id: 'agent', choices: [{ delta: { phase: 'thinking', content: '' } }] }],
    [3000, { agent_id: 'agent', choices: [{ delta: { phase: 'thinking', content: 'Thinking' } }] }],
    [8000, { agent_id: 'agent', usage: { completion_tokens: 100 }, choices: [{ delta: { content: 'Answer' }, finish_reason: 'stop' }] }],
  ]);
  assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20 });
  assert.ok(chunks.some(chunk => chunk.delta?.includes('Z.AI agent status:')));
});

test('empty/status-only streams have no metrics and missing output usage has TTFT only', async () => {
  for (const events of [
    [[3000, textEvent('')], [8000, '[DONE]']],
    [[3000, textEvent('Answer')], [8000, '[DONE]']],
    [[3000, textEvent('Answer')], [7000, { usage: { total_tokens: 100 } }], [8000, '[DONE]']],
  ]) {
    const h = harness();
    const chunks = await wrappedChunks(h, '/v1/chat/completions', events);
    assert.deepEqual(gateway(chunks), events[0][1].choices[0].delta.content ? { ttft: 2 } : undefined);
  }
  const h = harness();
  const chunks = await wrappedChunks(h, '/v1/agents', [[3000, { agent_id: 'a', status: 'created' }]]);
  assert.equal(gateway(chunks), undefined);
});

test('zero tokens are valid, invalid usage and zero-duration generation never invent a rate', async () => {
  for (const [tokens, completedAt, expected] of [
    [0, 8000, { ttft: 2, tps: 0 }], [100, 3000, { ttft: 2 }],
    [-1, 8000, { ttft: 2 }], ['invalid', 8000, { ttft: 2 }], [null, 8000, { ttft: 2 }],
  ]) {
    const h = harness();
    const chunks = await wrappedChunks(h, '/v1/chat/completions', [
      [3000, textEvent('Answer')], [completedAt, usageEvent(tokens)], [completedAt, '[DONE]'],
    ]);
    assert.deepEqual(gateway(chunks), expected);
  }
});

test('upstream performance values take precedence independently and provider cost hooks/raw usage survive', async () => {
  for (const upstream of [{ cost: 0.2 }, { cost: 0.2, ttft: 0 }, { cost: 0.2, tps: 0 }, { cost: 0.2, ttft: 9, tps: 99 }]) {
    const h = harness();
    const chunks = await wrappedChunks(h, '/v1/chat/completions', [
      [3000, textEvent('Answer')], [7000, usageEvent(100, { gateway: upstream })], [8000, '[DONE]'],
    ], { providers: { testprovider: { createGatewayMetadata: ({ currentGateway }) => ({ ...currentGateway, providerCost: 'preserved' }) } } });
    assert.deepEqual(gateway(chunks), { ttft: 2, tps: 20, ...upstream, providerCost: 'preserved' });
    assert.deepEqual(upstream.cost, 0.2);
  }
  const h = harness();
  const upstream = { cost: 0.2, ttft: -1, tps: 'invalid' };
  const chunks = await wrappedChunks(h, '/v1/chat/completions', [
    [3000, textEvent('Answer')], [7000, usageEvent(100, { gateway: upstream })], [8000, '[DONE]'],
  ]);
  assert.deepEqual(gateway(chunks), { cost: 0.2, ttft: 2, tps: 20 });
  assert.deepEqual(upstream, { cost: 0.2, ttft: -1, tps: 'invalid' });
});

test('gateway protocol adapters never add local timings, with or without upstream metrics', async () => {
  for (const upstream of [undefined, { cost: 0.2, ttft: 7, tps: 70 }]) {
    const h = harness();
    const chunks = await wrappedChunks(h, '/v1/chat/completions', [
      [3000, textEvent('Answer')], [7000, usageEvent(100, upstream && { gateway: upstream })], [8000, '[DONE]'],
    ], { providerKey: undefined });
    assert.deepEqual(gateway(chunks), upstream);
    assert.deepEqual(h.clock.calls, []);
  }
});

test('real SDK transport captures dispatch before headers and exposes the same metrics to display and analytics', async () => {
  const h = harness();
  const transport = new h.GenericChatEndpointTransport('/v1/chat/completions', 'testprovider', undefined, {
    api: 'https://provider.test/v1/chat/completions', fetch: async () => {
      assert.deepEqual(h.clock.calls, [1000]);
      h.clock.time = 2000;
      return nativeResponse(h.clock, [[3000, reasoningEvent('Thinking')], [4000, textEvent('Answer')], [7000, usageEvent()], [8000, '[DONE]']]);
    },
  });
  const errors = [], chat = new Chat({ transport, onError: error => errors.push(error) });
  await chat.sendMessage({ text: 'Hello' });
  assert.deepEqual(errors, []);
  const message = chat.messages.at(-1);
  assert.deepEqual(message.metadata.providerMetadata.gateway, { ttft: 2, tps: 20 });
  const { toChatMessages } = h.load(base + 'chat/messages/toChatMessages.ts');
  const display = toChatMessages([message]);
  assert.ok(display.length >= 2);
  assert.ok(display.every(part => part.ttft === 2 && part.tps === 20));
  const { buildUsageAnalytics } = h.load(base + 'usage/usageAnalytics.ts');
  const facts = buildUsageAnalytics({ conversations: [{ id: 'conversation', messages: [message] }] }).messageFacts;
  assert.equal(facts[0].ttft, 2);
  assert.equal(facts[0].tps, 20);
});

test('concurrent requests on one transport retain dispatch timing for their own response streams', async () => {
  const h = harness();
  let resolveFirst;
  const firstResponse = new Promise(resolve => { resolveFirst = resolve; });
  let calls = 0;
  const transport = new h.GenericChatEndpointTransport('/v1/chat/completions', 'testprovider', undefined, {
    api: 'https://provider.test/v1/chat/completions', fetch: async () => {
      if (++calls === 1) return firstResponse;
      return nativeResponse(h.clock, [[3000, textEvent('Second')], [7000, usageEvent()], [8000, '[DONE]']]);
    },
  });
  const send = id => transport.sendMessages({ chatId: id, trigger: 'submit-message', messages: [] });
  const first = send('first');
  while (calls < 1) await new Promise(resolve => setImmediate(resolve));
  h.clock.time = 2000;
  const second = await drain(await send('second'));
  assert.deepEqual(gateway(second), { ttft: 1, tps: 20 });
  resolveFirst(nativeResponse(h.clock, [[9000, textEvent('First')], [13000, usageEvent(50)], [14000, '[DONE]']]));
  const firstChunks = await drain(await first);
  assert.deepEqual(gateway(firstChunks), { ttft: 8, tps: 10 });
});

test('real SDK client-tool continuation uses new request timings, not tool execution time or accumulated rates', async () => {
  const h = harness();
  const { createClientToolContinuation } = h.load(base + 'chat/engine/clientToolContinuation.ts');
  const guard = createClientToolContinuation();
  let requests = 0, chat;
  const start = { type: 'message_start', message: { id: 'msg', model: 'native-model', usage: { input_tokens: 9 } } };
  const end = (reason, tokens) => [
    [h.clock.time + 1000, { type: 'message_delta', delta: { stop_reason: reason }, usage: { output_tokens: tokens } }],
    [h.clock.time + 2000, { type: 'message_stop' }],
  ];
  const transport = new h.GenericChatEndpointTransport('/v1/messages', 'testprovider', undefined, {
    api: 'https://provider.test/v1/messages', fetch: async () => {
      if (++requests === 1) return nativeResponse(h.clock, [
        [2000, start], [3000, { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'call', name: 'lookup', input: {} } }],
        [4000, { type: 'content_block_stop', index: 0 }],
        [5000, { type: 'message_delta', delta: { stop_reason: 'tool_use' }, usage: { output_tokens: 30 } }],
        [6000, { type: 'message_stop' }],
      ]);
      assert.equal(requests, 2);
      assert.equal(h.clock.time, 16000);
      return nativeResponse(h.clock, [
        [17000, start], [18000, { type: 'content_block_start', index: 0, content_block: { type: 'text', text: 'Answer' } }],
        [19000, { type: 'content_block_stop', index: 0 }], ...end('end_turn', 60),
      ].sort((a, b) => a[0] - b[0]));
    },
  });
  const errors = [];
  chat = new Chat({ transport, onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options),
    onToolCall: ({ toolCall }) => {
      h.clock.time = 16000;
      chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } });
    },
  });
  await chat.sendMessage({ text: 'Lookup' });
  assert.deepEqual(errors, []);
  assert.equal(requests, 2);
  assert.equal(chat.messages.filter(message => message.role === 'assistant').length, 1);
  assert.equal(chat.messages.at(-1).metadata.providerMetadata.gateway.ttft, 2);
  assert.deepEqual(h.clock.calls.slice(0, 3), [1000, 3000, 6000]);
});

test('failed or incomplete streams do not manufacture successful throughput; HTTP failures pass through', async () => {
  for (const [endpoint, events] of [
    ['/v1/responses', [[3000, { type: 'response.output_text.delta', delta: 'Answer' }], [8000, { type: 'response.failed', response: { usage: { output_tokens: 100 } } }]]],
    ['/v1/messages', [[3000, { type: 'message_start', message: { usage: { output_tokens: 100 } } }], [8000, { type: 'error', error: { message: 'Failure' } }]]],
    ['/v1/conversations', [[3000, { type: 'message.output.delta', content: 'Answer' }], [8000, { type: 'conversation.response.error', message: 'Failure', usage: { output_tokens: 100 } }]]],
    ['/v1/agents', [[3000, { choices: [{ delta: { content: 'Answer' } }] }], [8000, { error: { message: 'Failure' }, usage: { output_tokens: 100 } }]]],
    ['/v1beta/interactions', [[3000, { type: 'step.delta', delta: { type: 'text', text: 'Answer' } }], [8000, { object: 'interaction', status: 'incomplete', usage: { total_output_tokens: 100 } }]]],
  ]) {
    const h = harness();
    const chunks = await wrappedChunks(h, endpoint, events);
    assert.equal(gateway(chunks)?.tps, undefined, endpoint);
  }
  const h = harness(), original = new Response('diagnostic', { status: 429 });
  const fetcher = h.wrapGenericChatFetch({ endpoint: '/v1/responses', providerKey: 'testprovider', fetcher: async () => original });
  assert.equal(await fetcher('https://provider.test/v1/responses'), original);
  assert.equal(await original.text(), 'diagnostic');
});

test('cancelling direct streaming cancels upstream without finalizing metrics', async () => {
  const h = harness();
  let upstream, cancelled = false;
  const source = new ReadableStream({ start(controller) { upstream = controller; }, cancel() { cancelled = true; } });
  const fetcher = h.wrapGenericChatFetch({ endpoint: '/v1/chat/completions', providerKey: 'testprovider', fetcher: async () => new Response(source) });
  const reader = (await fetcher('https://provider.test/v1/chat/completions')).body.getReader();
  h.clock.time = 3000;
  upstream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(textEvent('Answer'))}\n\n`));
  await reader.read();
  await reader.cancel();
  assert.equal(cancelled, true);
  assert.deepEqual(h.clock.calls, [1000, 3000]);
});

test('the request tracker accepts true zero TTFT, rejects nonfinite values, and finalizes only once', () => {
  const h = harness();
  const { createDirectChatPerformance } = h.load(base + 'chat/engine/directChatPerformance.ts');
  for (const invalid of [undefined, null, NaN, Infinity, -1, '100']) {
    h.clock.time = 1000;
    const tracker = createDirectChatPerformance(() => h.clock.time);
    tracker.observe({ type: 'text-delta', delta: 'Answer' });
    h.clock.time = 2000;
    tracker.complete(invalid);
    h.clock.time = 9000;
    tracker.complete(100);
    assert.deepEqual(tracker.gatewayMetadata(undefined), { ttft: 0 });
  }
});
