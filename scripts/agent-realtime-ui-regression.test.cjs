const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { load } = require('./credential-test-loader.cjs');
const root = 'packages/aihappey-core/src/features/';
const configFile = root + 'realtime/openAiAgentTranscriptionConfig.ts';
const { buildOpenAiAgentTranscriptionConfig } = load(configFile);
const { AgentTranscriptionTurns } = load(root + 'realtime/agentTranscriptionTurns.ts');
function isolated(file, mocks, bindings = {}) {
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
        module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
    } }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', ...Object.keys(bindings), source)(id => {
        if (id === 'react/jsx-runtime') return require(id);
        if (id in mocks) return mocks[id];
        throw new Error('Unmocked import ' + id);
    }, module, module.exports, ...Object.values(bindings));
    return module.exports;
}
const find = (node, predicate) => !React.isValidElement(node) ? []
    : [...(predicate(node) ? [node] : []), ...[...React.Children.toArray(node.props.children), ...React.Children.toArray(node.props.headerActions)].flatMap(child => find(child, predicate))];
const theme = Object.fromEntries(['Card', 'Button', 'Text', 'Input', 'Switch', 'Select', 'TextArea', 'Slider'].map(name => [name, name]));

test('Real-time editor has concise titles, labelled model pickers, and None instead of removal buttons', () => {
    let changed;
    const { AgentRealtimeSettings } = isolated(root + 'agents/AgentRealtimeSettings.tsx', {
        'aihappey-components': { useTheme: () => theme }, 'aihappey-i18n': { useTranslation: () => ({ t: key => key }) },
        '../models/ModelSelect': { ModelSelect: 'ModelSelect' },
        './agentAudioModels': load(root + 'agents/agentAudioModels.ts'),
    });
    const agent = { name: 'Voice', transcription: { id: 'openai/stt' } };
    const tree = AgentRealtimeSettings({ agent, models: [], onChange: next => { changed = next; } });
    const cards = find(tree, element => element.type === 'Card');
    assert.deepEqual(cards.map(card => card.props.title), ['agentRealtime.transcription', 'agentRealtime.speech']);
    assert.ok(cards.every(card => card.props.description === undefined));
    assert.equal(find(tree, element => element.type === 'Text').length, 0);
    assert.deepEqual(find(tree, element => element.type === 'ModelSelect').map(element => element.props.label), ['model', 'model']);
    assert.ok(cards.every(card => card.props.headerActions === undefined));
    const pickers = find(tree, element => element.type === 'ModelSelect');
    assert.ok(pickers.every(picker => picker.props.allowNone === true));
    pickers[0].props.onChange(''); assert.equal(changed.transcription, undefined);
    assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(changed)), 'transcription'), false);
    pickers[1].props.onChange(''); assert.equal(changed.speech.model, undefined);
});

test('real-time speech fields have concise English/Dutch labels and end at sample rate without a description', () => {
    for (const [language, expected] of [
        ['en', ['Voice', 'Instructions', 'Language', 'Speed', 'Audio format (MIME type)', 'Sample rate (Hz)']],
        ['nl', ['Stem', 'Instructies', 'Taal', 'Snelheid', 'Audioformaat (MIME-type)', 'Samplefrequentie (Hz)']],
    ]) {
        const strings = JSON.parse(fs.readFileSync(`packages/aihappey-i18n/src/locales/${language}/${language}.json`, 'utf8').replace(/^\uFEFF/, ''));
        const { AgentRealtimeSettings } = isolated(root + 'agents/AgentRealtimeSettings.tsx', {
            'aihappey-components': { useTheme: () => theme },
            'aihappey-i18n': { useTranslation: () => ({ t: key => key.split('.').reduce((value, part) => value?.[part], strings) ?? key }) },
            '../models/ModelSelect': { ModelSelect: 'ModelSelect' },
            './agentAudioModels': load(root + 'agents/agentAudioModels.ts'),
        });
        const tree = AgentRealtimeSettings({ agent: { name: 'Voice' }, models: [], onChange() {} });
        const speech = find(tree, element => element.type === 'Card')[1];
        const fields = find(speech, element => element.type === 'Input' || element.type === 'TextArea');
        assert.deepEqual(fields.map(field => field.props.label), expected, language);
        assert.equal(find(speech, element => element.props.role === 'note').length, 0, language);
        const form = find(speech, element => element.type === 'div')[0];
        assert.equal(React.Children.count(form.props.children), fields.length, language);
        assert.equal(React.Children.toArray(form.props.children).at(-1).props.label, expected.at(-1), language);
    }
});

