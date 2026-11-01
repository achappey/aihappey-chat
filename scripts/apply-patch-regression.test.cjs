const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const base = 'packages/aihappey-core/src/features/';
function load(file, mocks = {}, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  const module = { exports: {} }; cache.set(file, module.exports);
  new Function('require', 'module', 'exports', code)(id => {
    if (id in mocks) return mocks[id];
    if (id === 'aihappey-components') return { canonicalizeAnthropicTools: value => value };
    if (!id.startsWith('.')) return require(id);
    const target = path.resolve(path.dirname(file), id);
    const resolved = ['', '.ts', '.tsx', '/index.ts'].map(ext => target + ext).find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    return load(resolved, mocks, cache);
  }, module, module.exports);
  cache.set(file, module.exports); return module.exports;
}
const { applyDiff } = load(base + 'tools/applyPatch/applyDiff.ts');
const { executeBrowserPatch, flatPatchPath, getOpenAIApplyPatchConfig } = load(base + 'tools/applyPatch/browserApplyPatch.ts');

test('V4A reference handles create, empty files, multiple hunks, anchors, whitespace and EOF', () => {
  assert.equal(applyDiff('', '+a\n+b\n', 'create'), 'a\nb');
  assert.equal(applyDiff('', '', 'create'), '');
  assert.equal(applyDiff('a\nb\nc\n', '@@\n-a\n+A\n@@\n-c\n+C\n*** End of File'), 'A\nb\nC\n');
  assert.equal(applyDiff('a\nb', '@@\n-b\n+B\n*** End of File'), 'a\nB');
  assert.equal(applyDiff('a\r\nb\r\n', '@@\n-a\n+A'), 'A\r\nb\r\n');
  assert.equal(applyDiff('one\n\ntwo', '@@ one\n@@ two\n+three'), 'one\n\ntwo\nthree');
  assert.throws(() => applyDiff('a', '@@\n-missing\n+b'), /Context/);
  assert.throws(() => applyDiff('', 'not a creation', 'create'), /Invalid Add/);
});

test('browser rejects paths rather than silently flattening them', () => {
  for (const p of ['src/file.ts', 'src\\file.ts', '../file.txt', '/file.txt', '.', '..', 'x:y', '', ' file.txt']) assert.throws(() => flatPatchPath(p));
  assert.equal(flatPatchPath('file.ts'), 'file.ts');
  assert.equal(getOpenAIApplyPatchConfig({ tools: [{ type: 'apply_patch' }] }).type, 'apply_patch');
  assert.equal(getOpenAIApplyPatchConfig({}), undefined);
});

test('browser ordered create/update/delete preserves identity and storage failures preserve prior content', async () => {
  global.window = {};
  let persisted = [], fail = false;
  const { IndexedDBFileStore } = load('packages/aihappey-files/src/stores/IndexedDBFileStore.ts', {
    'idb-keyval': { get: async () => persisted, set: async (_, data) => { if (fail) throw Error('Disk quota'); persisted = data; } },
  });
  const files = new IndexedDBFileStore();
  const run = (type, name, diff, enabled = true) => executeBrowserPatch(files, { operation: { type, path: name, diff } }, enabled, () => true, () => 'text/plain');
  const results = await Promise.all([run('create_file', 'test.txt', '+one'), run('update_file', 'test.txt', '@@\n-one\n+two')]);
  assert.ok(results.every(result => !result.isError));
  const original = (await files.list())[0]; assert.equal(await original.data.text(), 'two');
  assert.equal((await run('create_file', 'test.txt', '+no')).structuredContent.status, 'failed');
  assert.equal((await run('update_file', 'test.txt', '@@\n-missing\n+no')).structuredContent.status, 'failed');
  fail = true;
  assert.equal((await run('update_file', 'test.txt', '@@\n-two\n+lost')).structuredContent.status, 'failed');
  fail = false;
  assert.equal(await (await files.read(original.id)).data.text(), 'two');
  assert.equal((await run('update_file', 'test.txt', '@@\n-two\n+three')).structuredContent.status, 'completed');
  const updated = await files.read(original.id);
  assert.equal(updated.id, original.id); assert.equal(updated.createdAt, original.createdAt);
  assert.equal((await run('delete_file', 'test.txt', undefined, false)).structuredContent.status, 'failed');
  assert.equal((await run('delete_file', 'test.txt')).structuredContent.status, 'completed');
  assert.equal((await files.list()).length, 0);
  assert.equal((await run('delete_file', 'test.txt')).structuredContent.status, 'failed');
  await files.create({ name: 'same.txt', mimeType: 'text/plain', data: new Blob(['a']) });
  await files.create({ name: 'same.txt', mimeType: 'text/plain', data: new Blob(['b']) });
  assert.match((await run('delete_file', 'same.txt')).structuredContent.output, /Multiple files/);
  delete global.window;
});

