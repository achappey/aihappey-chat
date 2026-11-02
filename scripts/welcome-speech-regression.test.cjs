const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');
const { load } = require('./credential-test-loader.cjs');
const { renderer, nodes } = require('./react-test-renderer.cjs');
const root = 'packages/aihappey-core/src/';
const tick = () => new Promise(resolve => setImmediate(resolve));
function isolated(file, mocks) {
    const code = transformSync(fs.readFileSync(path.join(__dirname, '..', root, file), 'utf8'), { loader: 'tsx', format: 'cjs' }).code;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)(id => {
        assert.ok(id in mocks, `Unmocked dependency: ${id}`); return mocks[id];
    }, module, module.exports);
    return module.exports;
}
const protocol = load(root + 'features/speech/realtime/speechProtocol.ts');
const openai = load(root + 'features/speech/realtime/openAiSpeechConfig.ts');
const speechModel = { id: 'deepgram/aura-2-asteria-en', type: 'speech', tags: ['real-time', 'realtime-token'] };
function playbackHarness(t, options = {}) {
    const original = globalThis.window;
    const contexts = [], spoken = [], appended = [], disposed = [];
    let opens = 0;
    class Context {
        state = options.suspended ? 'suspended' : 'running';
        constructor() { contexts.push(this); }
        async resume() {
            if (options.blocked) throw new DOMException('Blocked', 'NotAllowedError');
            if (options.suspended) return new Promise(() => {});
        }
        async close() { this.state = 'closed'; }
    }
    globalThis.window = { AudioContext: Context }; t.after(() => { globalThis.window = original; });
    const api = isolated('features/realtime/welcomeSpeechPlayback.ts', {
        './agentSpeechPlayback': { AgentAudioOutput: class {
            constructor(context) { this.context = context; }
            dispose() { void this.context.close(); }
            async speak(...args) { args.at(-1).throwIfAborted(); spoken.push(args); }
        } },
        './openAgentSpeech': { async openAgentSpeech(args) {
            opens++; if (options.open) return options.open(args);
            if (options.openFailure) throw options.openFailure;
            return { append(text) { appended.push(text); if (options.played) args.started(); },
                async finish() { if (options.finishFailure) throw new Error('transport lost'); },
                cancel() {}, dispose() { disposed.push(true); } };
        } },
        '../speech/realtime/speechProtocol': protocol,
        '../speech/realtime/openAiSpeechConfig': openai,
    });
    const args = { config: { baseUrl: 'https://fixture' }, speech: { model: { id: speechModel.id }, voice: 'custom', instructions: 'Warmly' },
        models: [speechModel], text: 'Welcome', customHeaders: { 'X-Deepgram-Key': 'fixture' }, signal: new AbortController().signal };
    return { ...api, args, contexts, spoken, appended, disposed, get opens() { return opens; } };
}

test('welcome speech requires an assigned speech model present in the current catalog, not a session tag', t => {
    const h = playbackHarness(t);
    assert.equal(h.welcomeSpeechModel(h.args.speech, []), undefined);
    for (const model of [{ ...speechModel, type: 'language' }, { ...speechModel, id: 'other/tts' }])
        assert.equal(h.welcomeSpeechModel(h.args.speech, [model]), undefined);
    assert.equal(h.welcomeSpeechModel(undefined, [speechModel]), undefined);
    assert.equal(h.welcomeSpeechModel(h.args.speech, [speechModel]), speechModel);
    const google = { id: 'google/gemini-3.8-flash-tts', type: 'speech' };
    assert.equal(h.welcomeSpeechModel({ model: { id: google.id } }, [google]), google);
    const audio = { id: 'openai/gpt-realtime-2.1-mini', type: 'audio', tags: ['real-time', 'realtime-token', 'realtime-speech'] };
    assert.equal(h.welcomeSpeechModel({ model: { id: audio.id } }, [audio]), audio);
    assert.equal(h.welcomeSpeechModel({ model: { id: audio.id } }, [{ ...audio, tags: ['real-time'] }]), undefined);
});