test('shared model picker exposes a localized None option and never saves its sentinel or selects a fallback', () => {
    const effects = [], changes = [];
    const { ModelSelect } = isolated(root + 'models/ModelSelect.tsx', {
        react: { ...React, useMemo: fn => fn(), useEffect: fn => effects.push(fn) },
        'aihappey-components': { ModelSelectField: 'ModelSelectField' },
        'aihappey-state': { useAppStore: select => select({ modelsLoaded: true, enabledProvidersByType: {}, favoriteModelsByType: {} }) },
        'aihappey-i18n': { useTranslation: () => ({ t: key => key }) },
        '../../shell/responsive/useIsDesktop': { useIsDesktop: () => true },
        '../../runtime/providers/useProviderRegistry': { useProviderRegistry: () => ({ openai: { name: 'OpenAI' } }) },
        '../chat/engine/favoriteRouter': { favoriteRouterModel: () => undefined, SELECT_ALL_FAVORITE_MODELS: 'favorites' },
    });
    const tree = ModelSelect({ models: [{ id: 'openai/tts', type: 'speech' }], modelTypes: ['speech'], value: '', allowNone: true, onChange: value => changes.push(value) });
    assert.equal(tree.props.virtualOptions[0].label, 'none'); assert.equal(tree.props.valueTitle, 'none');
    tree.props.onChange(tree.props.virtualOptions[0].id); assert.deepEqual(changes, ['']);
    for (const effect of effects) effect(); assert.deepEqual(changes, ['']);
});

test('real-time uses the existing grouped/searchable AgentSelect in single-selection mode', () => {
    const changes = [];
    const { AgentSelect } = isolated(root + 'agents/AgentSelect.tsx', {
        react: { ...React, useMemo: fn => fn(), useEffect() {} },
        'aihappey-components': { useTheme: () => ({ Select: 'Select' }) },
        'aihappey-i18n': { useTranslation: () => ({ t: key => key }) },
        'aihappey-state': { useAppStore: select => select({ enabledProvidersByType: { language: ['OpenAI'] } }), DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: {}, store: {} },
        '../../shell/responsive/useIsDesktop': { useIsDesktop: () => true },
        './agentSelection': load(root + 'agents/agentSelection.ts'),
        './agentTags': load(root + 'agents/agentTags.ts'),
        '../chat/context/ChatContext': { useChatContext: () => ({ config: { agentEndpoint: 'https://agents.example', endpoints: { models: '/v1/models' } } }) },
        '../chat/engine/favoriteRouter': { favoriteRouterModel: () => undefined },
    });
    const agent = (name, tags) => ({ name, model: { id: 'openai/chat' }, tags });
    const tree = AgentSelect({ localAgents: [agent('Favorite'), agent('Zulu'), agent('Alpha'), agent('Tagged', ['Travel'])],
        remoteAgentModels: [{ id: 'remote/one', name: 'Remote one', source: 'remote' }], values: [], multiselect: false,
        favoriteAgentIds: ['local:Favorite'], onChange: value => changes.push(value) });
    assert.equal(tree.props.multiselect, false); assert.equal(tree.props.searchable, true); assert.equal(tree.props.placeholder, undefined);
    const groups = find(tree, element => element.type === 'optgroup');
    assert.deepEqual(groups.map(group => group.props.label), ['favorites', 'Travel', 'agents.example', 'Local']);
    const localOptions = find(groups.at(-1), element => element.type === 'option');
    assert.deepEqual(localOptions.map(option => option.props.children), ['Alpha', 'Zulu']);
    tree.props.onChange('local:Alpha'); assert.deepEqual(changes, ['local:Alpha']);
    const page = fs.readFileSync(root + 'realtime/RealtimePage.tsx', 'utf8');
    assert.match(page, /<AgentSelect/); assert.match(page, /multiselect=\{false\}/);
    assert.doesNotMatch(page, /placeholder=\{t\("agentRealtime.selectAgent"\)\}/);
});

