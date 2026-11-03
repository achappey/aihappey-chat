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
const { buildResponsesBody } = load(base + 'genericEndpointMappers/responsesMapper.ts');
const clone = value => JSON.parse(JSON.stringify(value));
const reasoningId = 'rs_' + 'a'.repeat(50); // the old UI prefix produces a 65-character API id
const reasoning = { type: 'reasoning', id: reasoningId, encrypted_content: 'encrypted-reasoning', summary: [{ type: 'summary_text', text: 'Plan.' }] };
const call = (n, name = 'local_conversations_list_all', args = '{"query":"hello"}') => ({
  type: 'function_call', id: 'fc_item_' + n, call_id: 'call_' + n, name, arguments: args, status: 'completed',
});
const done = output => ({ type: 'response.completed', response: { id: 'resp_test', model: 'model', status: 'completed', output } });
const finalEvents = text => [
  { type: 'response.output_text.delta', item_id: 'msg_final', delta: text }, done([]),
];
function nativeResponse(events, { fragment = 7, status = 200, appendDone = true } = {}) {
  const bytes = new TextEncoder().encode(events.map(event => 'event: ' + event.type + '\r\ndata: ' + JSON.stringify(event) + '\r\n\r\n').join('') + (appendDone ? 'data: [DONE]\r\n\r\n' : ''));
  return new Response(new ReadableStream({ start(controller) {
    for (let i = 0; i < bytes.length; i += fragment) controller.enqueue(bytes.slice(i, i + fragment));
    controller.close();
  } }), { status, headers: { 'Content-Type': 'text/event-stream' } });
}
async function chunksFor(events, options = {}) {
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/responses', providerKey: options.providerKey ?? 'openai',
    fetcher: async () => nativeResponse(events, options) });
  const response = await fetcher('https://provider.test/v1/responses', { body: JSON.stringify({ model: 'openai/model' }) });
  return (await response.text()).split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)));
}
const replay = (parts, extra = {}) => buildResponsesBody({ model: 'openai/model', providerMetadata: { openai: {} },
  messages: [{ id: 'assistant', role: 'assistant', parts }], ...extra }).input ?? [];
const toolPart = (item, extra = {}) => ({ type: 'tool-' + item.name, toolCallId: item.call_id, state: 'output-available',
  input: JSON.parse(item.arguments), output: { ok: true }, providerExecuted: false,
  callProviderMetadata: { openai: { type: item.type, id: item.id, item_id: item.id, call_id: item.call_id } }, ...extra });

test('reasoning replay uses provider-native IDs, preserves encrypted metadata, and groups summary parts', () => {
  const metadata = { openai: { id: reasoningId, item_id: reasoningId, encrypted_content: reasoning.encrypted_content } };
  const parts = [0, 1].map(index => ({ type: 'reasoning', id: `reasoning-${reasoningId}-${index}`, text: 'Summary ' + index,
    state: 'done', providerMetadata: metadata }));
  const input = replay(parts, { providerMetadata: { anthropic: {}, openai: {} } });
  assert.equal(input.length, 1);
  assert.equal(input[0].id, reasoningId);
  assert.equal(input[0].encrypted_content, reasoning.encrypted_content);
  assert.deepEqual(input[0].summary.map(part => part.text), ['Summary 0', 'Summary 1']);
  assert.equal(replay([{ ...parts[0], providerMetadata: { openai: { encrypted_content: reasoning.encrypted_content } } }])[0].id, reasoningId,
    'recover an existing saved UI id without truncating the native id');
});