test('one attempt per generation, including failed autoplay; a newly generated identical text may play', async t => {
    const { WelcomeSpeechPlayback } = playbackHarness(t); const owner = new WelcomeSpeechPlayback();
    const first = new AbortController(); let calls = 0;
    const play = async () => { calls++; throw new DOMException('Blocked', 'NotAllowedError'); };
    await owner.play(first.signal, play); await owner.play(first.signal, play);
    assert.equal(calls, 1);
    await owner.play(new AbortController().signal, play); assert.equal(calls, 2);
    owner.stop(); await owner.play(new AbortController().signal, play); assert.equal(calls, 2);
});

test('generation replacement, conversation start and page disposal cancel work; aborted stale generations never start', async t => {
    const { WelcomeSpeechPlayback } = playbackHarness(t); const owner = new WelcomeSpeechPlayback();
    const first = new AbortController(); let oldSignal;
    const running = owner.play(first.signal, signal => new Promise(resolve => { oldSignal = signal; signal.addEventListener('abort', resolve); }));
    await owner.play(new AbortController().signal, async () => {}); await running;
    assert.equal(oldSignal.aborted, true);
    first.abort(); await owner.play(first.signal, async () => assert.fail('Stale generation started'));
    let disposed;
    const active = owner.play(new AbortController().signal, signal => new Promise(resolve => { disposed = signal; signal.addEventListener('abort', resolve); }));
    owner.cancel(); await active; assert.equal(disposed.aborted, true);
});

test('direct WebSocket is preferred and receives complete welcome text once', async t => {
    const h = playbackHarness(t); await h.playRealtimeWelcomeSpeech(h.args);
    assert.equal(h.opens, 1); assert.deepEqual(h.appended, ['Welcome']); assert.equal(h.spoken.length, 0);
    assert.equal(h.disposed.length, 1); assert.equal(h.contexts[0].state, 'closed');
});

test('pre-playback socket failure falls back with the exact agent configuration; partial playback never retries', async t => {
    const h = playbackHarness(t, { openFailure: new Error('socket unavailable') });
    await h.playRealtimeWelcomeSpeech(h.args);
    assert.equal(h.opens, 1); assert.equal(h.spoken.length, 1);
    assert.deepEqual(h.spoken[0].slice(0, 4), [h.args.config, h.args.customHeaders, h.args.speech, 'Welcome']);
    const partial = playbackHarness(t, { played: true, finishFailure: true });
    await assert.rejects(partial.playRealtimeWelcomeSpeech(partial.args)); assert.equal(partial.spoken.length, 0);
});

test('untagged Google Gemini TTS uses HTTP streaming; session-only models never use unsupported HTTP', async t => {
    const h = playbackHarness(t, { openFailure: new Error('socket unavailable') });
    const httpModel = { id: 'google/gemini-3.8-flash-tts', name: 'Gemini 3.8 Flash TTS', type: 'speech' };
    await h.playRealtimeWelcomeSpeech({ ...h.args, models: [httpModel], speech: { model: { id: httpModel.id } } });
    assert.equal(h.opens, 0); assert.equal(h.spoken.length, 1);
    const realtime = { id: 'openai/gpt-realtime-2.1-mini', type: 'audio', tags: ['real-time', 'realtime-token', 'realtime-speech'] };
    await assert.rejects(h.playRealtimeWelcomeSpeech({ ...h.args, models: [realtime], speech: { model: { id: realtime.id } } }));
    assert.equal(h.spoken.length, 1);
});

