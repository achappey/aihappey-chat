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
    if (id === 'aihappey-types') return { SYSTEM_ROLE: 'system' };
    if (id === 'aihappey-components') return { canonicalizeAnthropicTools: value => value };
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
  const a = { ...call('toolu_local'), caller: { type: 'direct' } }, b = call('toolu_mcp', 'mcp_lookup', { query: 'chosen' });
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
      const blocks = request.messages.flatMap(message => message.content);
      assert.deepEqual(blocks.filter(block => block.type === 'tool_use'), requests.length === 2 ? [a] : [a, b],
        'serialized follow-up calls must retain required input objects, including empty input and caller metadata');
      assert.deepEqual(blocks.filter(block => block.type === 'tool_result'), (requests.length === 2 ? [a] : [a, b])
        .map(item => ({ type: 'tool_result', tool_use_id: item.id, content: '{"ok":true}' })));
      if (requests.length === 2) return nativeResponse([start, ...thinking(0, 'Next step.'), ...text(1, 'Checking next.'), ...tool(2, b), ...end('tool_use')]);
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

test('Messages serialized replay retains required empty tool input for saved static, dynamic, and legacy UI parts without mutation', () => {
  const inputs = [
    { input: {} }, {}, { input: null }, { input: undefined, args: {} },
    { input: undefined, arguments: {} }, { input: undefined, function: { arguments: {} } },
    { input: { nested: {}, items: [], enabled: false, count: 0, text: '', nullable: null } },
  ];
  for (const dynamic of [false, true]) for (const fields of inputs) {
    const part = uiTool('toolu_saved_empty', { input: undefined, ...fields,
      ...(dynamic ? { type: 'dynamic-tool', toolName: 'local_lookup' } : {}),
      callProviderMetadata: { anthropic: { type: 'tool_use', caller: { type: 'direct' } } },
    });
    const parts = [{ type: 'step-start' }, signed(''), part];
    const saved = clone(parts), expectedInput = fields.input ?? fields.args ?? fields.arguments ?? fields.function?.arguments ?? {};
    const messages = clone(buildMessagesBody({ model: 'anthropic/claude-test',
      messages: [{ id: 'saved-assistant', role: 'assistant', parts }],
    }).messages);
    assert.deepEqual(messages, [
      { role: 'assistant', content: [{ type: 'thinking', thinking: '', signature: 'opaque-signature' },
        { type: 'tool_use', id: part.toolCallId, name: 'local_lookup', input: expectedInput, caller: { type: 'direct' } }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: part.toolCallId, content: '{"ok":true}' }] },
    ]);
    assert.deepEqual(clone(parts), saved, 'mapping must not repair or rewrite persisted UI state');
  }
});

