const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { DefaultChatTransport } = require('ai');
const { Chat } = require('@ai-sdk/react');

const base = 'packages/aihappey-core/src/features/chat/engine/';
function load(file, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} }; cache.set(file, module.exports);
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'aihappey-ai') return { DefaultChatTransport };
    if (id === 'aihappey-components') return { canonicalizeAnthropicTools: value => value };
    if (id === '../../playground/playgroundChat') return { extractPlaygroundStreamText: () => '' };
    if (!id.startsWith('.')) return require(id);
    const target = path.resolve(path.dirname(file), id);
    const resolved = ['', '.ts', '.tsx', '/index.ts'].map(ext => target + ext).find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    return load(resolved, cache);
  }, module, module.exports);
  cache.set(file, module.exports); return module.exports;
}
const { GenericChatEndpointTransport, wrapGenericChatFetch } = load(base + 'genericChatEndpoint.ts');
const { buildMessagesBody } = load(base + 'genericEndpointMappers/messagesMapper.ts');
const clone = value => JSON.parse(JSON.stringify(value));
const call = (id, name = 'local_conversations_list_all', input = {}) => ({ type: 'tool_use', id, name, input });
const start = { type: 'message_start', message: { id: 'msg_native', model: 'claude-test', role: 'assistant', content: [], usage: { input_tokens: 42, output_tokens: 0 } } };
const blockStart = (index, content_block) => ({ type: 'content_block_start', index, content_block });
const delta = (index, delta) => ({ type: 'content_block_delta', index, delta });
const stop = index => ({ type: 'content_block_stop', index });
const end = (stop_reason = 'end_turn') => [
  { type: 'message_delta', delta: { stop_reason }, usage: { output_tokens: 20 } }, { type: 'message_stop' },
];
const text = (index, value) => [blockStart(index, { type: 'text', text: '' }), delta(index, { type: 'text_delta', text: value }), stop(index)];
const thinking = (index, value, signature = 'signed-thinking') => [
  blockStart(index, { type: 'thinking', thinking: '', signature: '' }),
  delta(index, { type: 'thinking_delta', thinking: value }), delta(index, { type: 'signature_delta', signature }), stop(index),
];
const tool = (index, item) => [
  blockStart(index, { ...item, input: {} }), delta(index, { type: 'input_json_delta', partial_json: JSON.stringify(item.input) }), stop(index),
];
function nativeResponse(events, { fragment = 7, appendDone = false } = {}) {
  const bytes = new TextEncoder().encode(events.map(event => 'event: ' + event.type + '\r\ndata: ' + JSON.stringify(event) + '\r\n\r\n').join('') + (appendDone ? 'data: [DONE]\r\n\r\n' : ''));
  return new Response(new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += fragment) controller.enqueue(bytes.slice(i, i + fragment));
    controller.close();
  } }), { headers: { 'Content-Type': 'text/event-stream' } });
}
async function chunksFor(events, options = {}) {
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/messages', providerKey: 'anthropic',
    fetcher: async () => nativeResponse(events, options) });
  const response = await fetcher('https://provider.test/v1/messages', { body: JSON.stringify({ model: 'anthropic/claude-test' }) });
  return (await response.text()).split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)));
}

