const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const module = { exports: {} };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('.')) return load(path.join(path.dirname(file), id + '.ts'), mocks);
    throw new Error('Unmocked import: ' + id);
  }, module, module.exports);
  return module.exports;
}
const root = 'packages/aihappey-core/src/features/realtime/';
test('legacy OpenAI startup retains Realtime audio, VAD, voice, tools and explicit null overrides', () => {
  const { buildOpenAiRealtimeSessionConfig } = load(root + 'openAiRealtimeConversationProvider.ts', {
    'aihappey-ai': {}, './startRealtimeConversationWebrtc': {},
    '../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}) },
    './realtimeMessageParts': { stripProviderPrefix: s => s.slice(s.indexOf('/') + 1), mcpToolToRealtimeFunctionTool: t => ({ ...t, type: 'function' }) },
  });
  const result = buildOpenAiRealtimeSessionConfig({ model: 'openai/gpt-realtime-2', instructions: 'hello', tools: [{ name: 'lookup' }], providerRealtimeConversationMetadata: { openai: { session: { type: 'realtime', audio: { input: { turn_detection: null }, output: { voice: 'cedar' } } } } } });
  assert.equal(result.type, 'realtime'); assert.equal(result.model, 'gpt-realtime-2');
  assert.equal(result.instructions, 'hello'); assert.equal(result.audio.input.turn_detection, null);
  assert.equal(result.audio.output.voice, 'cedar'); assert.equal(result.tools[0].name, 'lookup');
});
test('other realtime provider implementations remain independently registered', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', root + 'realtimeConversationProviders.ts'), 'utf8');
  for (const provider of ['google', 'spacexai', 'cartesia', 'assemblyai']) assert.match(source, new RegExp(provider + ':'));
});
module.exports = { load };