test('Messages replay preserves step order, signed thinking order, parallel result batches, and terminal failures', () => {
  const messages = replay([
    { type: 'step-start' }, signed('  First.\n'), { type: 'text', text: 'Checking.' }, uiTool('a'),
    signed('Between tools.'), uiTool('b', { type: 'dynamic-tool', toolName: 'mcp_lookup', state: 'output-error', output: undefined, errorText: 'Missing' }),
    { type: 'step-start' }, signed('Second.'), uiTool('c', { state: 'output-denied', output: undefined, approval: { approved: false, reason: 'Denied by user' } }),
    { type: 'step-start' }, { type: 'text', text: 'Final answer.' },
  ]);
  assert.deepEqual(messages.map(message => message.role), ['assistant', 'user', 'assistant', 'user', 'assistant']);
  assert.deepEqual(messages[0].content.map(block => block.type), ['thinking', 'text', 'tool_use', 'thinking', 'tool_use']);
  assert.deepEqual(messages.flatMap(message => message.content).filter(block => block.type === 'tool_use').map(block => block.input), [{}, {}, {}],
    'successful, failed, and denied parameterless calls must all retain required input');
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
      assert.deepEqual(request.messages.flatMap(message => message.content).filter(block => block.type === 'tool_use'), [a, b]);
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
        assert.deepEqual(blocks.filter(block => block.type === 'tool_use'), [item], 'empty input must survive continuation and route-switch replay');
        assert.equal(blocks.filter(block => block.type === 'tool_result').length, 1);
        assert.deepEqual(blocks.find(block => block.type === 'tool_result'), {
          type: 'tool_result', tool_use_id: item.id, content: '{"conversations":["chosen"]}',
        });
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
        assert.equal(request.input.find(entry => entry.type === 'function_call').arguments, '{}');
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
        const savedTool = request.messages.flatMap(message => message.parts).find(part => part.toolCallId === item.id);
        assert.deepEqual(savedTool.input, {});
        assert.deepEqual(savedTool.output, { conversations: ['chosen'] });
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

const hostedCall = (id, name, input = {}, extra = {}) => ({ type: 'server_tool_use', id, name, input, ...extra });
const result = (index, type, tool_use_id, content, extra = {}) => [blockStart(index, { type, tool_use_id, content, ...extra }), stop(index)];
const downloadResult = () => ({
  content: [{ type: 'resource', resource: {
    uri: 'https://api.anthropic.com/v1/files/file_document/content',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', text: 'PK\u0003\u0004',
  } }],
  isError: null, resultType: null, _meta: null,
  structuredContent: {
    data_url: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBA==',
    file_id: 'file_document', filename: 'willekeurig_document.docx',
    media_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    url: 'https://api.anthropic.com/v1/files/file_document/content',
  },
});

test('Messages provider downloads emit one attachment from the existing result envelope, correlated by call ID', async () => {
  for (const resultFirst of [false, true]) {
    const output = downloadResult(), item = hostedCall('srvtoolu_download', 'download_file', { file_id: 'file_document' });
    const events = [start, ...(resultFirst
      ? [...result(0, 'mcp_tool_result', item.id, output), stop(0), ...tool(1, item), stop(1)]
      : [...tool(0, item), ...tool(1, hostedCall('srvtoolu_other', 'other_tool')),
        ...result(2, 'mcp_tool_result', item.id, output), stop(2)]), ...text(3, 'Your document.'), ...end()];
    const chunks = await chunksFor(events, { fragment: 1 });
    assert.deepEqual(chunks.filter(chunk => chunk.type === 'error'), []);
    assert.deepEqual(chunks.find(chunk => chunk.type === 'tool-output-available').output, output);
    const files = chunks.filter(chunk => chunk.type === 'file');
    assert.equal(files.length, 1);
    assert.equal(files[0].url, output.structuredContent.data_url, 'prefer inline data over the authenticated provider URL');
    assert.equal(files[0].mediaType, output.structuredContent.media_type);
    assert.equal(files[0].providerMetadata.anthropic.filename, output.structuredContent.filename);
    assert.equal(files[0].providerMetadata.anthropic.file_id, output.structuredContent.file_id);
  }
});

test('Messages downloads match Responses URL aliases and skip failed, URL-less, or unrelated results', async () => {
  for (const variant of ['dataUrl', 'url', 'isError', 'is_error', 'missing-url', 'other-tool']) {
    const output = downloadResult(), file = output.structuredContent;
    const item = hostedCall('srvtoolu_download', variant === 'other-tool' ? 'other_tool' : 'download_file');
    if (variant === 'dataUrl') { file.dataUrl = file.data_url; delete file.data_url; }
    if (variant === 'url') delete file.data_url;
    if (variant === 'isError') output.isError = true;
    if (variant === 'missing-url') { delete file.data_url; delete file.url; }
    const chunks = await chunksFor([start, ...tool(0, item),
      ...result(1, 'mcp_tool_result', item.id, output, variant === 'is_error' ? { is_error: true } : {}), ...end()]);
    assert.deepEqual(chunks.filter(chunk => chunk.type === 'error'), [], variant);
    const files = chunks.filter(chunk => chunk.type === 'file');
    assert.equal(files.length, ['dataUrl', 'url'].includes(variant) ? 1 : 0, variant);
    if (files.length) assert.equal(files[0].url, file.dataUrl ?? file.url, variant);
  }
});

test('real SDK Messages downloads become answer attachments live and after reload without client execution or continuation', async () => {
  const output = downloadResult(), item = hostedCall('srvtoolu_download', 'download_file', { file_id: 'file_document' },
    { type: 'mcp_tool_use', server_name: 'aihappey' });
  const errors = [], executions = [];
  let requests = 0;
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const guard = createClientToolContinuation();
  const chat = new Chat({ transport: new GenericChatEndpointTransport('/v1/messages', undefined, undefined, {
    api: 'https://gateway.test/v1/messages', fetch: async () => {
      requests++; assert.equal(requests, 1, 'provider download must not trigger automatic continuation');
      return nativeResponse([start, ...tool(0, item), ...result(1, 'mcp_tool_result', item.id, output), stop(1),
        ...text(2, 'Download your document.'), ...end()]);
    },
  }, 'anthropic/claude-test'), onError: error => errors.push(error),
    onToolCall: ({ toolCall }) => executions.push(toolCall), sendAutomaticallyWhen: options => guard.shouldSend(options) });
  await chat.sendMessage({ text: 'Create a document.' });
  assert.deepEqual(errors, []); assert.deepEqual(executions, []); assert.equal(requests, 1);
  const { toChatMessages } = load(base + '../messages/toChatMessages.ts');
  for (const messages of [chat.messages, clone(chat.messages)]) {
    const parts = messages.at(-1).parts;
    const toolPart = parts.find(part => part.toolCallId === item.id);
    assert.equal(toolPart.providerExecuted, true); assert.equal(toolPart.state, 'output-available');
    assert.deepEqual(toolPart.output, output);
    assert.equal(parts.filter(part => part.type === 'file').length, 1);
    const answer = toChatMessages(messages).find(card => card.content.some(part => part.type === 'text' && part.text === 'Download your document.'));
    assert.equal(answer.attachments.length, 1);
    assert.equal(answer.attachments[0].url, output.structuredContent.data_url);
    assert.equal(answer.attachments[0].providerMetadata.anthropic.filename, output.structuredContent.filename);
  }
});

const hostedFixtures = [
  ['web_search', 'web_search_tool_result', [{ type: 'web_search_result', url: 'https://news.test/item', title: 'News', encrypted_content: 'opaque-search-result', page_age: '1 day' }]],
  ['web_fetch', 'web_fetch_tool_result', { type: 'web_fetch_result', url: 'https://news.test/item', retrieved_at: '2026-11-05T09:00:00Z', content: { type: 'document', title: 'Article', source: { type: 'text', media_type: 'text/plain', data: 'Article body' } } }],
  ['code_execution', 'code_execution_tool_result', { type: 'encrypted_code_execution_result', encrypted_stdout: 'opaque-stdout', stderr: '', return_code: 0, content: [{ type: 'code_execution_output', file_id: 'file_code' }] }],
  ['bash_code_execution', 'bash_code_execution_tool_result', { type: 'bash_code_execution_result', stdout: 'Done', stderr: '', return_code: 0, content: [{ type: 'bash_code_execution_output', file_id: 'file_bash' }] }],
  ['text_editor_code_execution', 'text_editor_code_execution_tool_result', { type: 'text_editor_code_execution_view_result', file_type: 'text', content: 'File body', start_line: 1, total_lines: 1 }],
  ['tool_search_tool_regex', 'tool_search_tool_result', { type: 'tool_search_tool_search_result', tool_references: [{ type: 'tool_reference', tool_name: 'local_lookup' }] }],
  ['remote_lookup', 'mcp_tool_result', [{ type: 'text', text: 'Remote result' }]],
];

for (const [name, resultType, content] of hostedFixtures) test(`real SDK Messages ${name} uses gateway-compatible UI parts, never executes locally, and replays after reload`, async () => {
  const item = hostedCall('srvtoolu_' + name, name, { query: 'native' }, resultType === 'mcp_tool_result'
    ? { type: 'mcp_tool_use', server_name: 'remote-server' } : { caller: { type: 'direct' } });
  const errors = [], executions = [], requests = [];
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const guard = createClientToolContinuation();
  const transport = new GenericChatEndpointTransport('/v1/messages', 'anthropic', undefined, {
    api: 'https://provider.test/v1/messages',
    prepareSendMessagesRequest: ({ messages }) => ({ body: buildMessagesBody({ model: 'claude-test', providerRequestConfigProviderKey: 'anthropic', messages }) }),
    fetch: async (_, init) => {
      const body = JSON.parse(init.body); requests.push(body);
      assert.ok(requests.length <= 2, 'provider tools cannot cause automatic client continuation');
      if (requests.length === 2) return nativeResponse([start, ...text(0, 'Follow-up.'), ...end()]);
      return nativeResponse([start, ...thinking(0, 'Plan.'), ...tool(1, item),
        ...result(2, resultType, item.id, content), stop(2), ...text(3, 'An **answer'), ...text(4, '**.'), ...end()], { fragment: 1 });
    },
  });
  const options = { transport, onError: error => errors.push(error), onToolCall: ({ toolCall }) => executions.push(toolCall),
    sendAutomaticallyWhen: options => guard.shouldSend(options) };
  let chat = new Chat(options);
  await chat.sendMessage({ text: 'Search and answer.' });
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 1);
  assert.deepEqual(executions, []);
  const saved = clone(chat.messages);
  const part = saved.at(-1).parts.find(part => part.toolCallId === item.id);
  assert.equal(part.providerExecuted, true);
  assert.equal(part.state, 'output-available');
  assert.equal(part.callProviderMetadata.anthropic.type, item.type);
  assert.equal(part.resultProviderMetadata.anthropic.type, resultType);
  const expectedOutput = resultType === 'web_search_tool_result' ? { structuredContent: { content } }
    : Array.isArray(content) || !Object.hasOwn(content, 'content') ? { content: [], structuredContent: content } : content;
  assert.deepEqual(part.output, expectedOutput);
  const assistantBlocks = buildMessagesBody({ model: 'anthropic/claude-test', messages: saved }).messages.find(message => message.role === 'assistant').content;
  assert.deepEqual(assistantBlocks.slice(1, 3), [item, { type: resultType, tool_use_id: item.id, content }]);
  assert.deepEqual(assistantBlocks.map(block => block.type), ['thinking', item.type, resultType, 'text', 'text']);
  const { toChatMessages } = load(base + '../messages/toChatMessages.ts');
  const cards = toChatMessages(saved).filter(card => card.role === 'assistant');
  assert.equal(cards.length, 2, 'one ordered activity card and one answer card');
  assert.equal(cards.at(-1).content[0].text, 'An **answer**.');
  assert.equal(saved.at(-1).parts.filter(part => part.type === 'text').length, 2, 'display grouping must not mutate native parts');
  chat = new Chat({ ...options, messages: saved });
  await chat.sendMessage({ text: 'Continue.' });
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].messages.find(message => message.role === 'assistant').content, assistantBlocks);
  assert.deepEqual(chat.messages[1], saved[1]);
});