for (const route of ['gateway', 'direct']) test(`real SDK ${route} Messages runs local and MCP tools through signed thinking to a final answer without duplicating history`, async () => {
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const guard = createClientToolContinuation();
  const a = call('toolu_local'), b = call('toolu_mcp', 'mcp_lookup', { query: 'chosen' });
  const requests = [], executions = [], errors = [];
  const url = `https://${route}.test/v1/messages`;
  const transport = new GenericChatEndpointTransport('/v1/messages', route === 'direct' ? 'anthropic' : undefined, undefined, {
    api: url, headers: route === 'direct' ? { 'x-api-key': 'native-key' } : { Authorization: 'Bearer gateway-token' },
    prepareSendMessagesRequest: ({ messages, headers }) => ({ headers, body: buildMessagesBody({
      model: route === 'direct' ? 'claude-test' : 'anthropic/claude-test', providerRequestConfigProviderKey: 'anthropic',
      providerMetadata: { anthropic: {} }, maxOutputTokens: 4096, messages,
      tools: [a, b].map(item => ({ name: item.name, inputSchema: { type: 'object' } })),
    }) }),
    fetch: async (input, init) => {
      assert.equal(input, url);
      assert.equal(new Headers(init.headers).get(route === 'direct' ? 'x-api-key' : 'Authorization'), route === 'direct' ? 'native-key' : 'Bearer gateway-token');
      const request = JSON.parse(init.body); requests.push(request);
      assert.ok(requests.length <= 3, 'must not continue after the final answer');
      if (requests.length === 1) return nativeResponse([start, ...thinking(0, ''), { type: 'ping' },
        blockStart(1, a), delta(1, { type: 'input_json_delta', partial_json: '' }), stop(1), ...end('tool_use')]);
      if (requests.length === 2) return nativeResponse([start, ...thinking(0, 'Next step.'), ...text(1, 'Checking next.'), ...tool(2, b), ...end('tool_use')]);
      const blocks = request.messages.flatMap(message => message.content);
      assert.deepEqual(blocks.filter(block => block.type === 'tool_use').map(block => block.id), [a.id, b.id]);
      assert.deepEqual(blocks.filter(block => block.type === 'tool_result').map(block => block.tool_use_id), [a.id, b.id]);
      assert.equal(blocks.find(block => block.type === 'thinking').signature, 'signed-thinking');
      return nativeResponse([start, ...thinking(0, 'Finished.'), ...text(1, 'All done.'), ...end()]);
    },
  }, 'anthropic/claude-test');
  let chat;
  chat = new Chat({ transport, onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options),
    onToolCall: ({ toolCall }) => {
      executions.push(clone(toolCall));
      chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } });
    } });
  await chat.sendMessage({ text: 'List and look up the chosen conversation.' });
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 3);
  assert.deepEqual(executions.map(item => item.toolCallId), [a.id, b.id]);
  assert.equal(chat.messages.filter(message => message.role === 'assistant').length, 1);
  assert.equal(chat.messages.at(-1).parts.filter(part => part.type === 'text').map(part => part.text).join(''), 'Checking next.All done.');
  assert.deepEqual(chat.messages.at(-1).parts.filter(part => part.type === 'reasoning').map(part => part.text), ['', 'Next step.', 'Finished.']);
});

test('Messages stream terminates at message_stop, marks tool calls, and merges usage updates', async () => {
  const chunks = await chunksFor([start, ...tool(0, call('toolu_one')), ...end('tool_use')]);
  assert.equal(chunks[0].type, 'start');
  assert.equal(chunks[1].type, 'start-step');
  assert.equal(chunks.find(chunk => chunk.type === 'finish').finishReason, 'tool-calls');
  assert.deepEqual(chunks.find(chunk => chunk.type === 'finish').messageMetadata.usage, { promptTokens: 42, completionTokens: 20, totalTokens: 62 });
});

test('Messages inputs are correlated by block index, parsed only at that block stop, and emitted exactly once', async () => {
  const a = call('toolu_a', 'local_lookup', { query: 'A' }), b = call('toolu_b', 'mcp_lookup', { query: 'B' });
  const events = [start, blockStart(0, a), blockStart(1, b),
    delta(0, { type: 'input_json_delta', partial_json: '{"query":' }),
    // This unrelated text block must not finalize either unfinished call.
    ...text(2, 'Checking.'),
    delta(1, { type: 'input_json_delta', partial_json: '{"query":"B"}' }), stop(1), stop(1),
    delta(0, { type: 'input_json_delta', partial_json: '"A"}' }), stop(0), stop(0),
    ...end('tool_use')];
  const chunks = await chunksFor(events, { fragment: 1 });
  const calls = chunks.filter(chunk => chunk.type === 'tool-input-available');
  assert.deepEqual(calls.map(chunk => [chunk.toolCallId, chunk.toolName, chunk.input]), [[b.id, b.name, b.input], [a.id, a.name, a.input]]);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-start').length, 2);
  assert.equal(chunks.filter(chunk => chunk.type === 'text-end').length, 1);
  assert.ok(chunks.findIndex(chunk => chunk.type === 'text-end') < chunks.findIndex(chunk => chunk.type === 'tool-input-available'));
});

test('Messages permits parameterless tools and complete initial input snapshots without JSON deltas', async () => {
  const chunks = await chunksFor([start, blockStart(0, call('toolu_empty')), stop(0),
    blockStart(1, call('toolu_snapshot', 'mcp_lookup', { query: 'initial' })), stop(1), ...end('tool_use')]);
  assert.deepEqual(chunks.filter(chunk => chunk.type === 'tool-input-available').map(chunk => chunk.input), [{}, { query: 'initial' }]);
});

