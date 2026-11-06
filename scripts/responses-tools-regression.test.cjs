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

test('main chat keeps fragmented text streaming for Chat Completions, Messages and Responses without playground helpers', async () => {
  const cases = [
    ['/v1/chat/completions', [
      { choices: [{ delta: { role: 'assistant', content: '' } }] },
      { choices: [{ delta: { content: 'Hello' } }, { delta: { content: ' ' } }] },
      { choices: [{ delta: { content: 'world' } }] },
      { choices: [{ delta: {}, finish_reason: 'stop' }] },
    ]],
    ['/v1/messages', [
      { type: 'message_start', message: { id: 'msg', role: 'assistant', content: [] } },
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello ' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'world' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_delta', delta: { stop_reason: 'end_turn' } },
      { type: 'message_stop' },
    ]],
    ['/v1/responses', [
      { type: 'response.created', response: { id: 'resp' } },
      { type: 'response.output_text.delta', item_id: 'msg', delta: 'Hello ' },
      { type: 'response.output_text.delta', item_id: 'msg', delta: 'world' }, done([]),
    ]],
  ];
  for (const [endpoint, events] of cases) {
    const fetcher = wrapGenericChatFetch({ endpoint, fetcher: async () => nativeResponse(events, { fragment: 1 }) });
    const response = await fetcher('https://provider.test' + endpoint);
    const chunks = (await response.text()).split('\n').filter(line => line.startsWith('data: {'))
      .map(line => JSON.parse(line.slice(6)));
    assert.equal(chunks.filter(chunk => chunk.type === 'text-delta').map(chunk => chunk.delta).join(''), 'Hello world', endpoint);
    assert.equal(chunks.filter(chunk => chunk.type === 'text-start').length, 1, endpoint);
    assert.equal(chunks.filter(chunk => chunk.type === 'text-end').length, 1, endpoint);
    assert.equal(chunks.filter(chunk => chunk.type === 'finish').length, 1, endpoint);
    assert.equal(chunks.filter(chunk => chunk.type === 'error').length, 0, endpoint);
  }
});

const gatewayResult = (provider = 'openai') => ({
  content: [{ type: 'resource', resource: { uri: 'file:///report.docx', mimeType: 'application/octet-stream', blob: 'AAEC/w==' } }],
  structuredContent: { filename: 'report.docx', file_id: 'file_1', media_type: 'application/octet-stream', data_url: 'data:application/octet-stream;base64,AAEC/w==' },
  isError: false, future: { keep: true }, _meta: { existing: true,
    'aihappey/gateway': { provider, providerMetadata: { [provider]: { container_id: 'cntr_1', session_id: 'session_saved' } } } },
});
const gatewayCall = (name = 'download_file', result = gatewayResult()) => ({
  type: 'mcp_call', id: 'synthetic_' + name, name, server_label: 'aihappey', status: 'completed',
  arguments: '{"file_id":"file_1"}', output: JSON.stringify(result),
});

test('gateway MCP downloads preserve names and full results, emit one file, and never execute or continue in the real SDK', async () => {
  for (const snapshotsOnly of [false, true]) {
    const result = gatewayResult(), item = gatewayCall('download_file', result), errors = [];
    let requests = 0, executions = 0;
    const { createResponsesContinuation } = load(base + 'responsesContinuation.ts');
    const guard = createResponsesContinuation();
    const events = snapshotsOnly ? [done([item])] : [
      { type: 'response.output_item.added', output_index: 0, item: { ...item, status: 'in_progress', output: null } },
      { type: 'response.mcp_call_arguments.done', item_id: item.id, output_index: 0, arguments: item.arguments },
      { type: 'response.output_item.done', output_index: 0, item },
      { type: 'response.output_item.done', output_index: 0, item }, done([item]),
    ];
    const chat = new Chat({ transport: new GenericChatEndpointTransport('/v1/responses', 'openai', undefined, {
      fetch: async () => { requests++; assert.ok(requests <= 1); return nativeResponse(events); },
    }), onToolCall: () => { executions++; }, onError: error => errors.push(error),
      sendAutomaticallyWhen: options => guard.shouldSend(options) });
    await chat.sendMessage({ text: 'Create the document.' });
    assert.deepEqual(errors, []); assert.equal(requests, 1); assert.equal(executions, 0);
    const parts = chat.messages.at(-1).parts;
    const tool = parts.find(part => part.type === 'tool-download_file');
    assert.ok(tool); assert.equal(tool.providerExecuted, true); assert.equal(tool.state, 'output-available');
    assert.deepEqual(tool.output, result); assert.deepEqual(tool.input, { file_id: 'file_1' });
    assert.equal(tool.resultProviderMetadata.openai.container_id, 'cntr_1');
    assert.equal(parts.filter(part => part.type === 'file').length, 1);
    assert.equal(parts.find(part => part.type === 'file').url, result.structuredContent.data_url);
    assert.equal(replay(clone(parts)).filter(part => part.type === 'mcp_call' || part.type === 'function_call_output').length, 0);
  }
});