test('Messages citations retain encrypted indices and native locations, deduplicate visible sources, and survive stateless replay', async () => {
  const citation = { type: 'web_search_result_location', url: 'https://news.test/item', title: 'News', cited_text: 'Quoted text', encrypted_index: 'opaque-citation-index' };
  const documentCitation = { type: 'char_location', document_index: 0, document_title: 'Article', start_char_index: 0, end_char_index: 12, cited_text: 'Article body' };
  const errors = [];
  const transport = new GenericChatEndpointTransport('/v1/messages', undefined, undefined, {
    api: 'https://gateway.test/v1/messages', fetch: async () => nativeResponse([
      { ...start, message: { ...start.message, container: { id: 'container_native', expires_at: 'tomorrow' } } },
      blockStart(0, { type: 'text', text: 'First', citations: [citation] }), stop(0),
      blockStart(1, { type: 'text', text: '' }), delta(1, { type: 'text_delta', text: ' second.' }),
      delta(1, { type: 'citations_delta', citation }), delta(1, { type: 'citations_delta', citation: documentCitation }), stop(1), ...end(),
    ]),
  }, 'anthropic/claude-test');
  const chat = new Chat({ transport, onError: error => errors.push(error) });
  await chat.sendMessage({ text: 'Question.' });
  assert.deepEqual(errors, []);
  const saved = clone(chat.messages.at(-1));
  const sources = saved.parts.filter(part => part.type === 'source-url');
  assert.equal(sources.length, 1);
  assert.equal(sources[0].sourceId, citation.encrypted_index);
  assert.deepEqual(sources[0].providerMetadata.anthropic, citation);
  assert.equal(saved.metadata.providerMetadata.anthropic.id, 'msg_native');
  assert.equal(saved.metadata.providerMetadata.anthropic.container.id, 'container_native');
  assert.equal(saved.metadata.providerMetadata.anthropic.stop_reason, 'end_turn');
  assert.deepEqual(replay(saved.parts)[0].content, [
    { type: 'text', text: 'First', citations: [citation] },
    { type: 'text', text: ' second.', citations: [citation, documentCitation] },
  ]);
  const { toChatMessages } = load(base + '../messages/toChatMessages.ts');
  const cards = toChatMessages([saved]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].content[0].text, 'First second.');
  assert.deepEqual(cards[0].sources, sources);
});

