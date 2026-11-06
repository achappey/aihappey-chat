const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  cache.set(file, module.exports);
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'aihappey-components') return { canonicalizeAnthropicTools: value => value };
    if (!id.startsWith('.')) return require(id);
    const target = path.resolve(path.dirname(file), id);
    const resolved = ['', '.ts', '.tsx', '/index.ts'].map(ext => target + ext)
      .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    return load(resolved, cache);
  }, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}

const endpoints = [
  ['chatCompletions', '/v1/chat/completions', 'buildChatCompletionsBody'],
  ['messages', '/v1/messages', 'buildMessagesBody'],
  ['responses', '/v1/responses', 'buildResponsesBody'],
];
const extensions = { future_null: null, future_object: { nested: [1, false, null] },
  future_empty: {}, future_array: [], future_false: false, future_zero: 0, future_string: 'literal' };

for (const [coreName, endpoint, buildName] of endpoints) {
  const build = load(`packages/aihappey-core/src/features/chat/engine/genericEndpointMappers/${coreName}Mapper.ts`)[buildName];
  const invoke = request => build({ ...request, messages: [{ id: 'user', role: 'user', parts: [{ type: 'text', text: 'hello' }] }] });
  test(`chat ${endpoint}: selected-provider root fields, native metadata and unknown JSON survive`, () => {
    const provider = endpoint === '/v1/messages' ? 'anthropic' : 'openai';
    const config = { ...extensions, service_tier: 'priority', metadata: { user_id: 'user', tag: 'application' } };
    const request = { endpoint, model: `${provider}/model`, providerMetadata: { ignored: { leak: true }, [provider]: config } };
    const before = structuredClone(request);
    const body = JSON.parse(JSON.stringify(invoke(request)));
    for (const [key, value] of Object.entries(extensions)) assert.deepEqual(body[key], value, key);
    assert.equal(body.service_tier, 'priority');
    assert.deepEqual(body.metadata, config.metadata);
    for (const key of ['openai', 'anthropic', 'providerOptions', 'providerMetadata', 'leak'])
      assert.equal(Object.hasOwn(body, key), false, key);
    assert.deepEqual(request, before, 'building a request must not mutate settings');
  });

  test(`chat ${endpoint}: provider settings do not create metadata; explicit null metadata survives`, () => {
    const provider = endpoint === '/v1/messages' ? 'anthropic' : 'openai';
    const request = { endpoint, model: `${provider}/model`, providerMetadata: { [provider]: { service_tier: 'auto' } } };
    assert.equal(Object.hasOwn(invoke(request), 'metadata'), false);
    const body = invoke({ ...request, providerRequestConfig: { metadata: null, future_null: null } });
    assert.equal(body.metadata, null);
    assert.equal(body.future_null, null);
  });
}

test('Responses-to-Responses keeps native reasoning, tools and text at the root', () => {
  const { buildResponsesBody } = load('packages/aihappey-core/src/features/chat/engine/genericEndpointMappers/responsesMapper.ts');
  const native = { reasoning: { effort: 'high', summary: 'auto', future: null }, text: { verbosity: 'low' },
    tools: [{ type: 'web_search' }], ...extensions };
  const request = { model: 'openai/model', providerMetadata: { openai: native }, messages: [] };
  const body = buildResponsesBody(request);
  assert.deepEqual(body.reasoning, native.reasoning);
  assert.deepEqual(body.text, native.text);
  assert.deepEqual(body.tools, native.tools);
  assert.equal(Object.hasOwn(body, 'metadata'), false);
});

for (const direct of [false, true]) {
  test(`side-inference Responses emits native root settings (${direct ? 'direct' : 'gateway'})`, async () => {
    const file = 'packages/aihappey-core/src/runtime/chat-app/sideInferenceAgentCall.ts';
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    const stubs = {
      '../../features/provider-credentials/providerAuthHeaders': {
        getProviderKeyFromModelId: () => 'openai', createChatAuthHeadersForModel: () => ({}),
        createProviderBearerHeadersForProviderKey: () => ({}), getExactProviderApiKeyHeaderEntry: () => ['key', 'test'],
      },
      '../../features/chat/engine/endpointProfiles': { resolveProviderRequestModelId: () => 'model' },
      '../../features/chat/engine/genericChatEndpoint': { isGenericChatEndpoint: () => true },
      '../providers/providerRequestConfig': { sanitizeProviderRequestConfigForProvider: config => config },
      '../providers/providerMetadata': { PROVIDERS: {} },
    };
    new Function('require', 'module', 'exports', code)(id => stubs[id], module, module.exports);
    const config = { reasoning: { effort: 'high' }, ...extensions, metadata: { tag: 'application' } };
    let sent;
    const result = await module.exports.invokeSideInferenceAgent({
      feature: 'welcomeMessage', input: 'hello', baseUrl: 'https://gateway.test', gatewayEnabled: !direct,
      agentName: 'helper', agents: [{ name: 'helper', instructions: 'Reply.', model: { id: 'openai/model', providerMetadata: config } }],
      models: [{ id: 'openai/model', sourceProviderKey: 'openai', ...(direct ? { route: 'direct' } : {}) }],
      providers: { openai: { apiBaseUrl: 'https://provider.test', chatEndpoints: ['/v1/responses'] } },
      fetch: async (_url, init) => { sent = JSON.parse(init.body); return Response.json({ output_text: 'done' }); },
    });
    assert.equal(result, 'done');
    assert.deepEqual(sent.reasoning, config.reasoning);
    assert.deepEqual(sent.metadata, config.metadata);
    for (const [key, value] of Object.entries(extensions)) assert.deepEqual(sent[key], value, key);
    assert.equal(Object.hasOwn(sent.metadata, 'openai'), false);
  });
}