test('real-time mode uses the chat header brain/robot ToggleButtons, not a custom switch or global chat-mode mutation', () => {
    const page = fs.readFileSync(root + 'realtime/RealtimePage.tsx', 'utf8');
    const header = fs.readFileSync(root + 'chat/layout/ChatHeader.tsx', 'utf8');
    for (const [icon, title] of [['brain', 'aiChat'], ['robot', 'aiAgents']]) {
        assert.match(page, new RegExp(`<ToggleButton icon="${icon}" variant="subtle" title=\\{t\\("${title}"\\)\\}`));
        assert.match(header, new RegExp(`ToggleButton icon="${icon}"`));
    }
    assert.doesNotMatch(page, /<Switch|switchChatMode|setChatMode/);
    assert.match(page, /checked=\{!customAgents\}.*onClick=\{\(\) => setCustomAgents\(false\)\}/);
    assert.match(page, /checked=\{customAgents\}.*onClick=\{\(\) => setCustomAgents\(true\)\}/);
});

test('OpenAI absent/null/disabled settings never become server VAD; explicit nested and legacy settings migrate correctly', () => {
    for (const original of [{}, { session: {} }, { session: { turn_detection: null } },
        { session: { audio: { input: { turn_detection: null } } } },
        { session: { turn_detection: { type: 'server_vad' }, audio: { input: { turn_detection: null } } } },
    ]) {
        const snapshot = structuredClone(original);
        const result = buildOpenAiAgentTranscriptionConfig(original);
        assert.equal(Object.hasOwn(result.session, 'turn_detection'), false);
        assert.equal(Object.hasOwn(result.session.audio.input, 'turn_detection'), false);
        assert.deepEqual(original, snapshot);
    }
    const vad = { type: 'semantic_vad', eagerness: 'low' };
    for (const original of [{ session: { turn_detection: vad } }, { session: { audio: { input: { turn_detection: vad } } } }]) {
        const result = buildOpenAiAgentTranscriptionConfig(original);
        assert.deepEqual(result.session.audio.input.turn_detection, vad);
        assert.equal(Object.hasOwn(result.session, 'turn_detection'), false);
    }
});

function form(metadata) {
    let saved;
    const { OpenAIITranscriptionConfigForm } = isolated('packages/aihappey-components/src/forms/providers/openai/OpenAIITranscriptionConfigForm.tsx', {
        react: React, '../../../theme/ThemeContext': { useTheme: () => theme },
        'aihappey-i18n': { useTranslation: () => ({ t: key => key }) },
    });
    const tree = OpenAIITranscriptionConfigForm({ config: {}, updateConfig() {}, realtimeOnly: true,
        realtimeConfig: metadata, updateRealtimeConfig: value => { saved = value; } });
    return { tree, toggle: find(tree, element => element.props.id === 'openai-realtime-turn-detection-enable')[0], get saved() { return saved; } };
}

test('OpenAI language is editable on an empty draft and survives canonical token configuration', async () => {
    const h = form({});
    const language = find(h.tree, element => element.type === 'Input' && element.props.label === 'language')[0];
    assert.notEqual(language.props.disabled, true);
    language.props.onChange({ target: { value: 'nl' } });
    assert.equal(h.saved.session.audio.input.transcription.language, 'nl');
    const transcription = await transcriptionHarness(h.saved);
    try {
        assert.deepEqual(transcription.body.providerOptions.openai.session.audio.input.transcription.languages, ['nl']);
        assert.equal(Object.hasOwn(transcription.body.providerOptions.openai.session.audio.input.transcription, 'language'), false);
    }
    finally { await transcription.session.stop(); }
    const updated = form({ expires_after: { seconds: 600 }, session: { type: 'transcription', audio: { input: {
        transcription: { prompt: 'Keep context' }, noise_reduction: { type: 'near_field' },
    } } } });
    find(updated.tree, element => element.type === 'Input' && element.props.label === 'language')[0].props.onChange({ target: { value: 'en' } });
    assert.equal(updated.saved.session.audio.input.transcription.prompt, 'Keep context');
    assert.equal(updated.saved.expires_after.seconds, 600);
    assert.equal(buildOpenAiAgentTranscriptionConfig(h.saved, 'openai/gpt-4o-transcribe').session.audio.input.transcription.language, 'nl');
});