test('Messages typed server-tool failures preserve native error content for replay without failing the assistant stream', async () => {
  for (const [name, resultType] of hostedFixtures) {
    const item = hostedCall('srvtoolu_error', name, {}, resultType === 'mcp_tool_result' ? { type: 'mcp_tool_use', server_name: 'remote' } : {});
    const content = resultType === 'mcp_tool_result' ? [{ type: 'text', text: 'MCP failed' }]
      : { type: resultType + '_error', error_code: 'unavailable', additional_detail: 'Keep exactly' };
    const errors = [], executions = [];
    const chat = new Chat({ transport: new GenericChatEndpointTransport('/v1/messages', 'anthropic', undefined, {
      api: 'https://provider.test/v1/messages', fetch: async () => nativeResponse([start, ...tool(0, item),
        ...result(1, resultType, item.id, content, resultType === 'mcp_tool_result' ? { is_error: true } : {}), ...text(2, 'Search unavailable.'), ...end()]),
    }), onError: error => errors.push(error), onToolCall: ({ toolCall }) => executions.push(toolCall) });
    await chat.sendMessage({ text: 'Question.' });
    assert.deepEqual(errors, []);
    assert.deepEqual(executions, []);
    const part = clone(chat.messages.at(-1).parts.find(part => part.toolCallId === item.id));
    assert.equal(part.state, 'output-error');
    assert.deepEqual(replay([part])[0].content, [item, { type: resultType, tool_use_id: item.id, content,
      ...(resultType === 'mcp_tool_result' ? { is_error: true } : {}) }]);
  }
});