test('gateway session tools survive saved history reload and replay only to their owning provider', async () => {
  const result = gatewayResult('agent37'), item = gatewayCall('create_agent37_session', result);
  const chunks = await chunksFor([done([item])], { providerKey: 'agent37' });
  const input = chunks.find(chunk => chunk.type === 'tool-input-available');
  const output = chunks.find(chunk => chunk.type === 'tool-output-available');
  const part = clone({ type: 'tool-create_agent37_session', toolCallId: item.id, state: 'output-available',
    providerExecuted: true, input: input.input, output: output.output,
    callProviderMetadata: input.providerMetadata, resultProviderMetadata: output.providerMetadata });
  const args = { model: 'agent37/model', providerRequestConfigProviderKey: 'agent37', messages: [{ id: 'a', role: 'assistant', parts: [part] }] };
  const history = buildResponsesBody(args).input;
  assert.equal(history.length, 1); assert.equal(history[0].type, 'mcp_call'); assert.equal(history[0].server_label, 'aihappey');
  assert.deepEqual(JSON.parse(history[0].output), result); assert.equal(history[0].name, item.name);
  assert.deepEqual(buildResponsesBody({ ...args, model: 'other/model', providerRequestConfigProviderKey: 'other' }).input ?? [], []);
});

test('gateway MCP tool errors retain their result envelope and do not produce successful attachments', async () => {
  const result = { ...gatewayResult(), isError: true };
  const item = { ...gatewayCall('download_file', result), status: 'failed' };
  const chunks = await chunksFor([done([item])]);
  assert.deepEqual(chunks.find(chunk => chunk.type === 'tool-output-available').output, result);
  assert.equal(chunks.filter(chunk => chunk.type === 'file').length, 0);
  assert.equal(chunks.filter(chunk => chunk.type === 'error').length, 0);
});

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

// Sanitized examples of the backend's native shell fixture: the invocation item,
// API call ID, and output item are three different identities.
const shellCall = n => ({ type: 'shell_call', id: `sh_${n}`, call_id: `call_shell_${n}`, name: null,
  status: 'completed', action: { commands: ['echo "héllo"'], timeout_ms: null, max_output_length: null },
  environment: { type: 'container_reference', container_id: 'cntr_test' } });
const shellOutput = n => ({ type: 'shell_call_output', id: `sho_${n}`, call_id: `call_shell_${n}`,
  status: 'completed', max_output_length: 1000,
  output: [{ stdout: 'héllo\n', stderr: '', outcome: { type: 'exit', exit_code: 0 } }] });
