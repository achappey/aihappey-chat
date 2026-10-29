const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./credential-test-loader.cjs');
const root = 'packages/aihappey-core/src/features/';
const { normalizeAgent } = load('packages/aihappey-agents/src/normalizeAgent.ts');
const { agentSpeechSettings, agentSpeechProviderOptions, agentSpeechSocketOptions, agentSpeechFormatName, hasValidAgentSpeech } = load(root + 'agents/agentSpeechSettings.ts');
const { speechProtocolFactories } = load(root + 'speech/realtime/speechProtocol.ts');
const { buildOpenAiSpeechSession, openAiSpeechInstructions } = load(root + 'speech/realtime/openAiSpeechConfig.ts');

test('legacy audio migrates once, preserves opaque data and headers, and serializes only canonical fields', () => {
    const legacy = { name: 'Voice', model: { id: 'openai/chat' },
        transcriptionModel: { id: 'deepgram/stt', future: [1, 2], providerHeaders: { deepgram: { ' X-Test ': ' keep ' } } },
        speechModel: { id: 'openai/tts', providerMetadata: { openai: { voice: { id: 'voice_custom', future: true }, opaque: [1, 2] } }, providerHeaders: { openai: { 'X-Test': 'speech' } } } };
    const before = structuredClone(legacy);
    const canonical = normalizeAgent(legacy);
    assert.deepEqual(legacy, before);
    assert.deepEqual(canonical.transcription.future, [1, 2]);
    assert.deepEqual(canonical.transcription.providerHeaders, { 'X-Test': 'keep' });
    assert.deepEqual(canonical.speech.model.providerHeaders, { 'X-Test': 'speech' });
    assert.deepEqual(canonical.speech.model.providerMetadata, legacy.speechModel.providerMetadata);
    assert.equal(Object.hasOwn(canonical, 'speechModel'), false);
    assert.equal(Object.hasOwn(canonical, 'transcriptionModel'), false);
    assert.deepEqual(normalizeAgent(JSON.parse(JSON.stringify(canonical))), canonical);
});

test('new configuration wins over legacy fields, including explicit null and model-free speech preferences', () => {
    for (const speech of [null, {}, { voice: 'custom', outputFormat: { type: 'audio/pcm', rate: 16000 } }, { model: null }]) {
        const result = normalizeAgent({ name: 'Voice', transcription: null, speech, transcriptionModel: { id: 'old/stt' }, speechModel: { id: 'old/tts' } });
        assert.deepEqual(result.speech, speech);
        assert.equal(result.transcription, null);
        assert.equal(Object.hasOwn(result, 'speechModel'), false);
        assert.deepEqual(normalizeAgent(result), result);
    }
});

test('all generic settings resolve without defaults and override equivalent native fields on a clone', () => {
    const speech = { model: { id: 'smallestai/lightning_v3.1', providerMetadata: { smallestai: {
        voice_id: 'old', speed: .8, language: 'en', sample_rate: 8000, response_format: 'mp3', instructions: 'old', opaque: { keep: [1] },
        voice_setting: { voice_id: 'old', speed: .9, keep: true },
    } } }, voice: ' custom ', instructions: ' Warm delivery ', language: ' nl ', speed: 1.2, outputFormat: { type: 'audio/pcm', rate: 16000 } };
    const before = structuredClone(speech);
    assert.deepEqual(agentSpeechSettings(speech), { voice: 'custom', instructions: 'Warm delivery', language: 'nl', speed: 1.2, outputFormat: { type: 'audio/pcm', rate: 16000 } });
    const options = agentSpeechProviderOptions(speech);
    assert.deepEqual(options, { voice_id: 'custom', speed: 1.2, language: 'nl', sample_rate: 16000, response_format: 'pcm', instructions: 'Warm delivery',
        opaque: { keep: [1] }, voice_setting: { voice_id: 'custom', speed: 1.2, keep: true } });
    options.opaque.keep.push(2);
    assert.deepEqual(speech, before);
    assert.deepEqual(JSON.parse(JSON.stringify(agentSpeechSettings({}))), {});
    assert.equal(agentSpeechFormatName('audio/mpeg'), 'mp3');
    assert.equal(agentSpeechFormatName('audio/pcm_s16le'), 'pcm');
    assert.equal(agentSpeechFormatName(undefined), undefined);
    for (const speed of [0, -1, Infinity, NaN]) assert.equal(hasValidAgentSpeech({ speed }), false);
    for (const rate of [0, -1, 1.5, Infinity]) assert.equal(hasValidAgentSpeech({ outputFormat: { type: 'audio/pcm', rate } }), false);
    assert.equal(hasValidAgentSpeech({ speed: null, outputFormat: null }), true);
});

test('direct socket settings apply supported generic overrides and preserve model-bound voice and raw PCM', () => {
    const speech = { model: { id: 'smallestai/lightning_v3.1', providerMetadata: { smallestai: { voice_id: 'old', sample_rate: 8000, opaque: true } } },
        voice: 'custom', speed: 1.2, language: 'nl', outputFormat: { type: 'audio/mpeg', rate: 16000 } };
    const options = agentSpeechSocketOptions(speech);
    const smallest = speechProtocolFactories.smallestai('lightning_v3.1', options).append('Hello');
    assert.equal(smallest.voice_id, 'custom'); assert.equal(smallest.speed, 1.2); assert.equal(smallest.language, 'nl');
    assert.equal(smallest.sample_rate, 16000); assert.equal(smallest.output_format, 'pcm');
    assert.equal(speechProtocolFactories.smallestai('lightning_v3.1/bound', options).append('Hello').voice_id, 'bound');
    const cartesia = speechProtocolFactories.cartesia('tts/sonic-3/bound', options).append('Hello');
    assert.deepEqual(cartesia.voice, { id: 'bound' }); assert.equal(cartesia.generation_config.speed, 1.2); assert.equal(cartesia.language, 'nl');
    const deepgram = new URL(speechProtocolFactories.deepgram('aura-2-asteria-en', options).url);
    assert.equal(deepgram.searchParams.get('speed'), '1.2'); assert.equal(deepgram.searchParams.get('sample_rate'), '16000');
    const config = buildOpenAiSpeechSession('openai/gpt-realtime-2.1-mini', { voice: 'cedar', speed: 1.2, instructions: 'ignored metadata' }, 'Speak warmly');
    assert.match(config.instructions, /Speak warmly/); assert.ok(config.instructions.endsWith(openAiSpeechInstructions));
    assert.doesNotMatch(config.instructions, /ignored metadata/); assert.deepEqual(config.tools, []);
    assert.deepEqual(config.audio.output.format, { type: 'audio/pcm', rate: 24000 });
});

test('HTTP streaming serializes generic speech fields and the structured format, not the agent wrapper', async () => {
    const { streamSpeech } = load('packages/aihappey-ai/src/speechStreaming.ts');
    let captured;
    await streamSpeech({ url: '/api/speech/stream', model: 'openai/tts', text: 'Hello',
        ...agentSpeechSettings({ voice: 'custom', instructions: 'Warmly', language: 'en', speed: 1.1, outputFormat: { type: 'audio/pcm', rate: 24000 } }),
        signal: new AbortController().signal, onAudio() {}, fetch: async (_, init) => {
            captured = JSON.parse(init.body);
            return new Response('data: {"type":"finish"}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } });
        } });
    assert.deepEqual(captured, { model: 'openai/tts', text: [{ type: 'text', text: 'Hello' }], voice: 'custom', instructions: 'Warmly', language: 'en', speed: 1.1,
        outputFormat: { type: 'audio/pcm', rate: 24000 } });
});