test('function streams correlate call_id, wait for complete arguments, and deduplicate completion snapshots', async () => {
  const item = call(1);
  const events = [
    { type: 'response.output_item.added', output_index: 0, item: { ...item, arguments: '', status: 'in_progress' } },
    { type: 'response.function_call_arguments.delta', item_id: item.id, output_index: 0, delta: '{"query":' },
    { type: 'response.function_call_arguments.delta', item_id: item.id, output_index: 0, delta: '"hello"}' },
    { type: 'response.function_call_arguments.done', item_id: item.id, output_index: 0, arguments: item.arguments },
    { type: 'response.output_item.done', output_index: 0, item },
    { type: 'response.output_item.done', output_index: 0, item }, done([item]),
  ];
  const chunks = await chunksFor(events);
  const calls = chunks.filter(chunk => chunk.type === 'tool-input-available');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].toolCallId, item.call_id);
  assert.deepEqual(calls[0].input, { query: 'hello' });
  assert.equal(calls[0].providerMetadata.openai.id, item.id);
  assert.equal(calls[0].providerMetadata.openai.call_id, item.call_id);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-output-available').length, 0);
  assert.equal(chunks.find(chunk => chunk.type === 'finish').finishReason, 'tool-calls');
  const partial = await chunksFor(events.slice(0, 2));
  assert.equal(partial.filter(chunk => chunk.type === 'tool-input-available').length, 0);
  assert.ok(partial.some(chunk => chunk.type === 'error'), 'EOF before completion must fail rather than auto-continue');
});

test('Responses replay retains chronological reasoning, text, native call IDs and terminal tool errors', () => {
  const first = call(1), second = call(2, 'mcp_lookup');
  const parts = [toolPart(first), { type: 'reasoning', id: 'ui-only', state: 'done', text: 'Next.',
    providerMetadata: { openai: { id: reasoningId, encrypted_content: reasoning.encrypted_content } } },
    { type: 'text', text: 'Looking up the next item.' }, toolPart(second, { state: 'output-error', output: undefined, errorText: 'Not found' })];
  const input = replay(parts);
  assert.deepEqual(input.map(item => item.type), ['function_call', 'function_call_output', 'reasoning', 'message', 'function_call', 'function_call_output']);
  assert.equal(input[0].id, first.id);
  assert.equal(input[0].call_id, first.call_id);
  assert.equal(input.at(-1).call_id, second.call_id);
  assert.match(input.at(-1).output, /Not found/);
  assert.equal(replay([toolPart(first, { state: 'input-streaming', output: undefined })]).length, 0);
  assert.match(replay([toolPart(first, { state: 'output-denied', output: undefined, approval: { approved: false, reason: 'No permission' } })]).at(-1).output, /No permission/);
});

test('Responses continuation waits for every client result, ignores hosted tools, and submits a batch only once', () => {
  const { createResponsesContinuation } = load(base + 'responsesContinuation.ts');
  const guard = createResponsesContinuation();
  const a = toolPart(call(1), { state: 'input-available', output: undefined });
  const b = toolPart(call(2));
  const message = { id: 'assistant', role: 'assistant', parts: [{ type: 'step-start' }, a, b] };
  const options = { messages: [{ id: 'user', role: 'user', parts: [] }, message] };
  assert.equal(guard.shouldSend(options), false);
  a.state = 'output-available'; a.output = {};
  assert.equal(guard.shouldSend(options), true);
  assert.equal(guard.shouldSend(options), false);
  message.parts.push({ type: 'step-start' }, { type: 'text', text: 'Done.' });
  assert.equal(guard.shouldSend(options), false);
  assert.equal(createResponsesContinuation().shouldSend({ messages: [{ ...message, parts: [toolPart(call(3), { providerExecuted: true })] }] }), false);
  assert.equal(createResponsesContinuation().shouldSend({ messages: [{ ...message, parts: [{ type: 'text', text: 'Let me check.' }, toolPart(call(4))] }] }), true);
});