const shellEvents = n => {
  const item = shellCall(n), output = shellOutput(n);
  return [
    { type: 'response.output_item.added', output_index: 0, item: { ...item, status: 'in_progress', action: { ...item.action, commands: [] } } },
    { type: 'response.shell_call_command.added', output_index: 0, command_index: 0, command: '' },
    { type: 'response.shell_call_command.delta', output_index: 0, command_index: 0, delta: 'echo "hé' },
    { type: 'response.shell_call_command.delta', output_index: 0, command_index: 0, delta: 'llo"' },
    { type: 'response.shell_call_command.done', output_index: 0, command_index: 0, command: item.action.commands[0] },
    { type: 'response.output_item.done', output_index: 0, item },
    { type: 'response.output_item.added', output_index: 1, item: { ...output, status: 'in_progress', output: [] } },
    { type: 'response.shell_call_output_content.delta', item_id: output.id, output_index: 1, command_index: 0, delta: { stdout: 'hé', stderr: '' } },
    { type: 'response.shell_call_output_content.delta', item_id: output.id, output_index: 1, command_index: 0, delta: { stdout: 'llo\n', stderr: '' } },
    { type: 'response.shell_call_output_content.done', item_id: output.id, output_index: 1, command_index: 0, output: output.output },
    { type: 'response.output_item.done', output_index: 1, item: output },
  ];
};
async function sdkFor(events, options = {}) {
  const { createResponsesContinuation } = load(base + 'responsesContinuation.ts');
  const errors = [], executions = [], requests = [], guard = createResponsesContinuation();
  const chat = new Chat({ transport: new GenericChatEndpointTransport('/v1/responses', options.providerKey ?? 'openai', undefined, {
    api: 'https://provider.test/v1/responses', fetch: async (_, init) => {
      requests.push(JSON.parse(init.body));
      assert.equal(requests.length, 1, 'hosted tools must not cause client-tool continuation');
      return nativeResponse(events, options);
    },
  }, `${options.providerKey ?? 'openai'}/model`), onError: error => errors.push(error),
    onToolCall: ({ toolCall }) => executions.push(toolCall), sendAutomaticallyWhen: args => guard.shouldSend(args) });
  await chat.sendMessage({ text: 'Run the provider tool.' });
  return { chat, errors, executions, requests, parts: chat.messages.at(-1)?.parts ?? [] };
}

test('real SDK accepts null and non-string native hosted tool names without nullable UI titles', async () => {
  for (const type of ['shell_call', 'web_search_call', 'file_search_call', 'code_interpreter_call', 'mcp_call']) {
    for (const name of [null, undefined, 42]) {
      const item = type === 'shell_call' ? { ...shellCall('nullable'), name }
        : { type, id: 'hosted_nullable', name, status: 'completed', arguments: '{}', output: { ok: true } };
      const items = type === 'shell_call' ? [item, shellOutput('nullable')] : [item];
      const events = items.flatMap((item, output_index) => [
        { type: 'response.output_item.added', item, output_index }, { type: 'response.output_item.done', item, output_index },
      ]).concat(done(items));
      const { errors, executions, parts } = await sdkFor(events);
      assert.deepEqual(errors, [], `${type}, name=${name}: ${errors.map(error => error.message)}`);
      assert.deepEqual(executions, []);
      assert.equal(parts.filter(part => part.type.startsWith('tool-')).length, 1);
    }
  }
});

test('shell commands and separate streamed output form one SDK invocation with preliminary then one final result', async () => {
  const item = shellCall(1), output = shellOutput(1);
  const events = [...shellEvents(1), { type: 'response.output_item.done', output_index: 1, item: output },
    { type: 'response.output_item.done', output_index: 0, item }, done([item, output])];
  const chunks = await chunksFor(events);
  const inputs = chunks.filter(chunk => chunk.type === 'tool-input-available');
  const results = chunks.filter(chunk => chunk.type === 'tool-output-available');
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-start').length, 1);
  assert.equal(inputs.length, 1);
  assert.equal(inputs[0].toolCallId, item.id);
  assert.deepEqual(inputs[0].input, { commands: item.action.commands });
  assert.equal(inputs[0].providerMetadata.openai.call_id, item.call_id);
  assert.equal(inputs[0].providerMetadata.openai.action.timeout_ms, null, 'native nulls are not recursively deleted');
  assert.ok(results.some(chunk => chunk.preliminary === true));
  assert.equal(results.filter(chunk => chunk.preliminary !== true).length, 1);
  assert.ok(results.every(chunk => chunk.toolCallId === item.id && chunk.providerExecuted === true));
  assert.deepEqual(results.at(-1).output.structuredContent.output, output.output);
  assert.equal(results.at(-1).providerMetadata.openai.output_item_id, output.id);
  const { errors, executions, parts } = await sdkFor(events);
  assert.deepEqual(errors, []); assert.deepEqual(executions, []);
  const tools = parts.filter(part => part.type.startsWith('tool-'));
  assert.equal(tools.length, 1); assert.equal(tools[0].type, 'tool-shell');
  assert.equal(tools[0].state, 'output-available'); assert.equal(tools[0].preliminary, false);
  assert.equal(tools[0].callProviderMetadata.openai.id, item.id);
  assert.equal(tools[0].resultProviderMetadata.openai.id, output.id);
});

