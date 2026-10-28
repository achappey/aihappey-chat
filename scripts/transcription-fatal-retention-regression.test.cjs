const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

async function harness(provider = 'openai', delayPreview = false) {
  let events, release, stopped = 0;
  const writes = [], deleted = [], alerts = [];
  const pending = new Promise(resolve => { release = resolve; });
  const state = { customHeaders: {}, providerRealtimeMetadata: {}, setRealtimeSessionState() {}, resetRealtimeSessionState() {} };
  const mocks = {
    react: { useRef: current => ({ current }), useMemo: f => f(), useCallback: f => f, useEffect() {} },
    'aihappey-state': { useAppStore: select => select(state) },
    'aihappey-i18n': { useTranslation: () => ({ t: s => s }) },
    'aihappey-ai': { getRealtimeToken: async () => async () => ({ value: 'ephemeral-secret' }) },
    '../../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}) },
    './startRealtimeWebrtcSession': { startRealtimeWebrtcSession: async args => { events = args.events; return { stop: async () => { stopped++; } }; } },
    './realtimeProviders': { parseProviderIdFromModelId: id => id.split('/')[0] },
    '../transcriptionErrors': { getTranscriptionErrorMessage: e => String(e) },
    '../../realtime/googleLiveConfig': { buildGoogleLiveTokenPayload: () => ({}) },
  };
  const file = path.resolve(__dirname, '../packages/aihappey-core/src/features/transcriptions/realtime/useRealtimeTranscriptionController.ts');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => { assert.ok(id in mocks, id); return mocks[id]; }, module, module.exports);
  const controller = module.exports.useRealtimeTranscriptionController({ config: { baseUrl: 'https://gateway/', endpoints: { realtime: 'token' } },
    selectedModel: { id: `${provider}/transcribe`, tags: ['real-time'] }, onErrorAlert: e => alerts.push(e),
    transcriptions: { add: async () => ({ id: 'item' }), update: async (id, value) => { if (delayPreview && writes.length === 0) await pending; writes.push(structuredClone(value.transcription)); }, delete: async id => deleted.push(id) } });
  await controller.start();
  return { events, writes, deleted, alerts, release, stopped: () => stopped };
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function settled(h) { for (let n = 0; n < 100 && !h.stopped(); n++) await pause(5); assert.equal(h.stopped(), 1); }

test('OpenAI fatal error preserves finalized text even without speech timestamps and cancels pending previews', async () => {
  const h = await harness();
  h.events.onEvent({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'a', transcript: 'Confirmed words' });
  h.events.onTranscriptText('Confirmed words unfinished draft');
  h.events.onError('Disconnected'); h.events.onError('duplicate');
  await settled(h); await pause(450);
  assert.deepEqual(h.deleted, []); assert.equal(h.writes.at(-1).text, 'Confirmed words');
  assert.equal(h.writes.at(-1).response.body.status, 'error'); assert.equal(h.writes.length, 1);
});
test('fatal checkpoint follows an in-flight preview write and late callbacks cannot overwrite it', async () => {
  const h = await harness('openai', true);
  h.events.onEvent({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'a', transcript: 'Final' });
  h.events.onTranscriptText('Final draft'); await pause(450);
  h.events.onError('Disconnected'); h.events.onTranscriptText('late preview');
  h.events.onEvent({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'late', transcript: 'late callback' });
  h.release(); await settled(h); await pause(450);
  assert.equal(h.writes.at(-1).text, 'Final'); assert.equal(h.writes.at(-1).response.body.status, 'error'); assert.deepEqual(h.deleted, []);
});
test('interim-only failed session is deleted rather than saved as confirmed', async () => {
  const h = await harness(); h.events.onTranscriptText('unconfirmed'); h.events.onError('Disconnected');
  await settled(h); await pause(450); assert.deepEqual(h.deleted, ['item']); assert.deepEqual(h.writes, []);
});
test('Google fatal error retains authoritative final instead of newer interim', async () => {
  const h = await harness('google'); h.events.onEvent({ setupComplete: {} });
  h.events.onEvent({ serverContent: { inputTranscription: { text: 'Google final' } } });
  h.events.onTranscriptText('Google final provisional'); h.events.onError('Disconnected');
  await settled(h); assert.equal(h.writes.at(-1).text, 'Google final'); assert.deepEqual(h.deleted, []);
});
test('Gladia fatal error retains timed final utterances but excludes partial text', async () => {
  const h = await harness('gladia');
  h.events.onEvent({ type: 'transcript', data: { is_final: true, utterance: { text: 'Gladia final', start: 1, end: 2 } } });
  h.events.onTranscriptText('Gladia final partial'); h.events.onError('Disconnected');
  await settled(h); assert.equal(h.writes.at(-1).text, 'Gladia final'); assert.equal(h.writes.at(-1).segments[0].startSecond, 1);
});