test('Messages replay accepts gateway metadata channels and wrapper payloads without leaking provider artifacts to foreign models', () => {
  const content = [{ url: 'https://news.test/item', title: 'News', encrypted_content: 'opaque' }];
  const part = uiTool('srvtoolu_gateway', { type: 'tool-web_search', providerExecuted: true, input: { query: 'News' },
    output: { structuredContent: { content } },
    callProviderMetadata: { anthropic: { type: 'server_tool_use', id: 'srvtoolu_gateway', name: 'web_search', caller: { type: 'direct' } } },
    resultProviderMetadata: { anthropic: { type: 'web_search_tool_result', tool_use_id: 'srvtoolu_gateway' } },
  });
  assert.deepEqual(replay([part])[0].content, [
    hostedCall('srvtoolu_gateway', 'web_search', { query: 'News' }, { caller: { type: 'direct' } }),
    { type: 'web_search_tool_result', tool_use_id: 'srvtoolu_gateway', content: content.map(item => ({ ...item, type: 'web_search_result' })) },
  ]);
  assert.deepEqual(replay([part], { model: 'other/model', providerRequestConfigProviderKey: 'other' }), []);
  for (const extra of [{ state: 'input-streaming' }, { state: 'input-available' }, { preliminary: true },
    { resultProviderMetadata: {} }, { resultProviderMetadata: { anthropic: { type: 'web_search_tool_result', tool_use_id: 'wrong' } } }]) {
    assert.deepEqual(replay([{ ...part, ...extra }]), []);
  }
  const { buildResponsesBody } = load(base + 'genericEndpointMappers/responsesMapper.ts');
  assert.deepEqual(buildResponsesBody({ model: 'anthropic/claude-test', messages: [{ role: 'assistant', parts: [part, { type: 'text', text: 'Answer.' }] }] }).input,
    [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Answer.' }] }]);
});

test('Messages restores native result chronology when SDK tool parts are updated in place', async () => {
  const a = hostedCall('srvtoolu_a', 'web_search', { query: 'A' }), b = hostedCall('srvtoolu_b', 'web_fetch', { url: 'https://news.test' });
  const aContent = hostedFixtures[0][2], bContent = hostedFixtures[1][2];
  const errors = [];
  const chat = new Chat({ transport: new GenericChatEndpointTransport('/v1/messages', 'anthropic', undefined, {
    api: 'https://provider.test/v1/messages', fetch: async () => nativeResponse([start, ...tool(0, a), ...text(1, 'Searching.'),
      ...tool(2, b), ...result(3, 'web_fetch_tool_result', b.id, bContent), ...result(4, 'web_search_tool_result', a.id, aContent), ...text(5, 'Done.'), ...end()]),
  }), onError: error => errors.push(error) });
  await chat.sendMessage({ text: 'Question.' });
  assert.deepEqual(errors, []);
  assert.deepEqual(replay(clone(chat.messages.at(-1).parts))[0].content, [a, { type: 'text', text: 'Searching.' }, b,
    { type: 'web_fetch_tool_result', tool_use_id: b.id, content: bContent },
    { type: 'web_search_tool_result', tool_use_id: a.id, content: aContent }, { type: 'text', text: 'Done.' }]);
});

test('Messages provider tools validate JSON, deduplicate complete events, and never manufacture outputs for interrupted calls', async () => {
  const item = hostedCall('srvtoolu_test', 'web_search');
  const chunks = await chunksFor([start, ...tool(0, item), stop(0), ...result(1, 'web_search_tool_result', item.id, []),
    ...result(2, 'web_search_tool_result', item.id, []), ...end()]);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-start').length, 1);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-available').length, 1);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-output-available').length, 1);
  for (const events of [
    [start, blockStart(0, item), delta(0, { type: 'input_json_delta', partial_json: '{bad' }), stop(0), ...end()],
    [start, blockStart(0, item)],
    [start, ...result(0, 'web_search_tool_result', 'orphan', []), ...end()],
  ]) {
    const failed = await chunksFor(events);
    assert.ok(failed.some(chunk => chunk.type === 'error'));
    assert.equal(failed.filter(chunk => chunk.type === 'tool-output-available' || chunk.type === 'finish').length, 0);
  }
  const paused = await chunksFor([start, ...tool(0, item), ...end('pause_turn')]);
  assert.equal(paused.find(chunk => chunk.type === 'finish').finishReason, 'other');
  assert.equal(paused.filter(chunk => chunk.type.startsWith('tool-output')).length, 0);
});