test('snapshot-only recovery correlates out-of-order shell outputs and scopes metadata to the resolved provider', async () => {
  const items = [shellOutput(2), shellCall(1), shellOutput(1), shellCall(2),
    { type: 'compaction', id: 'compact_1', encrypted_content: 'opaque' },
    { type: 'message', role: 'assistant', id: 'msg_final', content: [{ type: 'output_text', text: 'Done.' }] }];
  const { errors, executions, parts } = await sdkFor([done(items)], { providerKey: 'compatible' });
  assert.deepEqual(errors, []); assert.deepEqual(executions, []);
  const tools = parts.filter(part => part.type.startsWith('tool-'));
  assert.equal(tools.length, 2);
  for (const part of tools) {
    assert.equal(part.state, 'output-available');
    assert.ok(part.callProviderMetadata.compatible);
    assert.ok(part.resultProviderMetadata.compatible);
    assert.equal(part.callProviderMetadata.openai, undefined);
    assert.equal(part.callProviderMetadata.compatible.call_id, part.resultProviderMetadata.compatible.call_id);
  }
  assert.equal(parts.filter(part => part.type === 'text').map(part => part.text).join(''), 'Done.');
});

test('completed snapshots recover hosted search, interpreter, MCP and image tools without phantom non-tool items', async () => {
  const items = ['web_search_call', 'file_search_call', 'code_interpreter_call', 'mcp_call'].map((type, index) => ({
    type, id: 'hosted_' + index, name: null, status: 'completed', arguments: '{}', output: { ok: true },
  }));
  items.push({ type: 'image_generation_call', id: 'img_snapshot', status: 'completed', result: 'aGVsbG8=', output_format: 'png' },
    { type: 'compaction', id: 'compact_1', encrypted_content: 'opaque' });
  const { errors, executions, parts } = await sdkFor([done(items)]);
  assert.deepEqual(errors, []); assert.deepEqual(executions, []);
  const tools = parts.filter(part => part.type.startsWith('tool-'));
  assert.equal(tools.length, 5);
  assert.ok(tools.every(part => part.providerExecuted === true && part.state === 'output-available'));
  assert.equal(parts.filter(part => part.type === 'file').length, 1);
});

test('persisted hosted shell parts replay complete native pairs, not client function outputs', async () => {
  const { errors, parts } = await sdkFor([...shellEvents(1), done([shellCall(1), shellOutput(1)])]);
  assert.deepEqual(errors, []);
  const saved = clone(parts), input = replay(saved);
  assert.deepEqual(input.map(item => item.type), ['shell_call', 'shell_call_output']);
  assert.equal(input[0].id, 'sh_1'); assert.equal(input[1].id, 'sho_1');
  assert.equal(input[0].call_id, input[1].call_id);
  assert.deepEqual(input[0].action, shellCall(1).action);
  assert.deepEqual(input[0].environment, shellCall(1).environment);
  assert.deepEqual(input[1].output, shellOutput(1).output);
  assert.deepEqual(replay(saved, { model: 'other/model', providerMetadata: { other: {} } }), []);
  for (const mutate of [
    part => { delete part.resultProviderMetadata; },
    part => { part.resultProviderMetadata.openai.call_id = 'unrelated'; },
    part => { part.state = 'input-streaming'; },
    part => { part.preliminary = true; },
  ]) {
    const incomplete = clone(saved); mutate(incomplete.find(part => part.type === 'tool-shell'));
    assert.deepEqual(replay(incomplete), []);
  }
});