for (const route of ['gateway', 'direct']) test(`real SDK ${route} Responses tools run once through parallel and multi-step calls to final text`, async () => {
  const { createResponsesContinuation } = load(base + 'responsesContinuation.ts');
  const requests = [], executions = [], errors = [];
  const a = call(1), b = call(2, 'mcp_lookup', '{"query":"two"}'), c = call(3, 'local_conversations_delete', '{"id":"chosen"}');
  const url = `https://${route}.test/v1/responses`;
  const providerKey = route === 'direct' ? 'openai' : undefined;
  const fetcher = async (input, init) => {
    assert.equal(input, url);
    assert.equal(new Headers(init.headers).get('Authorization'), route === 'direct' ? 'Bearer native-key' : 'Bearer gateway-token');
    const request = JSON.parse(init.body); requests.push(request);
    assert.equal(request.model, route === 'direct' ? 'model' : 'openai/model');
    assert.equal(request.store, false);
    assert.equal(request.previous_response_id, undefined);
    assert.ok(requests.length <= 3, 'no continuation after the final answer');
    if (requests.length > 1) {
      const outputs = request.input.filter(item => item.type === 'function_call_output');
      assert.deepEqual(outputs.map(item => item.call_id), requests.length === 2 ? [a.call_id, b.call_id] : [a.call_id, b.call_id, c.call_id]);
      assert.ok(request.input.filter(item => item.type === 'reasoning').every(item => item.id === reasoningId));
    }
    if (requests.length === 3) return nativeResponse(finalEvents('All done.'));
    const items = requests.length === 1 ? [a, b] : [c];
    const events = requests.length === 1 ? [
      { type: 'response.output_item.added', output_index: 0, item: { ...reasoning, encrypted_content: undefined } },
      { type: 'response.reasoning_summary_text.delta', item_id: reasoningId, summary_index: 0, delta: 'Plan.' },
      { type: 'response.output_item.done', output_index: 0, item: reasoning },
    ] : [];
    for (const [index, item] of items.entries()) events.push({ type: 'response.output_item.added', output_index: index + 1, item: { ...item, arguments: '', status: 'in_progress' } });
    for (const item of items) events.push({ type: 'response.function_call_arguments.delta', item_id: item.id, delta: item.arguments.slice(0, 5) });
    for (const item of [...items].reverse()) events.push({ type: 'response.function_call_arguments.delta', item_id: item.id, delta: item.arguments.slice(5) });
    for (const item of items) events.push({ type: 'response.output_item.done', item }, { type: 'response.output_item.done', item });
    events.push(done(items));
    return nativeResponse(events);
  };
  const transport = new GenericChatEndpointTransport('/v1/responses', providerKey, undefined, {
    api: url, fetch: fetcher,
    prepareSendMessagesRequest: ({ messages, headers }) => ({ headers, body: buildResponsesBody({
      model: route === 'direct' ? 'model' : 'openai/model', providerRequestConfigProviderKey: 'openai',
      providerMetadata: { openai: {} }, messages, tools: [a, b, c].map(item => ({ name: item.name, inputSchema: { type: 'object' } })),
    }) }),
    headers: { Authorization: route === 'direct' ? 'Bearer native-key' : 'Bearer gateway-token' },
  }, 'openai/model');
  const guard = createResponsesContinuation();
  let chat;
  chat = new Chat({ transport, onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options),
    onToolCall: async ({ toolCall }) => {
      executions.push(clone(toolCall));
      chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } });
    } });
  await chat.sendMessage({ text: 'List, look up and delete the selected conversation.' });
  assert.deepEqual(errors, []);
  assert.equal(requests.length, 3);
  assert.deepEqual(executions.map(item => item.toolCallId), [a.call_id, b.call_id, c.call_id]);
  assert.deepEqual(executions.map(item => item.input), [{ query: 'hello' }, { query: 'two' }, { id: 'chosen' }]);
  assert.equal(chat.messages.at(-1).parts.filter(part => part.type === 'text').map(part => part.text).join(''), 'All done.');
  const saved = clone(chat.messages);
  const input = buildResponsesBody({ model: 'openai/model', messages: saved, providerMetadata: { openai: {} } }).input;
  assert.deepEqual(input.filter(item => item.type === 'function_call_output').map(item => item.call_id), ['call_1', 'call_2', 'call_3']);
  assert.equal(saved.flatMap(message => message.parts).find(part => part.type === 'reasoning').providerMetadata.openai.id, reasoningId);
});