test('actual welcome player issues one Google speech/stream request with agent instructions and scoped headers', async t => {
    const originalWindow = globalThis.window, originalAudio = globalThis.Audio;
    const requests = [], contexts = [], scheduled = [];
    class Context {
        state = 'running'; currentTime = 0; destination = {};
        constructor() { contexts.push(this); }
        async resume() {}
        async close() { this.state = 'closed'; }
        createBuffer(_, count, rate) { return { duration: count / rate, getChannelData: () => new Float32Array(count) }; }
        createBufferSource() {
            const context = this;
            return { connect() {}, disconnect() {}, stop() {}, start(at) {
                scheduled.push(this.buffer); queueMicrotask(() => { context.currentTime = at + this.buffer.duration; this.onended?.(); });
            } };
        }
    }
    globalThis.window = { AudioContext: Context };
    globalThis.Audio = class { pause() {} removeAttribute() {} load() {} };
    t.after(() => { globalThis.window = originalWindow; globalThis.Audio = originalAudio; });
    const streaming = load('packages/aihappey-ai/src/speechStreaming.ts');
    const ai = { ...streaming, base64ToUint8Array: value => new Uint8Array(Buffer.from(value, 'base64')) };
    const { playRealtimeWelcomeSpeech } = load(root + 'features/realtime/welcomeSpeechPlayback.ts', { 'aihappey-ai': ai });
    const model = { id: 'google/gemini-3.8-flash-tts', type: 'speech' };
    await playRealtimeWelcomeSpeech({ models: [model], speech: { model: { id: model.id, providerHeaders: { 'X-Google-Key': 'agent-fixture' } },
            instructions: 'Speak warmly', voice: 'Puck', language: 'nl' }, text: 'Welkom', signal: new AbortController().signal,
        customHeaders: { 'X-OpenAI-Key': 'unrelated' }, config: { baseUrl: 'https://fixture', endpoints: { speech: '/api/speech' },
            fetch: async (url, init) => {
                requests.push({ url: String(url), headers: new Headers(init.headers), body: JSON.parse(init.body) });
                const parts = [{ type: 'stream-start', warnings: [] },
                    { type: 'audio', audio: 'AQACAAMA', audioFormat: { type: 'audio/L16', rate: 24000 }, providerMetadata: { google: { channels: 1 } } },
                    { type: 'finish' }];
                return new Response(parts.map(part => `data: ${JSON.stringify(part)}\n\n`).join(''), { headers: { 'Content-Type': 'text/event-stream' } });
            } } });
    assert.equal(requests.length, 1); assert.equal(requests[0].url, 'https://fixture/api/speech/stream');
    assert.equal(requests[0].body.model, model.id); assert.equal(requests[0].body.instructions, 'Speak warmly');
    assert.equal(requests[0].body.voice, 'Puck'); assert.equal(requests[0].body.language, 'nl');
    assert.deepEqual(requests[0].body.text, [{ type: 'text', text: 'Welkom' }]);
    assert.equal(requests[0].headers.get('x-google-key'), 'agent-fixture'); assert.equal(requests[0].headers.has('x-openai-key'), false);
    assert.equal(scheduled.length, 1); assert.equal(contexts[0].state, 'closed');
});

test('blocked autoplay skips credentials/synthesis and closes the audio context without fallback', async t => {
    const h = playbackHarness(t, { blocked: true });
    const owner = new h.WelcomeSpeechPlayback();
    await owner.play(new AbortController().signal, signal => h.playRealtimeWelcomeSpeech({ ...h.args, signal }));
    assert.equal(h.opens, 0); assert.equal(h.spoken.length, 0); assert.equal(h.contexts[0].state, 'closed');
});

test('a browser resume that hangs awaiting interaction is bounded and cannot play on a later gesture', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = playbackHarness(t, { suspended: true });
    const playing = h.playRealtimeWelcomeSpeech(h.args); const rejected = assert.rejects(playing, { name: 'NotAllowedError' });
    t.mock.timers.tick(1001); await rejected;
    assert.equal(h.opens, 0); assert.equal(h.contexts[0].state, 'closed');
});

test('cancellation while opening a socket never appends text, falls back or leaves a context open', async t => {
    let release; let appended = 0, cancelled = 0;
    const h = playbackHarness(t, { open: () => new Promise(resolve => { release = () => resolve({
        append() { appended++; }, finish() {}, cancel() { cancelled++; }, dispose() {},
    }); }) });
    const abort = new AbortController();
    const playing = h.playRealtimeWelcomeSpeech({ ...h.args, signal: abort.signal }); await tick(); abort.abort(); release();
    await assert.rejects(playing); assert.equal(appended, 0); assert.equal(cancelled, 1);
    assert.equal(h.spoken.length, 0); assert.equal(h.contexts[0].state, 'closed');
});