test('parallel shells keep per-command outputs and outcomes separate when results finish out of order', async () => {
  const first = { ...shellCall(1), action: { commands: ['first', 'second'] } }, second = shellCall(2);
  const firstOutput = { ...shellOutput(1), output: [
    { stdout: '', stderr: 'permission denied', outcome: { type: 'exit', exit_code: 2 } },
    { stdout: 'partial', stderr: '', outcome: { type: 'timeout' } },
  ] };
  const events = [
    { type: 'response.output_item.added', item: first, output_index: 0 },
    { type: 'response.output_item.added', item: second, output_index: 1 },
    { type: 'response.output_item.done', item: second, output_index: 1 },
    { type: 'response.output_item.done', item: first, output_index: 0 },
    { type: 'response.output_item.added', item: { ...firstOutput, status: 'in_progress', output: [] }, output_index: 2 },
    { type: 'response.shell_call_output_content.delta', item_id: firstOutput.id, output_index: 2, command_index: 1, delta: { stdout: 'par' } },
    { type: 'response.shell_call_output_content.delta', item_id: firstOutput.id, output_index: 2, command_index: 0, delta: { stderr: 'permission ' } },
    { type: 'response.shell_call_output_content.done', item_id: firstOutput.id, output_index: 2, command_index: 1, output: [firstOutput.output[1]] },
    { type: 'response.output_item.done', item: shellOutput(2), output_index: 3 },
    { type: 'response.output_item.done', item: firstOutput, output_index: 2 },
    { type: 'response.shell_call_output_content.delta', item_id: firstOutput.id, output_index: 2, command_index: 0, delta: { stdout: 'late' } },
    done([first, second, firstOutput, shellOutput(2)]),
  ];
  const { errors, parts, executions } = await sdkFor(events);
  assert.deepEqual(errors, []); assert.deepEqual(executions, []);
  const tools = parts.filter(part => part.type === 'tool-shell');
  assert.equal(tools.length, 2);
  assert.deepEqual(tools.find(part => part.toolCallId === first.id).output.structuredContent.output, firstOutput.output);
  assert.deepEqual(tools.find(part => part.toolCallId === second.id).output.structuredContent.output, shellOutput(2).output);
});

test('shell result items can arrive before their call, and command deltas recover missing final command text', async () => {
  const item = shellCall(1), output = shellOutput(1);
  const events = [
    { type: 'response.output_item.done', item: output, output_index: 3 },
    ...shellEvents(1).slice(0, 5),
    { type: 'response.output_item.done', item: { ...item, action: { commands: [] } }, output_index: 0 },
    done([]),
  ];
  const { errors, parts } = await sdkFor(events);
  assert.deepEqual(errors, []);
  const tool = parts.find(part => part.type === 'tool-shell');
  assert.deepEqual(tool.input.commands, item.action.commands);
  assert.deepEqual(tool.output.structuredContent.output, output.output);
  const chunks = await chunksFor(events);
  assert.deepEqual(JSON.parse(chunks.filter(chunk => chunk.type === 'tool-input-delta').map(chunk => chunk.inputTextDelta).join('')),
    { commands: item.action.commands }, 'input deltas remain valid JSON after escaping and Unicode fragmentation');
});

test('snapshot recovery preserves text/tool chronology and repairs a missing live final output', async () => {
  const message = (id, text) => ({ type: 'message', id, role: 'assistant', content: [{ type: 'output_text', text }] });
  const item = shellCall(1), output = shellOutput(1);
  const { errors, parts } = await sdkFor([done([message('msg_before', 'Before.'), item, output, message('msg_after', 'After.')])]);
  assert.deepEqual(errors, []);
  assert.deepEqual(parts.filter(part => part.type !== 'step-start').map(part => part.type), ['text', 'tool-shell', 'text']);
  const chunks = await chunksFor([...shellEvents(1).slice(0, -1), done([item, output])]);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-start').length, 1);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-available').length, 1);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-output-available' && chunk.preliminary === false).length, 1);
});

test('generic hosted tools deduplicate completion snapshots and ignore late status and non-tool items', async () => {
  const item = { type: 'web_search_call', id: 'ws_dedup', name: null, title: null, status: 'completed', action: { query: 'test' } };
  const events = [
    { type: 'response.output_item.added', item: { ...item, status: 'in_progress' } },
    { type: 'response.web_search_call.searching', item_id: item.id },
    { type: 'response.output_item.done', item }, { type: 'response.output_item.done', item },
    { type: 'response.web_search_call.searching', item_id: item.id },
    { type: 'response.output_item.added', item: { type: 'compaction', id: 'compact_live' } },
    { type: 'response.output_item.done', item: { type: 'compaction', id: 'compact_live' } }, done([item]),
  ];
  const chunks = await chunksFor(events);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-input-available').length, 1);
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-output-available').length, 1);
  const { errors, parts } = await sdkFor(events);
  assert.deepEqual(errors, []);
  assert.equal(parts.filter(part => part.type.startsWith('tool-')).length, 1);
  assert.equal(parts.find(part => part.type === 'tool-web_search').state, 'output-available');
});