test('Responses replay retains native calls/results, distinct identifiers, failure and denial', () => {
  const { buildResponsesBody } = load(base + 'chat/engine/genericEndpointMappers/responsesMapper.ts');
  const part = { type: 'tool-apply_patch', toolCallId: 'call_1', state: 'output-available', providerExecuted: false,
    callProviderMetadata: { openai: { type: 'apply_patch_call', id: 'apc_item', call_id: 'call_1' } },
    input: { operation: { type: 'create_file', path: 'test.txt', diff: '+hello' } },
    output: { isError: false, structuredContent: { status: 'completed', output: 'Created test.txt' } } };
  const map = () => buildResponsesBody({ model: 'openai/gpt-5.1', messages: [{ role: 'assistant', parts: [part] }], tools: [], providerRequestConfig: { tools: [{ type: 'apply_patch' }] } });
  const input = map().input;
  assert.deepEqual(input.map(item => item.type), ['apply_patch_call', 'apply_patch_call_output']);
  assert.equal(input[0].id, 'apc_item'); assert.equal(input[0].call_id, 'call_1');
  assert.equal(input[1].output, 'Created test.txt'); assert.equal(input[1].status, 'completed');
  part.output = { isError: true, structuredContent: { status: 'failed', output: 'Conflict' } };
  assert.equal(map().input[1].status, 'failed');
  part.approval = { approved: false, reason: 'Denied' };
  assert.equal(map().input[1].output, 'Denied');
});

test('fragmented native Responses stream executes only completed calls and deduplicates snapshots', async () => {
  const { wrapGenericChatFetch } = load(base + 'chat/engine/genericChatEndpoint.ts', {
    'aihappey-ai': { DefaultChatTransport: class {} },
    './genericEndpointMappers': { buildGenericChatEndpointBody: (_, body) => body },
    '../../playground/playgroundChat': { extractPlaygroundStreamText: () => '' },
  });
  const item = { type: 'apply_patch_call', id: 'apc_item', call_id: 'call_1', status: 'completed', operation: { type: 'create_file', path: 'test.txt', diff: '+hello' } };
  const events = [
    { type: 'response.output_item.added', output_index: 0, item: { ...item, status: 'in_progress', operation: { ...item.operation, diff: '' } } },
    { type: 'response.output_item.done', output_index: 0, item },
    { type: 'response.output_item.done', output_index: 0, item },
    { type: 'response.completed', response: { id: 'resp_1', output: [item] } },
  ];
  const raw = events.map(event => 'data: ' + JSON.stringify(event) + '\n\n').join('') + 'data: [DONE]\n\n';
  const source = new ReadableStream({ start(controller) { const bytes = new TextEncoder().encode(raw); for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7)); controller.close(); } });
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/responses', providerKey: 'openai', fetcher: async () => new Response(source) });
  const response = await fetcher('https://example.test/v1/responses', { body: JSON.stringify({ model: 'openai/gpt-5.1' }) });
  const chunks = (await response.text()).split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)));
  const calls = chunks.filter(chunk => chunk.type === 'tool-input-available');
  assert.equal(calls.length, 1); assert.equal(calls[0].providerExecuted, false); assert.equal(calls[0].toolCallId, 'call_1');
  assert.deepEqual(calls[0].input, { operation: item.operation });
  assert.equal(calls[0].providerMetadata.openai.id, 'apc_item');
  assert.equal(chunks.filter(chunk => chunk.type === 'tool-output-available').length, 0);
});