function welcomeHarness(options = {}) {
    const view = renderer(), requests = [], notifications = [];
    const state = { models: [speechModel], agents: [{ name: 'WelcomeMessageAgent', speech: { model: { id: speechModel.id } } }],
        modelsLoaded: true, agentsLoaded: true,
        sideInferenceAgentNames: { welcomeMessageAgent: 'WelcomeMessageAgent' } };
    const config = { baseUrl: 'https://fixture' }, i18n = { language: 'en' }, t = () => 'Fallback';
    const providers = {}, account = { name: 'Fixture' };
    const { WelcomeMessage } = isolated('features/chat/messages/WelcomeMessage.tsx', {
        react: view.react, 'aihappey-i18n': { languageNames: { en: 'English', nl: 'Dutch' }, useTranslation: () => ({ t, i18n }) },
        'aihappey-auth': { useAccount: () => account }, '../../../shell/responsive/useIsDesktop': { useIsDesktop: () => options.desktop !== false },
        'aihappey-components': { useTheme: () => ({ Skeleton: 'skeleton' }), useMultiTheme: () => ({ selectedThemeId: options.theme }) },
        '../../../runtime/chat-app/welcomeMessage': { fetchWelcomeMessage: (...args) => new Promise((resolve, reject) => { requests.push({ args, resolve, reject }); }) },
        'aihappey-state': { DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: { welcomeMessageAgent: 'WelcomeMessageAgent' }, useAppStore: selector => selector(state) },
        '../context/ChatContext': { useChatContext: () => ({ config }) },
        '../../../runtime/providers/useProviderRegistry': { useProviderRegistry: () => providers },
    });
    const render = (notify = true) => view.render(WelcomeMessage, notify ? { onGenerated: (...args) => notifications.push(args) } : {});
    return { view, state, i18n, render, requests, notifications, dispose: () => view.render(() => null, {}) };
}

test('welcome shimmers through model and agent discovery and generation, without a fallback flash', async t => {
    const h = welcomeHarness(); t.after(h.dispose);
    h.state.modelsLoaded = false; h.state.agentsLoaded = false;
    const initial = h.render();
    assert.equal(initial.props['aria-busy'], true);
    assert.equal(nodes(initial, 'skeleton').length, 1); assert.equal(nodes(initial, 'h1').length, 0);
    assert.equal(h.requests.length, 0);
    h.state.modelsLoaded = true;
    assert.equal(nodes(h.render(), 'skeleton').length, 1); assert.equal(h.requests.length, 0);
    h.state.agentsLoaded = true;
    assert.equal(nodes(h.render(), 'skeleton').length, 1); assert.equal(h.requests.length, 1);
    assert.equal(nodes(h.render(), 'h1').length, 0);
    h.requests[0].resolve('Generated welcome'); await tick();
    const complete = h.render();
    assert.equal(complete.props['aria-busy'], false);
    assert.equal(nodes(complete, 'skeleton').length, 0);
    assert.equal(nodes(complete, 'h1')[0].props.children, 'Generated welcome');
});

test('disabled or unavailable welcome uses localized fallback rather than an indefinite shimmer', t => {
    for (const disabled of [true, false]) {
        const h = welcomeHarness(); t.after(h.dispose);
        if (disabled) {
            h.state.sideInferenceAgentNames.welcomeMessageAgent = '';
            h.state.modelsLoaded = false; h.state.agentsLoaded = false;
        } else h.state.models = [];
        h.render();
        assert.equal(nodes(h.render(), 'h1')[0].props.children, 'Fallback');
        assert.equal(h.requests.length, 0); assert.equal(h.notifications.length, 0);
    }
});

test('empty, missing and rejected welcome results all reveal localized fallback', async t => {
    for (const value of ['', '   ', undefined, null, new Error('failed')]) {
        const h = welcomeHarness(); t.after(h.dispose); h.render();
        if (value instanceof Error) h.requests[0].reject(value); else h.requests[0].resolve(value);
        await tick();
        assert.equal(nodes(h.render(), 'h1')[0].props.children, 'Fallback');
        assert.equal(nodes(h.render(), 'skeleton').length, 0);
    }
});