test('turn-detection form writes the same canonical setting the request uses, and disable removes old and new values', () => {
    for (const metadata of [{ session: { turn_detection: { type: 'server_vad' } } },
        { session: { audio: { input: { turn_detection: { type: 'semantic_vad' }, transcription: { language: 'nl' } } } } },
    ]) {
        const h = form(metadata); assert.equal(h.toggle.props.checked, true);
        h.toggle.props.onChange(false);
        assert.equal(Object.hasOwn(h.saved.session, 'turn_detection'), false);
        assert.equal(Object.hasOwn(h.saved.session.audio.input, 'turn_detection'), false);
        assert.equal(Object.hasOwn(buildOpenAiAgentTranscriptionConfig(h.saved).session.audio.input, 'turn_detection'), false);
    }
    const h = form({}); assert.equal(h.toggle.props.checked, false); h.toggle.props.onChange(true);
    assert.deepEqual(h.saved.session.audio.input.turn_detection, { type: 'server_vad' });
    assert.equal(form({ session: { turn_detection: null } }).toggle.props.checked, false);
});

async function transcriptionHarness(metadata, negotiatedInput) {
    let options, body, poll, amplitude = 0, now = 1, commits = 0, stops = 0, closed = 0;
    const starts = [], completed = [];
    const track = { enabled: true, stop() { stops++; } };
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
    class AudioContext {
        async resume() {} async close() { closed++; }
        createAnalyser() { return { fftSize: 1024, getFloatTimeDomainData: data => data.fill(amplitude) }; }
        createMediaStreamSource() { return { connect() {} }; }
    }
    const { startAgentTranscription } = isolated(root + 'realtime/startAgentTranscription.ts', {
        '../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}), createCredentialScopedFetch: fn => fn },
        '../transcriptions/realtime/startRealtimeWebrtcSession': { startRealtimeWebrtcSession: async args => {
            options = args; await args.getEphemeralToken();
            return { stop: async () => {}, commitAudio: () => { commits++; } };
        } },
        './googleLiveConfig': {}, './agentTranscriptionTurns': { AgentTranscriptionTurns },
        './openAiAgentTranscriptionConfig': { buildOpenAiAgentTranscriptionConfig },
    }, { navigator: { mediaDevices: { getUserMedia: async () => stream } }, AudioContext,
        setInterval: callback => { poll = callback; return 1; }, clearInterval() {}, Date: { now: () => now } });
    const abort = new AbortController();
    const session = await startAgentTranscription({ model: { id: 'openai/gpt-live-transcribe', providerMetadata: { openai: metadata } },
        signal: abort.signal, config: { baseUrl: 'https://ai.example', endpoints: { realtime: '/v1/realtime/client_secrets' },
            fetch: async (_, init) => { body = JSON.parse(init.body); return Response.json({ value: 'ephemeral', ...(negotiatedInput ? { providerMetadata: { openai: { session: { audio: { input: negotiatedInput } } } } } : {}) }); } },
        onStart: () => starts.push(true), onPreview() {}, onTurn: text => completed.push(text), onEvent() {}, onError: error => { throw error; },
    });
    return { session, body, options, starts, completed, abort,
        sample: (value, time) => { amplitude = value; now = time; poll(); },
        get commits() { return commits; }, get stops() { return stops; }, get closed() { return closed; } };
}

