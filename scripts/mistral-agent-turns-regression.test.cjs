const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function harness() {
  let now = 0, next = 0;
  const timers = new Map();
  const setTimer = (callback, delay) => { const id = ++next; timers.set(id, { at: now + delay, callback }); return id; };
  const clearTimer = id => timers.delete(id);
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const entry = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry || entry[1].at > end) break;
      now = entry[1].at; timers.delete(entry[0]); entry[1].callback();
    }
    now = end;
  }
  const file = path.resolve(__dirname, '../packages/aihappey-core/src/features/realtime/agentTranscriptionTurns.ts');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'setTimeout', 'clearTimeout', code)(
    id => { throw new Error(`Unexpected dependency: ${id}`); }, module, module.exports, setTimer, clearTimer);
  const h = { starts: 0, previews: [], turns: [], advance, Turns: module.exports.AgentTranscriptionTurns };
  h.controller = new module.exports.AgentTranscriptionTurns('mistral', {
    start: () => h.starts++, preview: text => h.previews.push(text), turn: text => h.turns.push(text),
  });
  h.delta = text => h.controller.event({ type: 'transcription.text.delta', text });
  h.final = text => h.controller.event({ type: 'transcription.done', text });
  return h;
}

test('Mistral previews concatenate tokens verbatim and submit only after a silence boundary', () => {
  const h = harness();
  h.controller.activity(true); h.delta(' '); h.advance(2000);
  assert.equal(h.starts, 0); assert.deepEqual(h.turns, []);
  for (const text of ['Hel', 'lo', ',', ' world', '!', '\n']) h.delta(text);
  assert.equal(h.previews.at(-1), 'Hello, world!');
  assert.equal(h.starts, 1);
  h.advance(2000); assert.deepEqual(h.turns, []); // Still speaking.
  h.controller.activity(false);
  h.advance(899); assert.deepEqual(h.turns, []);
  h.advance(1); assert.deepEqual(h.turns, ['Hello, world!']);
  h.final(' Hello, world!\n'); h.final(' Hello, world!\n'); h.delta('late');
  h.advance(2000);
  assert.deepEqual(h.turns, ['Hello, world!']);
});

test('successive identical Mistral utterances are not deduplicated by text', () => {
  const h = harness();
  for (let i = 0; i < 2; i++) {
    h.controller.activity(true); h.delta(' Yes.'); h.controller.activity(false); h.advance(900);
  }
  assert.deepEqual(h.turns, ['Yes.', 'Yes.']); assert.equal(h.starts, 2);
  h.final(' Yes. Yes.');
  assert.deepEqual(h.turns, ['Yes.', 'Yes.']);
});

test('Mistral final submits only the unsubmitted tail and is authoritative before the first turn', () => {
  const h = harness();
  h.delta('First.'); h.advance(900);
  h.controller.activity(true); h.delta(' Second');
  h.final('First. Second corrected.');
  h.advance(2000);
  assert.deepEqual(h.turns, ['First.', 'Second corrected.']);
  const corrected = harness(); corrected.delta('draft'); corrected.final('Corrected.');
  assert.deepEqual(corrected.turns, ['Corrected.']);
});

test('corrections to an already submitted Mistral prefix cannot replay the conversation', () => {
  const h = harness(); h.delta('Original.'); h.advance(900);
  h.final('Corrected original.'); h.advance(2000);
  assert.deepEqual(h.turns, ['Original.']);
});

test('Mistral mute/reset advances the stream cursor and final cannot resurrect discarded text', () => {
  const h = harness(); h.delta('Discard.'); h.controller.setMuted(true);
  h.delta(' In-flight muted words.'); h.advance(2000);
  assert.deepEqual(h.turns, []);
  h.controller.setMuted(false); h.controller.activity(true); h.delta(' Keep.');
  h.controller.activity(false); h.advance(900);
  h.final('Discard. In-flight muted words. Keep.');
  assert.deepEqual(h.turns, ['Keep.']);
  const reset = harness(); reset.delta('Discard.'); reset.controller.reset(); reset.final('Discard.');
  assert.deepEqual(reset.turns, []);
});

test('Mistral whitespace never interrupts, late tokens extend the pending turn, and disposal cancels timers', () => {
  const h = harness(); h.delta(' \n'); h.advance(1000);
  assert.equal(h.starts, 0);
  h.delta('Hello'); h.advance(800); h.delta(' world'); h.advance(899);
  assert.deepEqual(h.turns, []);
  h.advance(1); assert.deepEqual(h.turns, ['Hello world']);
  h.delta(' Never send'); h.controller.dispose(); h.advance(2000); h.final('late');
  assert.deepEqual(h.turns, ['Hello world']);
});

test('the agent transcription adapter routes Mistral events through mute/unmute without replaying discarded text', async () => {
  const clock = harness();
  let events, stopped = 0, closed = 0;
  const track = { enabled: true, stop() { stopped++; } };
  const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
  class Context {
    async resume() {} async close() { closed++; }
    createAnalyser() { return { fftSize: 1024, getFloatTimeDomainData: samples => samples.fill(0) }; }
    createMediaStreamSource() { return { connect() {} }; }
  }
  const mocks = {
    '../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}), createCredentialScopedFetch: fetch => fetch },
    '../transcriptions/realtime/startRealtimeWebrtcSession': { startRealtimeWebrtcSession: async options => {
      events = options.events; return { stop: async () => {} };
    } },
    './googleLiveConfig': {}, './openAiAgentTranscriptionConfig': {},
    './agentTranscriptionTurns': { AgentTranscriptionTurns: clock.Turns },
  };
  const file = path.resolve(__dirname, '../packages/aihappey-core/src/features/realtime/startAgentTranscription.ts');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'navigator', 'AudioContext', 'setInterval', 'clearInterval', code)(
    id => { assert.ok(id in mocks, id); return mocks[id]; }, module, module.exports,
    { mediaDevices: { getUserMedia: async () => stream } }, Context, () => 1, () => {});
  const previews = [], turns = [], errors = [];
  const session = await module.exports.startAgentTranscription({ model: { id: 'mistral/voxtral-mini-transcribe-realtime-3' },
    config: { baseUrl: 'https://gateway/', endpoints: { realtime: 'token' } }, signal: new AbortController().signal,
    onStart() {}, onPreview: text => previews.push(text), onTurn: text => turns.push(text),
    onEvent() {}, onError: error => errors.push(error),
  });
  try {
    events.onEvent({ type: 'transcription.text.delta', text: 'Discard.' });
    session.setMuted(true); assert.equal(track.enabled, false);
    events.onEvent({ type: 'transcription.text.delta', text: ' Muted.' });
    session.setMuted(false); assert.equal(track.enabled, true);
    events.onEvent({ type: 'transcription.text.delta', text: ' Keep.' });
    assert.equal(previews.at(-1), 'Keep.');
    clock.advance(900);
    events.onEvent({ type: 'transcription.done', text: 'Discard. Muted. Keep.' });
    assert.deepEqual(turns, ['Keep.']); assert.deepEqual(errors, []);
  } finally { await session.stop(); }
  assert.equal(stopped, 1); assert.equal(closed, 1);
});