test('display merges adjacent assistant Markdown only, preserving ordered activities, media, sources, summary controls, and raw history', () => {
  const { toChatMessages } = load(base + '../messages/toChatMessages.ts');
  const history = [{ id: 'assistant', role: 'assistant', metadata: { model: 'anthropic/claude-test', timestamp: '2026-11-05T09:00:00Z' }, parts: [
    signed('Plan.'), uiTool('server', { providerExecuted: true }),
    { type: 'text', text: 'A **sen', providerMetadata: { anthropic: { type: 'text', citations: [] } } },
    { type: 'source-url', sourceId: 'source', url: 'https://news.test', title: 'News' },
    { type: 'text', text: 'tence**.\n\n```js\n' }, { type: 'file', mediaType: 'application/pdf', url: 'https://files.test/attachment.pdf' },
    { type: 'text', text: 'x();\n```' }, signed('Next activity.'),
    { type: 'text', text: 'After activity.' }, { type: 'file', mediaType: 'image/png', url: 'data:image/png;base64,image' },
    { type: 'text', text: 'Final ' }, { type: 'text', text: 'answer.' },
  ] }];
  const before = clone(history), cards = toChatMessages(history);
  assert.deepEqual(history, before);
  assert.deepEqual(cards.map(card => card.content[0].type), ['reasoning', 'text', 'reasoning', 'text', 'image-grid', 'text']);
  const answers = cards.filter(card => card.content[0].type === 'text');
  assert.deepEqual(answers.map(card => card.content[0].text), ['A **sentence**.\n\n```js\nx();\n```', 'After activity.', 'Final answer.']);
  assert.ok(answers.every(card => card.sources.length === 1 && card.attachments.length === 1));
  assert.deepEqual(cards.filter(card => card.hideMessageSummaryActions === false).map(card => card.id), [answers.at(-1).id]);
  const stableId = answers[0].id;
  history[0].parts[6].text += '\nMore tokens';
  history[0].parts[6].state = 'streaming';
  assert.equal(toChatMessages(history).filter(card => card.content[0].type === 'text')[0].id, stableId);
  assert.equal(toChatMessages(history).filter(card => card.content[0].type === 'text')[0].content[0].state, 'streaming');
  assert.equal(toChatMessages([{ id: 'user', role: 'user', parts: [{ type: 'text', text: 'One' }, { type: 'text', text: 'Two' }] }]).length, 2);
});