test('hosted web search remains provider-executed and never becomes a client function result', async () => {
  const item = { type: 'web_search_call', id: 'ws_1', status: 'completed', action: { type: 'search', query: 'test' } };
  const chunks = await chunksFor([{ type: 'response.output_item.added', item }, { type: 'response.output_item.done', item }, ...finalEvents('Found it.')]);
  assert.ok(chunks.filter(chunk => chunk.type.startsWith('tool-')).every(chunk => chunk.providerExecuted === true));
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-output-available').length, 1);
  assert.deepEqual(replay([toolPart(call(1), { providerExecuted: true })]), []);
});

test('failed, incomplete, malformed and truncated Responses streams cannot execute unfinished calls or finish successfully', async () => {
  const item = call(1);
  for (const events of [
    [{ type: 'response.failed', response: { error: { message: 'Provider failed' } } }],
    [{ type: 'response.incomplete', response: { incomplete_details: { reason: 'max_output_tokens' } } }],
    [{ type: 'error', message: 'Invalid request' }],
    [{ type: 'response.output_item.added', item: { ...item, arguments: '', status: 'in_progress' } }],
    [{ type: 'response.output_item.done', item: { ...item, arguments: '{bad' } }, done([])],
  ]) {
    const chunks = await chunksFor(events, { appendDone: false });
    assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-available').length, 0);
    assert.ok(chunks.some(chunk => chunk.type === 'error'));
    assert.equal(chunks.filter(chunk => chunk.type === 'finish' && chunk.finishReason !== 'error').length, 0);
  }
});

test('HTTP errors retain the original status, headers, and diagnostic body', async () => {
  const original = Response.json({ error: { message: 'Invalid input[1].id' } }, { status: 400, headers: { 'x-request-id': 'request-1' } });
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/responses', fetcher: async () => original });
  const response = await fetcher('https://gateway.test/v1/responses');
  assert.equal(response.status, 400);
  assert.equal(response.headers.get('x-request-id'), 'request-1');
  assert.deepEqual(await response.json(), { error: { message: 'Invalid input[1].id' } });
});

test('completed snapshots alone recover reasoning, distinct message phases, and function inputs exactly once', async () => {
  const item = call(9);
  const message = (id, text, phase) => ({ type: 'message', role: 'assistant', id, phase, content: [{ type: 'output_text', text }] });
  const output = [reasoning, message('msg_preamble', 'Checking.', 'commentary'), item];
  const chunks = await chunksFor([done(output)]);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-available').length, 1);
  const reasoningEnd = chunks.find(chunk => chunk.type === 'reasoning-end');
  assert.equal(reasoningEnd.providerMetadata.openai.id, reasoningId);
  const textEnd = chunks.find(chunk => chunk.type === 'text-end');
  assert.equal(textEnd.providerMetadata.openai.phase, 'commentary');
  assert.equal(textEnd.providerMetadata.openai.id, 'msg_preamble');
  const parts = [
    { type: 'reasoning', id: reasoningEnd.id, state: 'done', text: 'Plan.', providerMetadata: reasoningEnd.providerMetadata },
    { type: 'text', text: 'Checking.', providerMetadata: textEnd.providerMetadata }, toolPart(item),
    { type: 'text', text: 'Done.', providerMetadata: { openai: { id: 'msg_final', phase: 'final_answer' } } },
  ];
  const input = replay(clone(parts));
  assert.deepEqual(input.map(item => item.type), ['reasoning', 'message', 'function_call', 'function_call_output', 'message']);
  assert.equal(input[1].phase, 'commentary'); assert.equal(input[1].id, 'msg_preamble');
  assert.equal(input.at(-1).phase, 'final_answer'); assert.equal(input.at(-1).id, 'msg_final');
});