test('actual token request omits disabled VAD; local end-of-speech commits once and only final text is submitted', async () => {
    const h = await transcriptionHarness({});
    try {
        const input = h.body.providerOptions.openai.session.audio.input;
        assert.equal(Object.hasOwn(input, 'turn_detection'), false);
        h.sample(0.1, 100); h.sample(0.1, 250);
        assert.equal(h.starts.length, 0, 'microphone volume is not confirmed transcription');
        h.options.events.onEvent({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'one', delta: 'Hello' });
        assert.equal(h.starts.length, 1);
        h.sample(0, 900); h.sample(0, 1000);
        assert.equal(h.commits, 1); assert.deepEqual(h.completed, []);
        h.options.events.onEvent({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'one', transcript: 'Hello' });
        assert.deepEqual(h.completed, ['Hello']);
    } finally { await h.session.stop(); }
    assert.equal(h.closed, 1); assert.ok(h.stops >= 1);
});

test('explicit or negotiated provider VAD is not double-committed by the client', async () => {
    for (const [metadata, negotiated] of [[{ session: { turn_detection: { type: 'server_vad' } } }], [{}, { turn_detection: { type: 'server_vad' } }]]) {
        const h = await transcriptionHarness(metadata, negotiated);
        try { h.sample(0.1, 100); h.sample(0.1, 250); h.sample(0, 900); assert.equal(h.commits, 0); }
        finally { await h.session.stop(); }
    }
});

test('mute discards unfinished microphone drafts and stop/abort prevents any further commits', async () => {
    const h = await transcriptionHarness({});
    h.session.setMuted(true); h.sample(0.1, 100); h.sample(0.1, 250); h.sample(0, 900);
    assert.equal(h.commits, 0); assert.equal(h.starts.length, 0);
    h.session.setMuted(false); h.sample(0.1, 1000); h.sample(0.1, 1200); h.sample(0, 1900);
    assert.equal(h.commits, 1);
    h.abort.abort();
    await h.session.stop(); h.sample(0.1, 2200); h.sample(0.1, 2400); h.sample(0, 3100);
    assert.equal(h.commits, 1); assert.equal(h.closed, 1);
});

test('repeated loud noise and empty provider events still commit locally without triggering interruption', async () => {
    const h = await transcriptionHarness({});
    try {
        for (let i = 0; i < 3; i++) {
            const at = i * 1000 + 100;
            h.sample(0.1, at); h.sample(0.1, at + 150); h.sample(0, at + 800);
            h.options.events.onEvent({ type: 'input_audio_buffer.speech_started', item_id: `noise:${i}` });
            h.options.events.onEvent({ type: 'conversation.item.input_audio_transcription.delta', item_id: `noise:${i}`, delta: '' });
            h.options.events.onEvent({ type: 'conversation.item.input_audio_transcription.completed', item_id: `noise:${i}`, transcript: ' ' });
        }
        assert.equal(h.commits, 3); assert.deepEqual(h.starts, []); assert.deepEqual(h.completed, []);
    } finally { await h.session.stop(); }
});

test('mute/unmute discards a known utterance and ignores its late text while accepting a new utterance', async () => {
    const h = await transcriptionHarness({});
    const delta = (id, text) => ({ type: 'conversation.item.input_audio_transcription.delta', item_id: id, delta: text });
    const final = (id, text) => ({ type: 'conversation.item.input_audio_transcription.completed', item_id: id, transcript: text });
    try {
        h.options.events.onEvent(delta('discarded', 'unfinished'));
        assert.equal(h.starts.length, 1);
        h.session.setMuted(true);
        h.options.events.onEvent(final('discarded', 'muted'));
        h.session.setMuted(false);
        h.options.events.onEvent(delta('discarded', 'late'));
        h.options.events.onEvent(final('discarded', 'late'));
        assert.equal(h.starts.length, 1); assert.deepEqual(h.completed, []);
        h.options.events.onEvent(delta('new', 'new question'));
        h.options.events.onEvent(final('new', 'new question'));
        assert.equal(h.starts.length, 2); assert.deepEqual(h.completed, ['new question']);
        h.abort.abort(); h.options.events.onEvent(final('after-stop', 'stale'));
        assert.equal(h.starts.length, 2); assert.deepEqual(h.completed, ['new question']);
    } finally { await h.session.stop(); }
});