for (const route of ['direct', 'gateway']) test(`real SDK ${route} mixed server/client tools continue once and retain native history across reload, Responses and API chat`, async () => {
  const { buildResponsesBody } = load(base + 'genericEndpointMappers/responsesMapper.ts');
  const { createClientToolContinuation } = load(base + 'clientToolContinuation.ts');
  const hosted = hostedCall('srvtoolu_search', 'web_search', { query: 'News' }), client = call('toolu_client');
  const errors = [], executions = [], requests = [], apiRequests = [];
  const guard = createClientToolContinuation();
  let endpoint = 'messages';
  const responseChunks = value => new Response([
    { type: 'start' }, { type: 'start-step' }, { type: 'text-start', id: 'api_text' },
    { type: 'text-delta', id: 'api_text', delta: value }, { type: 'text-end', id: 'api_text' },
    { type: 'finish-step' }, { type: 'finish', finishReason: 'stop' },
  ].map(chunk => 'data: ' + JSON.stringify(chunk) + '\n\n').join('') + 'data: [DONE]\n\n');
  const transports = {
    messages: new GenericChatEndpointTransport('/v1/messages', route === 'direct' ? 'anthropic' : undefined, undefined, {
      api: `https://${route}.test/v1/messages`,
      prepareSendMessagesRequest: ({ messages }) => ({ body: buildMessagesBody({ model: route === 'direct' ? 'claude-test' : 'anthropic/claude-test', providerRequestConfigProviderKey: 'anthropic', messages }) }),
      fetch: async (_, init) => {
        const request = JSON.parse(init.body); requests.push(request);
        assert.ok(requests.length <= 3);
        if (requests.length === 1) return nativeResponse([start, ...thinking(0, 'Plan.'), ...tool(1, hosted),
          ...result(2, 'web_search_tool_result', hosted.id, hostedFixtures[0][2]), ...tool(3, client), ...end('tool_use')]);
        const blocks = request.messages.flatMap(message => message.content);
        assert.equal(blocks.filter(block => block.type === 'server_tool_use').length, 1);
        assert.deepEqual(blocks.find(block => block.type === 'server_tool_use'), hosted);
        assert.equal(blocks.filter(block => block.type === 'web_search_tool_result').length, 1);
        assert.equal(blocks.filter(block => block.type === 'tool_use').length, 1);
        assert.deepEqual(blocks.find(block => block.type === 'tool_use'), client);
        assert.equal(blocks.filter(block => block.type === 'tool_result').length, 1);
        return nativeResponse([start, ...text(0, requests.length === 2 ? 'Messages answer.' : 'Back again.'), ...end()]);
      },
    }, 'anthropic/claude-test'),
    responses: new GenericChatEndpointTransport('/v1/responses', 'anthropic', undefined, {
      api: 'https://gateway.test/v1/responses',
      prepareSendMessagesRequest: ({ messages }) => ({ body: buildResponsesBody({ model: 'anthropic/claude-test', messages }) }),
      fetch: async (_, init) => {
        const request = JSON.parse(init.body);
        assert.equal(request.input.filter(entry => entry.type === 'function_call').length, 1, 'server tools never become client function calls');
        return nativeResponse([{ type: 'response.output_text.delta', item_id: 'response_answer', delta: 'Responses answer.' },
          { type: 'response.completed', response: { status: 'completed', output: [] } }]);
      },
    }),
    api: new DefaultChatTransport({ api: 'https://gateway.test/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({ body: { model: 'anthropic/claude-test', messages } }),
      fetch: async (_, init) => { apiRequests.push(JSON.parse(init.body)); return responseChunks('API answer.'); },
    }),
  };
  const transport = { sendMessages: options => transports[endpoint].sendMessages(options), reconnectToStream: async () => null };
  let chat;
  const options = { transport, onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options),
    onToolCall: ({ toolCall }) => {
      executions.push(toolCall.toolCallId);
      chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } });
    } };
  chat = new Chat(options);
  await chat.sendMessage({ text: 'Search and list.' });
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 2);
  assert.deepEqual(executions, [client.id]);
  const saved = clone(chat.messages), original = clone(saved[1]);
  chat = new Chat({ ...options, messages: saved });
  endpoint = 'responses'; await chat.sendMessage({ text: 'Continue via Responses.' });
  endpoint = 'api'; await chat.sendMessage({ text: 'Continue via API chat.' });
  assert.deepEqual(apiRequests[0].messages[1], original, 'API chat receives the original provider-keyed parts without transformation');
  endpoint = 'messages'; await chat.sendMessage({ text: 'Return to Messages.' });
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 3);
  assert.deepEqual(executions, [client.id]);
  assert.deepEqual(chat.messages[1], original);
});