test('both forms put the toggle between Shell and File search and retain minimal canonical config', () => {
  const source = fs.readFileSync('packages/aihappey-components/src/forms/providers/openai/OpenAIChatConfigForm.tsx', 'utf8');
  assert.ok(source.indexOf('<OpenAIShellForm') < source.indexOf('id="openai-apply-patch-enabled"'));
  assert.ok(source.indexOf('id="openai-apply-patch-enabled"') < source.indexOf('<OpenAIFileSearchForm'));
  const { buildCanonicalProviderToolsConfig } = load('packages/aihappey-components/src/forms/providers/providerToolConfig.ts');
  const types = ['shell', 'apply_patch', 'file_search'];
  const enabled = buildCanonicalProviderToolsConfig({ apply_patch: { type: 'apply_patch' } }, types);
  assert.deepEqual(enabled.tools, [{ type: 'apply_patch' }]);
  const disabled = buildCanonicalProviderToolsConfig({ ...enabled, apply_patch: undefined }, types);
  assert.ok(!disabled.tools?.some(tool => tool.type === 'apply_patch'));
});

test('browser native stream-to-files-to-native-continuation completes create/update/delete', async () => {
  global.window = {};
  const { IndexedDBFileStore } = load('packages/aihappey-files/src/stores/IndexedDBFileStore.ts', {
    'idb-keyval': { get: async () => [], set: async () => {} },
  });
  const files = new IndexedDBFileStore();
  const { buildResponsesBody } = load(base + 'chat/engine/genericEndpointMappers/responsesMapper.ts');
  const { wrapGenericChatFetch } = load(base + 'chat/engine/genericChatEndpoint.ts', {
    'aihappey-ai': { DefaultChatTransport: class {} },
    './genericEndpointMappers': { buildGenericChatEndpointBody: (_, body) => buildResponsesBody(body) },
    '../../playground/playgroundChat': { extractPlaygroundStreamText: () => '' },
  });
  const parts = [], requests = [];
  const operations = [
    { type: 'create_file', path: 'flow.txt', diff: '+first' },
    { type: 'update_file', path: 'flow.txt', diff: '@@\n-first\n+second' },
    { type: 'delete_file', path: 'flow.txt' },
  ];
  let turn = 0;
  const fetcher = wrapGenericChatFetch({ endpoint: '/v1/responses', providerKey: 'openai', fetcher: async (_, init) => {
    const request = JSON.parse(init.body); requests.push(request);
    const current = turn++;
    if (current > 0) {
      const outputs = request.input.filter(item => item.type === 'apply_patch_call_output');
      assert.equal(outputs.length, current);
      assert.ok(outputs.every(output => output.status === 'completed'));
      assert.ok(!request.input.some(item => item.type === 'function_call_output'));
    }
    const item = current < operations.length ? { type: 'apply_patch_call', id: 'apc_' + current, call_id: 'call_' + current, status: 'completed', operation: operations[current] } : null;
    const events = item ? [{ type: 'response.output_item.done', output_index: 0, item }] : [{ type: 'response.output_text.delta', item_id: 'final', delta: 'Done.' }];
    events.push({ type: 'response.completed', response: { id: 'resp_' + current, status: 'completed', output: item ? [item] : [] } });
    return new Response(events.map(event => 'data: ' + JSON.stringify(event) + '\n\n').join('') + 'data: [DONE]\n\n');
  } });
  for (let round = 0; round < 4; round++) {
    const response = await fetcher('https://example.test/v1/responses', { body: JSON.stringify({ model: 'openai/gpt-5.1',
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'Edit files.' }] }, { role: 'assistant', parts }],
      tools: [], providerRequestConfig: { tools: [{ type: 'apply_patch' }] } }) });
    const chunks = (await response.text()).split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)));
    for (const call of chunks.filter(chunk => chunk.type === 'tool-input-available')) {
      const output = await executeBrowserPatch(files, call.input, true, () => true, () => 'text/plain');
      assert.equal(output.structuredContent.status, 'completed');
      // The application reviews input/output after execution; the persisted SDK part
      // supplied on continuation carries the answered approval and unchanged result.
      parts.push({ type: 'tool-apply_patch', toolCallId: call.toolCallId, input: call.input, output,
        providerExecuted: false, callProviderMetadata: call.providerMetadata,
        state: 'approval-responded', approval: { id: call.toolCallId, approved: true } });
    }
    if (round === 0) assert.equal(await (await files.list())[0].data.text(), 'first');
    if (round === 1) assert.equal(await (await files.list())[0].data.text(), 'second');
    if (round === 3) assert.ok(chunks.some(chunk => chunk.type === 'text-delta' && chunk.delta === 'Done.'));
  }
  assert.equal(requests.length, 4); assert.equal(parts.length, 3); assert.equal((await files.list()).length, 0);
  delete global.window;
});