test('image completion snapshots and late partial-image events cannot regress a finalized tool or duplicate its file', async () => {
  const item = { type: 'image_generation_call', id: 'img_live', status: 'completed', result: 'aGVsbG8=', output_format: 'png' };
  const events = [
    { type: 'response.output_item.added', item: { ...item, status: 'in_progress', result: undefined } },
    { type: 'response.output_item.done', item }, { type: 'response.output_item.done', item },
    { type: 'response.image_generation_call.partial_image', item_id: item.id, partial_image_b64: 'bGF0ZQ==' }, done([item]),
  ];
  const { errors, parts } = await sdkFor(events);
  assert.deepEqual(errors, []);
  const tools = parts.filter(part => part.type.startsWith('tool-'));
  assert.equal(tools.length, 1); assert.equal(tools[0].state, 'output-available');
  assert.equal(parts.filter(part => part.type === 'file').length, 1);
  const chunks = await chunksFor(events);
  const lastOutputIndex = chunks.findIndex(chunk => chunk.type === 'tool-output-available');
  assert.ok(!chunks.slice(lastOutputIndex + 1).some(chunk => chunk.type === 'tool-input-available'));
});

test('provider-hosted tool errors remain tool errors and cannot be replayed as successful shell results', async () => {
  for (const items of [
    [{ type: 'mcp_call', id: 'mcp_failed', name: null, status: 'failed', arguments: '{}', error: { message: 'Permission denied' } }],
    [shellCall(1), { ...shellOutput(1), status: 'failed', error: { message: 'Container unavailable' } }],
  ]) {
    const { errors, parts, executions } = await sdkFor([done(items)]);
    assert.deepEqual(errors, []); assert.deepEqual(executions, []);
    const tool = parts.find(part => part.type.startsWith('tool-'));
    assert.equal(tool.state, 'output-error'); assert.equal(tool.providerExecuted, true);
    assert.deepEqual(replay(clone(parts)), []);
  }
});

test('native program and tool-search results correlate to one hosted invocation, including snapshot-only results first', async () => {
  for (const [type, resultType] of [['program', 'program_output'], ['tool_search_call', 'tool_search_output']]) {
    const item = { type, id: 'native_call_item', call_id: 'native_call_id', name: null, status: 'completed', arguments: {} };
    const result = { type: resultType, id: 'native_result_item', call_id: item.call_id, status: 'completed', output: { found: true } };
    for (const events of [[done([result, item])], [
      { type: 'response.output_item.added', item }, { type: 'response.output_item.done', item },
      { type: 'response.output_item.done', item: result }, done([item, result]),
    ]]) {
      const { errors, executions, parts } = await sdkFor(events);
      assert.deepEqual(errors, []); assert.deepEqual(executions, []);
      const tools = parts.filter(part => part.type.startsWith('tool-'));
      assert.equal(tools.length, 1); assert.deepEqual(tools[0].output, { found: true });
      assert.equal(tools[0].resultProviderMetadata.openai.id, result.id);
    }
  }
});

test('unfinished shell requests and terminal failures never manufacture final tool results or continue', async () => {
  for (const events of [
    [...shellEvents(1).slice(0, 6), done([])],
    [...shellEvents(1).slice(0, -1), { type: 'response.failed', response: { error: { message: 'Provider failed' } } }],
    [...shellEvents(1).slice(0, -1), { type: 'response.incomplete', response: { incomplete_details: { reason: 'max_output_tokens' } } }],
    shellEvents(1).slice(0, -1),
  ]) {
    const chunks = await chunksFor(events, { appendDone: false });
    assert.ok(chunks.some(chunk => chunk.type === 'error'));
    assert.equal(chunks.filter(chunk => chunk.type === 'tool-output-available' && chunk.preliminary !== true).length, 0);
    assert.equal(chunks.filter(chunk => chunk.type === 'finish').length, 0);
    const { errors, executions, requests, chat } = await sdkFor(events, { appendDone: false });
    assert.equal(errors.length, 1); assert.deepEqual(executions, []);
    assert.equal(requests.length, 1); assert.equal(chat.status, 'error');
  }
});

test('malformed or local shell calls fail safely without executing tools or inventing results', async () => {
  for (const items of [
    [{ ...shellCall(1), id: 42 }, shellOutput(1)],
    [{ ...shellCall(1), call_id: null }, shellOutput(1)],
    [{ ...shellCall(1), action: { commands: [42] } }, shellOutput(1)],
    [shellCall(1), { ...shellOutput(1), call_id: 'unmatched' }],
    [shellCall(1), { ...shellOutput(1), output: undefined }],
    [{ ...shellCall(1), environment: { type: 'local' } }],
  ]) {
    const { errors, executions, chat } = await sdkFor([done(items)]);
    assert.equal(errors.length, 1); assert.equal(chat.status, 'error'); assert.deepEqual(executions, []);
  }
});