test('Messages gateway payload normalization covers all native provider result types without modifying saved outputs', () => {
  for (const [name, resultType, nativeContent] of hostedFixtures) {
    const content = clone(nativeContent);
    if (!Array.isArray(content)) {
      delete content.type;
      for (const nested of ['content', 'tool_references']) if (Array.isArray(content[nested])) content[nested].forEach(item => { delete item.type; });
    } else if (resultType === 'web_search_tool_result') content.forEach(item => { delete item.type; });
    const part = uiTool('srvtoolu_gateway_' + name, { type: 'tool-' + name, providerExecuted: true,
      output: { content: [], structuredContent: resultType === 'web_search_tool_result' ? { content } : content },
      callProviderMetadata: { anthropic: { type: resultType === 'mcp_tool_result' ? 'mcp_tool_use' : 'server_tool_use', id: 'srvtoolu_gateway_' + name, name } },
      resultProviderMetadata: { anthropic: { type: resultType, tool_use_id: 'srvtoolu_gateway_' + name } },
    });
    const before = clone(part);
    assert.deepEqual(replay([part])[0].content[1].content, nativeContent);
    assert.deepEqual(part, before);
  }
});

test('Messages server-tool cancellation and concurrent streams keep partial inputs and native results isolated', async () => {
  let cancelled = false;
  const item = hostedCall('srvtoolu_shared', 'web_search');
  const source = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode([start, blockStart(0, item), delta(0, { type: 'input_json_delta', partial_json: '{"query":' })]
      .map(event => 'data: ' + JSON.stringify(event) + '\n\n').join('')));
  }, cancel() { cancelled = true; } });
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/messages', providerKey: 'anthropic', fetcher: async () => new Response(source) });
  const reader = (await fetcher('https://provider.test/v1/messages')).body.getReader();
  assert.ok(!new TextDecoder().decode((await reader.read()).value).includes('tool-input-available'));
  await reader.cancel('user stopped');
  assert.equal(cancelled, true);
  const streams = await Promise.all(['A', 'B'].map(title => chunksFor([start, ...tool(0, item),
    ...result(1, 'web_search_tool_result', item.id, [{ type: 'web_search_result', title, url: 'https://news.test/' + title, encrypted_content: title }]), ...end()])));
  assert.deepEqual(streams.map(chunks => chunks.find(chunk => chunk.type === 'tool-output-available').output.structuredContent.content[0].title), ['A', 'B']);
});