test('delayed parallel results may arrive out of order but continuation sends the complete batch once', async () => {
  const { createResponsesContinuation } = load(base + 'responsesContinuation.ts');
  const a = call(1), b = call(2, 'mcp_lookup');
  const requests = [], completed = [], errors = [];
  let releaseA, bothStarted;
  const aReady = new Promise(resolve => { releaseA = resolve; });
  const started = new Promise(resolve => { bothStarted = resolve; });
  const guard = createResponsesContinuation();
  const pending = [];
  let chat;
  const transport = new GenericChatEndpointTransport('/v1/responses', 'openai', undefined, {
    api: 'https://direct.test/v1/responses',
    prepareSendMessagesRequest: ({ messages }) => ({ body: buildResponsesBody({ model: 'openai/model', messages }) }),
    fetch: async (_, init) => {
      const request = JSON.parse(init.body); requests.push(request);
      assert.ok(requests.length <= 2);
      if (requests.length === 2) {
        assert.deepEqual(completed, ['call_2', 'call_1']);
        assert.deepEqual(request.input.filter(item => item.type === 'function_call_output').map(item => item.call_id), ['call_1', 'call_2']);
        return nativeResponse(finalEvents('Done.'));
      }
      return nativeResponse([{ type: 'response.output_item.done', item: a }, { type: 'response.output_item.done', item: b }, done([a, b])]);
    },
  });
  chat = new Chat({ transport, onError: error => errors.push(error), sendAutomaticallyWhen: options => guard.shouldSend(options),
    onToolCall: ({ toolCall }) => {
      // Match the asynchronous SDK-supported pattern: release the stream while
      // client tools execute, then add results independently.
      pending.push((async () => {
        if (toolCall.toolCallId === a.call_id) await aReady;
        completed.push(toolCall.toolCallId);
        await chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } });
      })());
      if (toolCall.toolCallId === b.call_id) bothStarted();
    } });
  const run = chat.sendMessage({ text: 'Run both.' });
  await started;
  await run;
  assert.equal(requests.length, 1);
  assert.deepEqual(completed, ['call_2']);
  releaseA();
  await Promise.all(pending);
  assert.deepEqual(errors, []); assert.equal(requests.length, 2);
});

test('cancelling a partial function stream cancels its upstream reader without executing the call', async () => {
  const item = { ...call(1), arguments: '', status: 'in_progress' };
  let upstreamCancelled = false;
  const source = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ type: 'response.output_item.added', item }) + '\n\n'));
  }, cancel() { upstreamCancelled = true; } });
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/responses', providerKey: 'openai', fetcher: async () => new Response(source) });
  const reader = (await fetcher('https://direct.test/v1/responses')).body.getReader();
  const first = await reader.read();
  assert.ok(!new TextDecoder().decode(first.value).includes('tool-input-available'));
  await reader.cancel('stopped');
  assert.equal(upstreamCancelled, true);
});

test('real SDK terminal stream errors stop automatic continuation even with an older completed tool', async () => {
  const { createResponsesContinuation } = load(base + 'responsesContinuation.ts');
  for (const event of [{ type: 'response.failed', response: { error: { message: 'Failed' } } },
    { type: 'response.incomplete', response: { incomplete_details: { reason: 'max_output_tokens' } } }]) {
    let requests = 0, executions = 0;
    const errors = [], guard = createResponsesContinuation();
    const chat = new Chat({ messages: [{ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Do it.' }] },
      { id: 'assistant', role: 'assistant', parts: [toolPart(call(1))] }],
      transport: new GenericChatEndpointTransport('/v1/responses', 'openai', undefined, {
        fetch: async () => { requests++; assert.ok(requests <= 1); return nativeResponse([event]); },
      }), onError: error => errors.push(error), onToolCall: () => { executions++; },
      sendAutomaticallyWhen: options => guard.shouldSend(options) });
    await chat.sendMessage();
    assert.equal(requests, 1); assert.equal(executions, 0); assert.equal(errors.length, 1); assert.equal(chat.status, 'error');
  }
});