test('Messages empty JSON deltas retain the initial tool input instead of parsing an empty string', async () => {
  for (const partial_json of ['', ' ', '\n\t']) {
    for (const input of [{}, { query: 'initial' }]) {
      const item = call('toolu_empty_delta', 'local_conversations_list_all', input);
      const chunks = await chunksFor([start, blockStart(0, item),
        delta(0, { type: 'input_json_delta', partial_json }), stop(0), stop(0), ...end('tool_use')]);
      assert.deepEqual(chunks.filter(chunk => chunk.type === 'error'), []);
      const calls = chunks.filter(chunk => chunk.type === 'tool-input-available');
      assert.equal(calls.length, 1);
      assert.deepEqual(calls[0].input, input);
      assert.equal(chunks.find(chunk => chunk.type === 'finish').finishReason, 'tool-calls');
    }
  }
});

test('Messages malformed, unfinished, and failed streams never execute incomplete calls or finish successfully', async () => {
  const item = call('toolu_bad');
  for (const events of [
    [start, blockStart(0, item), delta(0, { type: 'input_json_delta', partial_json: '{bad' }), stop(0), ...end('tool_use')],
    ...['[]', 'null', '"not an object"'].map(partial_json => [start, blockStart(0, item), delta(0, { type: 'input_json_delta', partial_json }), stop(0), ...end('tool_use')]),
    [start, blockStart(0, item), delta(0, { type: 'input_json_delta', partial_json: '{"unfinished":' }), ...end('max_tokens')],
    [start, blockStart(0, item)],
    [start, { type: 'message_stop' }],
    [start, { type: 'error', error: { type: 'overloaded_error', message: 'Provider overloaded' } }],
    [start],
  ]) {
    const chunks = await chunksFor(events, { appendDone: true });
    assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-available').length, 0);
    assert.ok(chunks.some(chunk => chunk.type === 'error'));
    assert.equal(chunks.filter(chunk => chunk.type === 'finish').length, 0);
  }
});

test('Messages finishes on message_stop without waiting for EOF and cancels its upstream reader', async () => {
  let cancelled = false;
  const source = new ReadableStream({ start(controller) {
    const events = [start, ...text(0, 'Done.'), ...end()];
    controller.enqueue(new TextEncoder().encode(events.map(event => 'data: ' + JSON.stringify(event) + '\n\n').join('')));
  }, cancel() { cancelled = true; } });
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/messages', fetcher: async () => new Response(source) });
  const response = await fetcher('https://gateway.test/v1/messages');
  assert.match(await response.text(), /"finishReason":"stop"/);
  assert.equal(cancelled, true);
});

test('Messages cancellation propagates upstream without releasing a partial tool input', async () => {
  let cancelled = false;
  const source = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode([start, blockStart(0, call('toolu_partial'))]
      .map(event => 'data: ' + JSON.stringify(event) + '\n\n').join('')));
  }, cancel() { cancelled = true; } });
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/messages', fetcher: async () => new Response(source) });
  const reader = (await fetcher('https://direct.test/v1/messages')).body.getReader();
  const first = await reader.read();
  assert.ok(!new TextDecoder().decode(first.value).includes('tool-input-available'));
  await reader.cancel('user stopped');
  assert.equal(cancelled, true);
});

const uiTool = (id, extra = {}) => ({ type: 'tool-local_lookup', toolCallId: id, input: {}, output: { ok: true }, state: 'output-available', ...extra });
const replay = (parts, extra = {}) => buildMessagesBody({ model: 'anthropic/claude-test', providerMetadata: { anthropic: {} },
  messages: [{ id: 'assistant', role: 'assistant', parts: clone(parts) }], ...extra }).messages ?? [];
const signed = (value, signature = 'opaque-signature') => ({ type: 'reasoning', text: value, state: 'done', providerMetadata: { anthropic: { signature } } });