test('shell correlation is isolated across concurrent streams using identical native IDs', async () => {
  const results = await Promise.all(['first private output', 'second private output'].map(stdout => sdkFor([
    done([shellCall(1), { ...shellOutput(1), output: [{ stdout, stderr: '', outcome: { type: 'exit', exit_code: 0 } }] }]),
  ])));
  results.forEach(({ errors, parts }, index) => {
    assert.deepEqual(errors, []);
    assert.equal(parts.find(part => part.type === 'tool-shell').output.structuredContent.output[0].stdout,
      index === 0 ? 'first private output' : 'second private output');
  });
  const orphan = await sdkFor([done([shellOutput(1)])]);
  assert.equal(orphan.errors.length, 1);
  assert.equal(orphan.parts.filter(part => part.type.startsWith('tool-')).length, 0);
});

test('cancelling preliminary shell output cancels the upstream reader without a fabricated final result', async () => {
  let upstreamCancelled = false;
  const source = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode(shellEvents(1).slice(0, -1).map(event => 'data: ' + JSON.stringify(event) + '\n\n').join('')));
  }, cancel() { upstreamCancelled = true; } });
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/responses', providerKey: 'openai', fetcher: async () => new Response(source) });
  const reader = (await fetcher('https://provider.test/v1/responses')).body.getReader();
  let streamed = '';
  while (!streamed.includes('"preliminary":true')) streamed += new TextDecoder().decode((await reader.read()).value);
  await reader.cancel('stopped');
  assert.equal(upstreamCancelled, true);
  assert.ok(!streamed.includes('"preliminary":false'));
});

for (const route of ['direct', 'gateway']) test(`real SDK ${route} mixed hosted/client continuation and reloaded follow-up replay shell pairs natively`, async () => {
  const { createResponsesContinuation } = load(base + 'responsesContinuation.ts');
  const requests = [], errors = [], executions = [], item = call('mixed');
  const transport = new GenericChatEndpointTransport('/v1/responses', route === 'direct' ? 'openai' : undefined, undefined, {
    api: `https://${route}.test/v1/responses`,
    prepareSendMessagesRequest: ({ messages }) => ({ body: buildResponsesBody({ model: route === 'direct' ? 'model' : 'openai/model',
      providerRequestConfigProviderKey: 'openai', messages }) }),
    fetch: async (_, init) => {
      const request = JSON.parse(init.body); requests.push(request);
      assert.ok(requests.length <= 3);
      if (requests.length === 1) return nativeResponse([...shellEvents(1), { type: 'response.output_item.done', item },
        done([shellCall(1), shellOutput(1), item])]);
      assert.deepEqual(request.input.filter(item => item.type.startsWith('shell_')).map(item => item.type), ['shell_call', 'shell_call_output']);
      assert.equal(request.input.filter(item => item.type === 'function_call_output').length, 1);
      assert.equal(request.input.find(item => item.type === 'function_call_output').call_id, 'call_mixed');
      assert.equal(request.previous_response_id, undefined);
      return nativeResponse(finalEvents(requests.length === 2 ? 'Finished.' : 'I remember the shell output.'));
    },
  }, 'openai/model');
  const guard = createResponsesContinuation();
  let chat;
  chat = new Chat({ transport, onError: error => errors.push(error), sendAutomaticallyWhen: args => guard.shouldSend(args),
    onToolCall: ({ toolCall }) => {
      executions.push(toolCall.toolCallId);
      chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } });
    } });
  await chat.sendMessage({ text: 'Run shell and the client tool.' });
  assert.deepEqual(errors, []); assert.deepEqual(executions, ['call_mixed']); assert.equal(requests.length, 2);
  const restoredGuard = createResponsesContinuation();
  const restored = new Chat({ transport, messages: clone(chat.messages), onError: error => errors.push(error),
    sendAutomaticallyWhen: args => restoredGuard.shouldSend(args) });
  await restored.sendMessage({ text: 'What did the shell print?' });
  assert.deepEqual(errors, []); assert.equal(requests.length, 3);
  assert.equal(restored.messages.at(-1).parts.find(part => part.type === 'text').text, 'I remember the shell output.');
});