test('stalled discovery or generation times out; a late response cannot replace fallback or speak', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    for (const discovering of [true, false]) {
        const h = welcomeHarness(); t.after(h.dispose); h.state.modelsLoaded = !discovering;
        h.render(); t.mock.timers.tick(30_001);
        assert.equal(nodes(h.render(), 'h1')[0].props.children, 'Fallback');
        if (!discovering) {
            assert.equal(h.requests[0].args[2].signal.aborted, true);
            h.requests[0].resolve('Too late'); await tick();
            assert.equal(nodes(h.render(), 'h1')[0].props.children, 'Fallback');
        }
        assert.equal(h.notifications.length, 0); h.dispose();
    }
});

test('new welcome inputs show shimmer immediately, including before the new effect runs', async t => {
    const h = welcomeHarness(); t.after(h.dispose); h.render(); h.requests[0].resolve('Old'); await tick();
    assert.equal(nodes(h.render(), 'h1')[0].props.children, 'Old');
    h.i18n.language = 'nl';
    const changed = h.render();
    assert.equal(nodes(changed, 'skeleton').length, 1); assert.equal(nodes(changed, 'h1').length, 0);
    assert.equal(h.requests[0].args[2].signal.aborted, true);
});

test('welcome keeps themed desktop/mobile skeleton sizing and heading levels', async t => {
    for (const theme of ['bootstrap', 'shadcn', 'fluent', 'default']) for (const desktop of [true, false]) {
        const h = welcomeHarness({ theme, desktop }); t.after(h.dispose);
        const skeleton = nodes(h.render(), 'skeleton')[0];
        assert.ok(skeleton.props.width.startsWith('clamp(')); assert.ok(skeleton.props.height > 0);
        h.requests[0].resolve('Hello'); await tick();
        assert.equal(nodes(h.render(), desktop ? 'h1' : 'h2')[0].props.children, 'Hello');
    }
});

test('rendered welcome notifies once per generation, not callback/rerender, and language changes cancel old audio', async () => {
    const h = welcomeHarness(); h.render(); assert.equal(h.requests.length, 1);
    h.requests[0].resolve('Same welcome'); await tick();
    assert.equal(h.notifications.length, 1); assert.equal(h.notifications[0][1], h.state.agents[0]);
    for (let i = 0; i < 3; i++) h.render();
    assert.equal(h.requests.length, 1); assert.equal(h.notifications.length, 1);
    h.i18n.language = 'nl'; h.render(); assert.equal(h.notifications[0][2].aborted, true);
    assert.equal(h.requests[1].args[0], 'Dutch'); h.requests[1].resolve('Same welcome'); await tick();
    assert.equal(h.notifications.length, 2); assert.notEqual(h.notifications[0][2], h.notifications[1][2]);
    h.view.render(() => null, {}); assert.equal(h.notifications[1][2].aborted, true);
});

test('stale generation results cannot publish text or audio; ordinary welcome remains text-only', async () => {
    const h = welcomeHarness(); h.render(); h.i18n.language = 'nl'; h.render();
    h.requests[0].resolve('Stale'); await tick(); assert.equal(h.notifications.length, 0);
    h.requests[1].resolve('Current'); await tick(); assert.equal(h.notifications.length, 1);
    const ordinary = welcomeHarness(); ordinary.render(false); ordinary.requests[0].resolve('Text only'); await tick();
    assert.equal(nodes(ordinary.render(false), 'h1')[0].props.children, 'Text only'); assert.equal(ordinary.notifications.length, 0);
});

test('speech opt-in exists only on the real-time start page, not normal chat or active conversations', () => {
    const read = file => fs.readFileSync(path.join(__dirname, '..', root, file), 'utf8');
    assert.match(read('features/realtime/RealtimePage.tsx').split('function RealtimeConversationPage')[0], /<WelcomeMessage onGenerated=/);
    assert.doesNotMatch(read('features/realtime/RealtimePage.tsx').split('function RealtimeConversationPage')[1], /onGenerated|playRealtimeWelcomeSpeech/);
    assert.match(read('features/chat/NewChatPage.tsx'), /<WelcomeMessage\s*\/>/);
});