test('Messages replay preserves step order, signed thinking order, parallel result batches, and terminal failures', () => {
  const messages = replay([
    { type: 'step-start' }, signed('  First.\n'), { type: 'text', text: 'Checking.' }, uiTool('a'),
    signed('Between tools.'), uiTool('b', { type: 'dynamic-tool', toolName: 'mcp_lookup', state: 'output-error', output: undefined, errorText: 'Missing' }),
    { type: 'step-start' }, signed('Second.'), uiTool('c', { state: 'output-denied', output: undefined, approval: { approved: false, reason: 'Denied by user' } }),
    { type: 'step-start' }, { type: 'text', text: 'Final answer.' },
  ]);
  assert.deepEqual(messages.map(message => message.role), ['assistant', 'user', 'assistant', 'user', 'assistant']);
  assert.deepEqual(messages[0].content.map(block => block.type), ['thinking', 'text', 'tool_use', 'thinking', 'tool_use']);
  assert.equal(messages[0].content[0].thinking, '  First.\n');
  assert.equal(messages[0].content[0].signature, 'opaque-signature');
  assert.deepEqual(messages[1].content.map(block => block.tool_use_id), ['a', 'b']);
  assert.equal(messages[1].content[1].content, 'Missing');
  assert.equal(messages[1].content[1].is_error, true);
  assert.equal(messages[3].content[0].content, 'Denied by user');
  assert.equal(messages[3].content[0].is_error, true);
  assert.equal(messages.at(-1).content[0].text, 'Final answer.');
  assert.deepEqual(replay([uiTool('pending', { state: 'input-streaming', output: undefined })]), []);
  assert.deepEqual(replay([uiTool('pending', { state: 'input-available', output: undefined })]), []);
  assert.deepEqual(replay([uiTool('hosted', { providerExecuted: true })]), []);
});

test('Messages round-trips signed and redacted thinking, including gateway metadata, without exposing foreign reasoning', async () => {
  const data = 'opaque-encrypted-data';
  const chunks = await chunksFor([start, ...thinking(0, '  Keep exactly.\n', 'signature-part-one'),
    blockStart(1, { type: 'redacted_thinking', data }), stop(1), ...text(2, 'Answer.'), ...end()]);
  const ends = chunks.filter(chunk => chunk.type === 'reasoning-end');
  assert.equal(ends[1].providerMetadata.anthropic.encrypted_content, data, 'gateway replay uses encrypted_content');
  const parts = ends.map((chunk, index) => ({ type: 'reasoning', text: index === 0 ? '  Keep exactly.\n' : '', state: 'done', providerMetadata: chunk.providerMetadata }));
  const messages = replay(parts);
  assert.deepEqual(messages[0].content, [{ type: 'thinking', thinking: '  Keep exactly.\n', signature: 'signature-part-one' }, { type: 'redacted_thinking', data }]);
  const gatewayRedacted = { type: 'reasoning', text: '', providerMetadata: { anthropic: { encrypted_content: data } } };
  assert.deepEqual(replay([gatewayRedacted])[0].content, [{ type: 'redacted_thinking', data }]);
  assert.deepEqual(replay([signed('foreign')], { providerRequestConfigProviderKey: 'other', providerMetadata: { other: {} } }), []);
  assert.deepEqual(replay([{ type: 'reasoning', text: 'unsigned' }]), []);
});

test('Messages merges cached usage and reports token-limit termination', async () => {
  const chunks = await chunksFor([{ ...start, message: { ...start.message, usage: { input_tokens: 42, cache_read_input_tokens: 8, cache_creation_input_tokens: 12, output_tokens: 0 } } },
    ...thinking(0, 'Thinking.'), ...text(1, 'Partial answer.'), ...end('max_tokens')]);
  const finish = chunks.find(chunk => chunk.type === 'finish');
  assert.equal(finish.finishReason, 'length');
  assert.deepEqual(finish.messageMetadata.usage, { promptTokens: 62, completionTokens: 20, totalTokens: 82 });
});

test('Messages reports thinking-only token exhaustion instead of silently presenting a blank answer', async () => {
  const chunks = await chunksFor([start, ...thinking(0, 'Thinking only.'), ...end('max_tokens')]);
  assert.match(chunks.find(chunk => chunk.type === 'error').errorText, /max_tokens.*before producing an answer/);
  assert.equal(chunks.filter(chunk => chunk.type === 'finish' || chunk.type === 'text-start').length, 0);
});

test('Messages respects native max_tokens configuration instead of silently resetting it to 1024', () => {
  const body = { model: 'claude-test', messages: [], omitProviderMetadataInNativeMetadata: true,
    providerRequestConfigProviderKey: 'anthropic', providerRequestConfig: { max_tokens: 8192 } };
  assert.equal(buildMessagesBody(body).max_tokens, 8192);
  assert.equal(buildMessagesBody({ ...body, maxOutputTokens: 4096 }).max_tokens, 4096);
});

test('Messages continuation waits for approvals and all results, deduplicates batches, and respects interruption and final answers', () => {
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const guard = createClientToolContinuation();
  const a = uiTool('approval', { state: 'approval-requested' }), b = uiTool('parallel', { state: 'input-available', output: undefined });
  const message = { id: 'assistant', role: 'assistant', parts: [{ type: 'step-start' }, { type: 'text', text: 'Let me check.' }, a, b] };
  const options = { messages: [{ id: 'user', role: 'user', parts: [] }, message] };
  assert.equal(guard.shouldSend(options), false);
  a.state = 'output-denied'; a.approval = { approved: false };
  assert.equal(guard.shouldSend(options), false);
  b.state = 'output-error'; b.errorText = 'Failed';
  message.metadata = { interrupted: true };
  assert.equal(guard.shouldSend(options), false);
  message.metadata = {};
  assert.equal(guard.shouldSend(options), true);
  assert.equal(guard.shouldSend(options), false);
  message.parts.push({ type: 'step-start' }, { type: 'text', text: 'Done.' });
  assert.equal(guard.shouldSend(options), false);
  assert.equal(createClientToolContinuation().shouldSend({ messages: [{ ...message, parts: [uiTool('hosted', { providerExecuted: true })] }] }), false);
});

test('real SDK Messages waits for delayed parallel client results and submits one complete result batch', async () => {
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const a = call('toolu_slow'), b = call('toolu_fast', 'mcp_lookup');
  const requests = [], completed = [], errors = [], pending = [];
  let releaseA, bothStarted;
  const aReady = new Promise(resolve => { releaseA = resolve; });
  const started = new Promise(resolve => { bothStarted = resolve; });
  const guard = createClientToolContinuation();
  const transport = new GenericChatEndpointTransport('/v1/messages', 'anthropic', undefined, {
    api: 'https://direct.test/v1/messages',
    prepareSendMessagesRequest: ({ messages }) => ({ body: buildMessagesBody({ model: 'anthropic/claude-test', messages }) }),
    fetch: async (_, init) => {
      const request = JSON.parse(init.body); requests.push(request);
      assert.ok(requests.length <= 2);
      if (requests.length === 1) return nativeResponse([start, ...tool(0, a), ...tool(1, b), ...end('tool_use')]);
      assert.deepEqual(completed, [b.id, a.id]);
      assert.deepEqual(request.messages.at(-1).content.map(block => block.tool_use_id), [a.id, b.id]);
      return nativeResponse([start, ...text(0, 'Done.'), ...end()]);
    },
  });
  let chat;
  chat = new Chat({ transport, onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options),
    onToolCall: ({ toolCall }) => {
      pending.push((async () => {
        if (toolCall.toolCallId === a.id) await aReady;
        completed.push(toolCall.toolCallId);
        await chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } });
      })());
      if (toolCall.toolCallId === b.id) bothStarted();
    } });
  const run = chat.sendMessage({ text: 'Run both.' });
  await started;
  await run;
  assert.equal(requests.length, 1);
  releaseA();
  await Promise.all(pending);
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 2);
});

test('real SDK Messages streamed errors cannot trigger continuation from older completed tools', async () => {
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const guard = createClientToolContinuation(), errors = [];
  let requests = 0;
  const transport = new GenericChatEndpointTransport('/v1/messages', 'anthropic', undefined, {
    api: 'https://direct.test/v1/messages',
    fetch: async () => {
      requests++;
      return nativeResponse([start, { type: 'error', error: { message: 'Provider failed' } }]);
    },
  });
  const chat = new Chat({ transport, messages: [{ id: 'assistant', role: 'assistant', parts: [{ type: 'step-start' }, uiTool('old')] }],
    onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options) });
  await chat.regenerate();
  assert.equal(requests, 1);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Provider failed/);
});

test('real SDK saved UI history switches Messages to Responses to Gateway API chat and back without losing or duplicating client context', async () => {
  const { buildResponsesBody } = load(base + 'genericEndpointMappers/responsesMapper.ts');
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const guard = createClientToolContinuation();
  const errors = [], executions = [], gatewayRequests = [];
  const item = call('toolu_saved');
  let route = 'messages', messagesRequests = 0, responsesRequests = 0;
  const transports = {
    messages: new GenericChatEndpointTransport('/v1/messages', 'anthropic', undefined, {
      api: 'https://provider.test/v1/messages',
      prepareSendMessagesRequest: ({ messages }) => ({ body: buildMessagesBody({ model: 'anthropic/claude-test', messages }) }),
      fetch: async (_, init) => {
        const request = JSON.parse(init.body); messagesRequests++;
        if (messagesRequests === 1) return nativeResponse([start, ...thinking(0, 'Original plan.'), ...tool(1, item), ...end('tool_use')]);
        const blocks = request.messages.flatMap(message => message.content);
        assert.equal(blocks.filter(block => block.type === 'tool_use').length, 1);
        assert.equal(blocks.filter(block => block.type === 'tool_result').length, 1);
        assert.equal(blocks.find(block => block.type === 'thinking').signature, 'signed-thinking');
        if (messagesRequests === 3) {
          assert.deepEqual(blocks.filter(block => block.type === 'text').map(block => block.text), [
            'Original question.', 'Messages answer.', 'Continue via Responses.', 'Responses answer.',
            'Continue via Gateway.', 'Gateway answer.', 'Back to Messages.',
          ]);
        }
        return nativeResponse([start, ...text(0, 'Messages answer.'), ...end()]);
      },
    }),
    responses: new GenericChatEndpointTransport('/v1/responses', 'anthropic', undefined, {
      api: 'https://gateway.test/v1/responses',
      prepareSendMessagesRequest: ({ messages }) => ({ body: buildResponsesBody({ model: 'anthropic/claude-test', messages }) }),
      fetch: async (_, init) => {
        const request = JSON.parse(init.body); responsesRequests++;
        assert.equal(request.input.filter(entry => entry.type === 'function_call').length, 1);
        assert.equal(request.input.filter(entry => entry.type === 'function_call_output').length, 1);
        return nativeResponse([{ type: 'response.output_text.delta', item_id: 'msg_responses', delta: 'Responses answer.' },
          { type: 'response.completed', response: { status: 'completed', output: [] } }]);
      },
    }),
    gateway: new DefaultChatTransport({ api: 'https://gateway.test/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({ body: { model: 'anthropic/claude-test', messages } }),
      fetch: async (_, init) => {
        const request = JSON.parse(init.body); gatewayRequests.push(request);
        assert.equal(request.messages.flatMap(message => message.parts).filter(part => part.toolCallId === item.id).length, 1);
        assert.equal(request.messages.flatMap(message => message.parts).find(part => part.type === 'reasoning').providerMetadata.anthropic.signature, 'signed-thinking');
        const chunks = [{ type: 'start' }, { type: 'start-step' }, { type: 'text-start', id: 'gateway-text' },
          { type: 'text-delta', id: 'gateway-text', delta: 'Gateway answer.' }, { type: 'text-end', id: 'gateway-text' },
          { type: 'finish-step' }, { type: 'finish', finishReason: 'stop' }];
        return new Response(chunks.map(chunk => 'data: ' + JSON.stringify(chunk) + '\n\n').join('') + 'data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
      },
    }),
  };
  const transport = { sendMessages: options => transports[route].sendMessages(options), reconnectToStream: async () => null };
  let chat;
  const options = { transport, onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options),
    onToolCall: ({ toolCall }) => {
      executions.push(toolCall.toolCallId);
      chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { conversations: ['chosen'] } });
    } };
  chat = new Chat(options);
  await chat.sendMessage({ text: 'Original question.' });
  const saved = clone(chat.messages);
  chat = new Chat({ ...options, messages: saved });
  route = 'responses';
  await chat.sendMessage({ text: 'Continue via Responses.' });
  route = 'gateway';
  await chat.sendMessage({ text: 'Continue via Gateway.' });
  route = 'messages';
  await chat.sendMessage({ text: 'Back to Messages.' });
  assert.deepEqual(errors, []);
  assert.deepEqual(executions, [item.id]);
  assert.deepEqual([messagesRequests, responsesRequests, gatewayRequests.length], [3, 1, 1]);
  assert.deepEqual(chat.messages[1], saved[1], 'earlier persisted UI history must remain unmodified across routes');
});
