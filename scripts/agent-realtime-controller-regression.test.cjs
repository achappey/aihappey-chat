const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const fs = require('node:fs');
const ts = require('typescript');
const { Chat } = require('@ai-sdk/react');
const { DefaultChatTransport } = require('ai');
const { load } = require('./credential-test-loader.cjs');
const root = 'packages/aihappey-core/src/features/';
function isolated(file, mocks) {
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', source)(id => {
        if (id in mocks) return mocks[id];
        throw new Error('Unmocked import ' + id);
    }, module, module.exports);
    return module.exports;
}
const { ManagedAgentChatTransport } = isolated(root + 'chat/engine/ManagedAgentChatTransport.ts', { 'aihappey-ai': { DefaultChatTransport } });
const transport = isolated(root + 'realtime/AgentRealtimeChatTransport.ts', { '../chat/engine/ManagedAgentChatTransport': { ManagedAgentChatTransport } });
const types = load('packages/aihappey-types/src/index.ts');
const turnText = load(root + 'realtime/agentSpeechQueue.ts');
const { AgentTranscriptionTurns } = load(root + 'realtime/agentTranscriptionTurns.ts');
const managedTools = load(root + 'chat/engine/managedAgentMcpTools.ts');
const history = load(root + 'realtime/realtimeHistoryWriter.ts');
const selection = load(root + 'agents/agentSelection.ts');
const messageParts = load(root + 'realtime/realtimeMessageParts.ts');
const approvalState = load(root + 'chat/engine/toolApprovalState.ts');
const continuation = load(root + 'chat/engine/agentChatContinuation.ts');
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(predicate, describe = () => '') { for (let i = 0; i < 100; i++) { if (predicate()) return; await tick(); } assert.ok(predicate(), 'condition did not become true ' + describe()); }
const encode = parts => new TextEncoder().encode(parts.map(part => `data: ${JSON.stringify(part)}\n\n`).join(''));
const response = parts => new Response(encode(parts), { headers: { 'content-type': 'text/event-stream' } });
const text = (id, value) => [{ type: 'text-start', id }, { type: 'text-delta', id, delta: value }, { type: 'text-end', id }];
const findElement = (node, type) => {
    if (!React.isValidElement(node)) return undefined;
    if (node.type === type) return node;
    for (const child of React.Children.toArray(node.props.children)) { const found = findElement(child, type); if (found) return found; }
};
const approvalChunks = (id, name = id) => [
    { type: 'tool-input-available', toolCallId: id, toolName: name, input: { query: id }, providerExecuted: true },
    { type: 'tool-output-available', toolCallId: id, output: { content: [{ type: 'text', text: `result:${id}` }] }, providerExecuted: false },
    { type: 'tool-approval-request', toolCallId: id, approvalId: `approval:${id}` },
];
const finish = [{ type: 'finish-step' }, { type: 'finish', finishReason: 'stop' }];

function hookRuntime() {
    const slots = []; let index = 0, effects = [];
    const memo = (factory, deps) => {
        const at = index++, previous = slots[at];
        if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) slots[at] = { value: factory(), deps };
        return slots[at].value;
    };
    return {
        hooks: {
            useRef: value => slots[index++] ??= { current: value },
            useState: value => { const at = index++; if (!(at in slots)) slots[at] = typeof value === 'function' ? value() : value; return [slots[at], next => { slots[at] = typeof next === 'function' ? next(slots[at]) : next; }]; },
            useCallback: (fn, deps) => memo(() => fn, deps), useMemo: memo,
            useEffect: (fn, deps = []) => {
                const at = index++, previous = slots[at];
                if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) effects.push(() => {
                    previous?.cleanup?.(); slots[at] = { deps, cleanup: fn() };
                });
            },
        },
        render(fn) { index = 0; effects = []; const result = fn(); for (const effect of effects) effect(); return result; },
        unmount() { for (const slot of slots) slot?.cleanup?.(); },
    };
}
function harness(fetcher, { speechEnabled = true, initialMessages = [], approveAll = false, allowedToolList = [] } = {}) {
    const runtime = hookRuntime(), modalRuntime = hookRuntime(); let transcriptionOptions, transcriptionTurns;
    const errors = [], spoken = [], saved = new Map(initialMessages.map(message => [message.id, message])), localCalls = [];
    let stopped = 0;
    const agent = { name: 'Voice', description: 'Voice test', instructions: 'Be helpful', model: { id: 'openai/chat' },
        transcriptionModel: { id: 'openai/stt' }, ...(speechEnabled ? { speechModel: { id: 'openai/tts' } } : {}) };
    const state = { agents: [agent], remoteAgentModels: [], customHeaders: {}, mcpServers: {}, mcpServerContent: {}, toolAnnotations: {}, maxToolCalls: 5, callTool() {},
        approveAll, allowedToolList, addAllowedTool(name) { state.allowedToolList.push(name); }, toggleApproveAll() { state.approveAll = !state.approveAll; } };
    const { useAgentRealtimeConversationController } = isolated(root + 'realtime/useAgentRealtimeConversationController.ts', {
        react: runtime.hooks, 'aihappey-ai': { Chat }, 'aihappey-types': types,
        'aihappey-conversations': { useConversations: () => ({
            addMessage: async (_, message) => saved.set(message.id, structuredClone(message)),
            updateMessage: async (_, id, message) => saved.set(id, structuredClone(message)), refresh: async () => {},
        }) },
        'aihappey-state': { store: { getState: () => state }, mcpRuntime: new Map() },
        'aihappey-i18n': { useTranslation: () => ({ t: key => key, i18n: { language: 'en' } }) },
        '../chat/layout/useChatErrors': { useChatErrors: () => ({ addChatError: error => errors.push(error) }) },
        '../tools/useTools': { useTools: () => ({ tools: [], selectedLocalTools: [{ name: 'lookup', inputSchema: { type: 'object' }, source: { kind: 'local', id: 'test' } }] }) },
        '../tools/toolcalls/useOnToolCall': { useOnToolCall: () => ({ onToolCall: async value => { localCalls.push(value); return { content: [{ type: 'text', text: 'Found it' }] }; } }) },
        '../agents/agentSelection': selection,
        '../chat/engine/managedAgentMcpTools': managedTools,
        '../chat/engine/agentChatContinuation': continuation,
        '../chat/engine/toolApprovalState': approvalState,
        '../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}), createCredentialScopedFetch: f => f },
        './AgentRealtimeChatTransport': transport,
        './agentSpeechPlayback': { AgentAudioOutput: class { unlock() {} dispose() {} async speak(config, headers, model, value, signal) { spoken.push({ value, signal, model }); } } },
        './agentSpeechQueue': turnText,
        './startAgentTranscription': { startAgentTranscription: async options => {
            transcriptionOptions = options;
            transcriptionTurns = new AgentTranscriptionTurns('openai', { start: options.onStart, preview: options.onPreview, turn: options.onTurn });
            return { setMuted(value) { if (value) transcriptionTurns.reset(); }, stop: async () => { transcriptionTurns.dispose(); stopped++; } };
        } },
        './realtimeHistoryWriter': history,
        './realtimeMessageParts': messageParts,
    });
    const options = { config: {
        baseUrl: 'https://ai.example', agentEndpoint: 'https://agents.example', endpoints: { chat: '/api/chat' },
        agentScopes: ['agent'], getAgentAccessToken: async () => 'agent-token', fetch: fetcher,
    }, agent, agentKey: 'local:Voice', conversationId: 'conversation', initialMessages };
    let controller;
    const render = () => { controller = runtime.render(() => useAgentRealtimeConversationController(options)); return controller; };
    render();
    const { ToolApprovalModalHost } = isolated(root + 'tools/ToolApprovalModalHost.tsx', {
        react: modalRuntime.hooks, 'react/jsx-runtime': require('react/jsx-runtime'),
        'aihappey-components': { useTheme: () => ({ Modal: 'Modal', Tabs: 'Tabs', Tab: 'Tab' }), ToolApprovalButtons: 'ToolApprovalButtons', ToolDenyConfirmModal: 'ToolDenyConfirmModal', ToolContent: 'ToolContent' },
        'aihappey-i18n': { useTranslation: () => ({ t: key => key }) },
        'aihappey-state': { useAppStore: select => select(state) },
        '../chat/engine/toolApprovalState': approvalState,
        '../chat/activity/content/ContentBlockView': { ContentBlockView: 'ContentBlockView' },
        '../chat/activity/content/StructuredOutputView': { StructuredOutputView: 'StructuredOutputView' },
    });
    return { get controller() { return controller; }, render, errors, spoken, saved, localCalls, state,
        renderApproval(status = 'streaming') {
            render();
            return modalRuntime.render(() => ToolApprovalModalHost({ messages: controller.approvalMessages, tools: controller.tools,
                status, addToolApprovalResponse: controller.respondToToolApproval }));
        },
        unmount() { runtime.unmount(); modalRuntime.unmount(); },
        get turns() { return transcriptionTurns; },
        get transcription() { return transcriptionOptions; }, get stopped() { return stopped; },
    };
}

test('real SDK agent controller speaks completed intermediate text while tools/turn remain unfinished', async () => {
    let stream; const requests = [];
    const h = harness(async (url, init) => {
        requests.push({ url, headers: new Headers(init.headers), body: JSON.parse(init.body) });
        if (requests.length === 1) return new Response(new ReadableStream({ start(controller) {
            stream = controller;
            controller.enqueue(encode([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('before', 'Let me check.') ]));
        } }), { headers: { 'content-type': 'text/event-stream' } });
        return response([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('after', 'Here is the answer.'), { type: 'finish-step' }, { type: 'finish', finishReason: 'stop' }]);
    });
    await h.controller.start();
    const pending = h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Look it up' }] });
    await until(() => h.spoken.length === 1);
    assert.equal(h.spoken[0].value, 'Let me check.'); assert.equal(h.localCalls.length, 0);
    stream.enqueue(encode([{ type: 'tool-input-available', toolCallId: 'call', toolName: 'lookup', input: {} }, { type: 'finish-step' }, { type: 'finish', finishReason: 'tool-calls' }])); stream.close();
    await pending; await until(() => h.spoken.length === 2);
    assert.deepEqual(h.errors, []); assert.equal(h.localCalls.length, 1); assert.equal(requests.length, 2);
    assert.ok(requests.every(request => request.url === 'https://agents.example/api/chat'));
    assert.equal(requests[0].headers.get('Authorization'), 'Bearer agent-token');
    assert.equal(requests[0].body.agents[0].instructions, 'Be helpful');
    assert.equal(requests[1].body.messages.at(-1).parts.find(part => part.toolCallId === 'call').state, 'output-available');
    assert.deepEqual(h.spoken.map(item => item.value), ['Let me check.', 'Here is the answer.']);
    await h.controller.stop(); assert.equal(h.stopped, 1);
    assert.ok(h.saved.has('user')); assert.ok(h.saved.has('answer'));
});

test('unmuted noise, empty transcription, and speech-start hints never abort a live agent stream or audio', async () => {
    let stream, requestSignal;
    const h = harness(async (_, init) => {
        requestSignal = init.signal;
        return new Response(new ReadableStream({ start(controller) {
            stream = controller;
            controller.enqueue(encode([{ type: 'start', messageId: 'answer' }, ...text('intro', 'Let me check.'), ...approvalChunks('review')]));
        } }), { headers: { 'content-type': 'text/event-stream' } });
    });
    await h.controller.start();
    const pending = h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Question' }] });
    await until(() => h.spoken.length === 1 && h.render().approvalMessages.length > 0);
    try {
        for (let i = 0; i < 3; i++) {
            h.turns.activity(true); h.turns.activity(false);
            h.turns.event({ type: 'input_audio_buffer.speech_started', item_id: `noise:${i}` });
            h.turns.event({ type: 'conversation.item.input_audio_transcription.delta', item_id: `noise:${i}`, delta: '   ' });
            h.turns.event({ type: 'conversation.item.input_audio_transcription.completed', item_id: `noise:${i}`, transcript: '' });
        }
        assert.equal(requestSignal.aborted, false, 'volume/empty transcription must not cancel inference');
        assert.equal(h.spoken[0].signal.aborted, false, 'volume/empty transcription must not cancel audio');
        assert.equal(approvalState.pendingToolApprovals(h.render().approvalMessages).length, 1);
        assert.ok(findElement(h.renderApproval(), 'Modal'));
        stream.enqueue(encode(finish)); stream.close(); await pending;
        assert.deepEqual(h.errors, []);
    } finally { await h.controller.stop(); }
});

test('a completed spoken question submits once and its delayed events cannot cancel its own request', async () => {
    let stream; const requests = [];
    const h = harness(async (_, init) => {
        requests.push({ body: JSON.parse(init.body), signal: init.signal });
        return new Response(new ReadableStream({ start(controller) {
            stream = controller; controller.enqueue(encode([{ type: 'start', messageId: 'answer' }, ...text('intro', 'Checking.') ]));
        } }), { headers: { 'content-type': 'text/event-stream' } });
    });
    await h.controller.start();
    const final = { type: 'conversation.item.input_audio_transcription.completed', item_id: 'question', transcript: 'Look this up' };
    h.turns.event(final);
    await until(() => h.spoken.length === 1);
    try {
        h.turns.activity(true); h.turns.activity(false);
        h.turns.event({ type: 'input_audio_buffer.speech_started', item_id: 'question' });
        h.turns.event({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'question', delta: 'Look this up' });
        h.turns.event(final); h.turns.event(final);
        assert.equal(requests.length, 1);
        assert.equal(requests[0].signal.aborted, false);
        assert.equal(h.spoken[0].signal.aborted, false);
        assert.equal(h.render().messages.filter(message => message.metadata?.inputDraft).length, 0);
        stream.enqueue(encode([...text('done', 'Done.'), ...finish])); stream.close();
        await until(() => !h.render().streaming);
        assert.deepEqual(h.errors, []);
    } finally { await h.controller.stop(); }
});

test('genuine new transcription interrupts once, auto-submits once, and completes tools, approval, and speech despite old replays', async () => {
    const requests = []; let oldStream, answerStream, aborts = 0;
    const h = harness(async (_, init) => {
        requests.push({ body: JSON.parse(init.body), signal: init.signal });
        if (requests.length === 1) {
            init.signal.addEventListener('abort', () => aborts++, { once: true });
            return new Response(new ReadableStream({ start(controller) {
                oldStream = controller;
                controller.enqueue(encode([{ type: 'start', messageId: 'shared-answer' }, ...text('old', 'Old intermediate reply.') ]));
            } }), { headers: { 'content-type': 'text/event-stream' } });
        }
        if (requests.length === 2) return response([{ type: 'start', messageId: 'shared-answer' },
            ...text('lookup', 'Checking your new question.'),
            { type: 'tool-input-available', toolCallId: 'lookup', toolName: 'lookup', input: {} },
            { type: 'finish-step' }, { type: 'finish', finishReason: 'tool-calls' }]);
        if (requests.length === 3) return response([{ type: 'start', messageId: 'shared-answer' }, ...approvalChunks('server-result'), ...finish]);
        return new Response(new ReadableStream({ start(controller) {
            answerStream = controller;
            controller.enqueue(encode([{ type: 'start', messageId: 'shared-answer' }, ...text('new-answer', 'New answer.') ]));
        } }), { headers: { 'content-type': 'text/event-stream' } });
    });
    const final = (id, value) => ({ type: 'conversation.item.input_audio_transcription.completed', item_id: id, transcript: value });
    const delta = (id, value) => ({ type: 'conversation.item.input_audio_transcription.delta', item_id: id, delta: value });
    await h.controller.start();
    h.turns.event(final('old-question', 'Old question'));
    await until(() => h.spoken.length === 1);
    try {
        h.turns.activity(true);
        h.turns.event({ type: 'input_audio_buffer.speech_started', item_id: 'new-question' });
        assert.equal(requests[0].signal.aborted, false);
        h.turns.event(delta('new-question', 'New '));
        assert.equal(requests[0].signal.aborted, true); assert.equal(h.spoken[0].signal.aborted, true);
        assert.equal(aborts, 1);
        h.turns.event(delta('new-question', 'question'));
        assert.equal(aborts, 1); assert.equal(requests.length, 1, 'partial text never submits inference');
        h.turns.activity(false);
        h.turns.event(final('new-question', 'New question')); h.turns.event(final('new-question', 'New question'));
        oldStream.enqueue(encode([...text('stale', 'Do not speak this.'), ...finish])); oldStream.close();
        await until(() => requests.length === 3 && approvalState.pendingToolApprovals(h.render().approvalMessages).length === 1);
        h.turns.event(delta('old-question', 'old replay')); h.turns.event(final('old-question', 'Old question'));
        h.turns.event(delta('new-question', 'new replay')); h.turns.event(final('new-question', 'New question'));
        assert.ok(findElement(h.renderApproval(), 'Modal'));
        assert.equal(requests[2].signal.aborted, false);
        findElement(h.renderApproval(), 'Modal').props.actions.props.onAllow();
        await until(() => requests.length === 4 && h.spoken.some(item => item.value === 'New answer.'));
        h.turns.event(delta('new-question', 'replay during final answer'));
        assert.equal(requests[3].signal.aborted, false);
        answerStream.enqueue(encode(finish)); answerStream.close();
        await until(() => !h.render().streaming);
        assert.equal(requests.length, 4); assert.equal(h.localCalls.length, 1); assert.equal(aborts, 1);
        assert.equal(h.render().messages.filter(message => message.role === 'user').length, 2);
        assert.deepEqual(h.spoken.map(item => item.value), ['Old intermediate reply.', 'Checking your new question.', 'New answer.']);
        assert.deepEqual(h.errors, []);
        const approved = requests[3].body.messages.flatMap(message => message.parts).find(part => part.toolCallId === 'server-result');
        assert.equal(approved.approval.approved, true); assert.ok(approved.output);
    } finally { await h.controller.stop(); }
});

test('Stop and a restarted session ignore all stale transcription callbacks from the earlier session', async () => {
    const requests = [];
    const h = harness(async (_, init) => {
        requests.push({ body: JSON.parse(init.body), signal: init.signal });
        return response([{ type: 'start', messageId: 'answer' }, ...text('answer', 'Done'), ...finish]);
    });
    await h.controller.start(); const stale = h.transcription;
    await h.controller.stop(); await h.controller.start();
    try {
        await h.controller.sendMessage({ id: 'new-session-user', role: 'user', parts: [{ type: 'text', text: 'New session' }] });
        stale.onStart(); stale.onPreview('stale draft'); stale.onTurn('stale turn');
        await tick();
        assert.equal(requests.length, 1); assert.equal(requests[0].signal.aborted, false);
        assert.equal(h.render().messages.some(message => message.metadata?.inputDraft), false);
        h.transcription.onTurn('   '); await tick(); assert.equal(requests.length, 1);
        assert.deepEqual(h.errors, []);
    } finally { await h.controller.stop(); }
});

test('new user speech aborts inference/audio without marking older history interrupted or speaking late text', async () => {
    let stream, requestSignal;
    const old = { id: 'old', role: 'assistant', parts: [{ type: 'text', text: 'Old answer' }] };
    const h = harness(async (_, init) => {
        requestSignal = init.signal;
        return new Response(new ReadableStream({ start(controller) {
            stream = controller; controller.enqueue(encode([{ type: 'start', messageId: 'partial' }, { type: 'start-step' }, ...text('first', 'Checking.') ]));
        }, cancel() {} }), { headers: { 'content-type': 'text/event-stream' } });
    }, { initialMessages: [old] });
    await h.controller.start();
    const pending = h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Question' }] });
    await until(() => h.spoken.length === 1);
    h.transcription.onStart();
    assert.equal(requestSignal.aborted, true); assert.equal(h.spoken[0].signal.aborted, true);
    stream.enqueue(encode(text('late', 'Do not speak this'))); stream.close();
    await pending; await h.controller.stop();
    assert.deepEqual(h.errors, []); assert.equal(h.spoken.length, 1);
    assert.equal(h.saved.get('old').metadata?.interrupted, undefined);
    assert.equal(h.saved.get('partial').metadata.interrupted, true);
});

test('speech-less agents still send and persist answers without any audio requests', async () => {
    const h = harness(async () => response([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('answer', 'Text only'), { type: 'finish-step' }, { type: 'finish', finishReason: 'stop' }]), { speechEnabled: false });
    await h.controller.start(); await h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Hi' }] });
    await h.controller.stop();
    assert.deepEqual(h.errors, []); assert.deepEqual(h.spoken, []); assert.equal(h.saved.get('answer').parts.find(part => part.type === 'text').text, 'Text only');
});

test('precomputed tool approval results use the actual modal/SDK response and are never re-executed', async () => {
    for (const approved of [true, false]) {
        const requests = [];
        const h = harness(async (_, init) => {
            requests.push(JSON.parse(init.body));
            if (requests.length === 1) return response([{ type: 'start', messageId: 'approval' }, { type: 'start-step' },
                { type: 'tool-input-available', toolCallId: 'server', toolName: 'server_tool', input: {}, providerExecuted: true },
                { type: 'tool-approval-request', toolCallId: 'server', approvalId: 'review', output: { content: [{ type: 'text', text: 'Private result' }] } },
                { type: 'finish-step' }, { type: 'finish', finishReason: 'tool-calls' }]);
            return response([{ type: 'start', messageId: 'approval' }, { type: 'start-step' }, ...text('answer', 'Reviewed'), { type: 'finish-step' }, { type: 'finish', finishReason: 'stop' }]);
        });
        await h.controller.start(); await h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Review this' }] });
        const pending = approvalState.pendingToolApprovals(h.render().approvalMessages);
        assert.equal(pending.length, 1); assert.equal(requests.length, 1);
        assert.ok(h.renderApproval(), 'ordinary approval window must be visible, including during streaming');
        await h.controller.respondToToolApproval({ id: pending[0].approvalId, approved });
        await until(() => requests.length === 2);
        await until(() => !h.render().streaming);
        await h.controller.stop();
        assert.deepEqual(h.errors, []); assert.equal(h.localCalls.length, 0); assert.equal(requests.length, 2);
        const tool = requests[1].messages.at(-1).parts.find(part => part.toolCallId === 'server');
        assert.equal(tool.approval.approved, approved);
        // Ordinary Agent Chat retains the actual result and sends the decision; the
        // backend replaces denied results before inference rather than losing history.
        assert.equal(tool.output.content[0].text, 'Private result');
    }
});

for (const mode of ['manual', 'BRRR', 'allowlist', 'allowThisTool', 'allowAllTools', 'reject']) {
    test(`actual shared approval UI: ${mode} handles multiple backend results and continues once`, async () => {
        const requests = [];
        const h = harness(async (_, init) => {
            requests.push(JSON.parse(init.body));
            return requests.length === 1
                ? response([{ type: 'start', messageId: 'batch' }, { type: 'start-step' }, ...approvalChunks('one', 'lookup'), ...approvalChunks('two', 'lookup'), ...finish])
                : response([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('answer', 'Done'), ...finish]);
        }, { approveAll: mode === 'BRRR', allowedToolList: mode === 'allowlist' ? ['lookup'] : [] });
        await h.controller.start(); await h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Do two lookups' }] });
        assert.equal(requests.length, 1); assert.equal(approvalState.pendingToolApprovals(h.render().approvalMessages).length, 2);
        for (let i = 0; i < 2; i++) {
            const tree = h.renderApproval();
            if (mode === 'BRRR' || mode === 'allowlist' || (i === 1 && ['allowThisTool', 'allowAllTools'].includes(mode))) {
                assert.equal(tree, null);
            } else {
                const modal = findElement(tree, 'Modal'); assert.ok(modal);
                const actions = modal.props.actions.props;
                if (mode === 'reject') {
                    actions.onDeny();
                    findElement(h.renderApproval(), 'ToolDenyConfirmModal').props.onConfirm('No permission');
                } else if (mode === 'allowThisTool') actions.onAllowThisTool();
                else if (mode === 'allowAllTools') actions.onAllowAllTools();
                else { actions.onAllow(); actions.onAllow(); } // Duplicate UI callbacks cannot duplicate continuation.
            }
            await until(() => approvalState.pendingToolApprovals(h.render().approvalMessages).length <= 1 - i);
            if (i === 0) assert.equal(requests.length, 1, 'all approvals in the batch must be answered');
        }
        await until(() => requests.length === 2 && !h.render().streaming, () => JSON.stringify({ requests: requests.length, streaming: h.render().streaming, errors: h.errors.map(error => error.message) }));
        await tick(); assert.equal(requests.length, 2); assert.equal(h.localCalls.length, 0); assert.deepEqual(h.errors, []);
        const parts = requests[1].messages.flatMap(message => message.parts).filter(part => part.approval);
        assert.equal(parts.length, 2);
        for (const part of parts) {
            assert.equal(part.approval.approved, mode !== 'reject');
            assert.ok(part.output.content[0].text.startsWith('result:'));
        }
        await h.controller.stop();
    });
}

test('an approval is shown before the stream finishes; an early decision survives duplicate events', async () => {
    let stream; const requests = [];
    const h = harness(async (_, init) => {
        requests.push(JSON.parse(init.body));
        if (requests.length === 1) return new Response(new ReadableStream({ start(controller) {
            stream = controller; controller.enqueue(encode([{ type: 'start', messageId: 'streamed' }, { type: 'start-step' }, ...approvalChunks('one')]));
        } }), { headers: { 'content-type': 'text/event-stream' } });
        return response([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('answer', 'Approved'), ...finish]);
    });
    await h.controller.start();
    const pending = h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Check' }] });
    await until(() => approvalState.pendingToolApprovals(h.render().approvalMessages).length === 1);
    const modal = findElement(h.renderApproval(), 'Modal'); assert.ok(modal, 'streaming must not hide consent UI');
    modal.props.actions.props.onAllow();
    await until(() => approvalState.pendingToolApprovals(h.render().approvalMessages).length === 0);
    assert.equal(requests.length, 1, 'decision may be entered early, but continuation must await stream completion');
    stream.enqueue(encode([{ type: 'tool-approval-request', toolCallId: 'one', approvalId: 'approval:one' }, ...finish])); stream.close();
    await pending; await until(() => requests.length === 2 && !h.render().streaming);
    assert.equal(h.renderApproval(), null); assert.equal(h.localCalls.length, 0); assert.deepEqual(h.errors, []);
    await h.controller.stop();
});

test('approvals in earlier assistant messages remain visible and the full batch resumes exactly once', async () => {
    const requests = [];
    const h = harness(async (_, init) => {
        requests.push(JSON.parse(init.body));
        return requests.length === 1 ? response([
            { type: 'start', messageId: 'first' }, { type: 'start-step' }, ...approvalChunks('one'),
            { type: 'start', messageId: 'second' }, { type: 'start-step' }, ...approvalChunks('two'),
            { type: 'start', messageId: 'third' }, { type: 'start-step' }, ...text('waiting', 'Waiting for your decision.'), ...finish,
        ]) : response([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('answer', 'Done'), ...finish]);
    });
    await h.controller.start(); await h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Check both' }] });
    const pending = approvalState.pendingToolApprovals(h.render().approvalMessages);
    assert.equal(pending.length, 2); assert.equal(requests.length, 1);
    for (const approval of pending) await h.controller.respondToToolApproval({ id: approval.approvalId, approved: true });
    await until(() => requests.length === 2 && !h.render().streaming); await tick();
    assert.equal(requests.length, 2); assert.deepEqual(h.errors, []); assert.equal(h.localCalls.length, 0);
    assert.equal(requests[1].messages.flatMap(message => message.parts).filter(part => part.approval?.approved).length, 2);
    await h.controller.stop();
});

for (const interruption of ['speech', 'stop', 'unmount']) {
    test(`${interruption} hides the existing approval window, retains results, and suppresses late decisions`, async () => {
        const requests = [];
        const h = harness(async (_, init) => {
            requests.push(JSON.parse(init.body));
            return response([{ type: 'start', messageId: 'pending' }, { type: 'start-step' }, ...approvalChunks('one'), ...finish]);
        });
        await h.controller.start(); await h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Check' }] });
        const staleAllow = findElement(h.renderApproval(), 'Modal').props.actions.props.onAllow;
        if (interruption === 'speech') h.transcription.onStart();
        if (interruption === 'stop') await h.controller.stop();
        if (interruption === 'unmount') h.unmount();
        staleAllow(); await tick(); await tick();
        assert.equal(requests.length, 1); assert.equal(h.localCalls.length, 0);
        assert.equal(h.render().approvalMessages.length, 0);
        const savedPart = h.saved.get('pending').parts.find(part => part.approval);
        assert.equal(savedPart.approval.approved, undefined); assert.ok(savedPart.output);
        assert.deepEqual(h.errors, []);
        if (interruption === 'speech') await h.controller.stop();
    });
}

test('a new user turn after interruption keeps pending results in history but never releases them to inference', async () => {
    const requests = [];
    const h = harness(async (_, init) => {
        requests.push(JSON.parse(init.body));
        return requests.length === 1
            ? response([{ type: 'start', messageId: 'cancelled-result' }, { type: 'start-step' }, ...approvalChunks('one'), ...finish])
            : response([{ type: 'start', messageId: 'next-answer' }, { type: 'start-step' }, ...text('answer', 'New answer'), ...finish]);
    });
    await h.controller.start(); await h.controller.sendMessage({ id: 'first-user', role: 'user', parts: [{ type: 'text', text: 'Look up' }] });
    assert.equal(approvalState.pendingToolApprovals(h.render().approvalMessages).length, 1);
    h.transcription.onStart();
    await h.controller.sendMessage({ id: 'next-user', role: 'user', parts: [{ type: 'text', text: 'Never mind, new question' }] });
    await h.controller.stop();
    assert.equal(requests.length, 2); assert.equal(h.localCalls.length, 0); assert.deepEqual(h.errors, []);
    assert.ok(h.saved.get('cancelled-result').parts.find(part => part.approval && part.output));
    assert.equal(requests[1].messages.flatMap(message => message.parts).filter(part => part.approval?.id === 'approval:one').length, 0);
});

test('shared discovery covers dynamic tools and earlier messages, excluding historical/cancelled approvals', () => {
    const pending = (id, type = 'dynamic-tool') => ({ type, toolName: 'lookup', toolCallId: id, state: 'approval-requested', approval: { id }, input: {} });
    const messages = [
        { id: 'old', role: 'assistant', parts: [pending('historical')] },
        { id: 'user', role: 'user', parts: [] },
        { id: 'first', role: 'assistant', parts: [pending('first')] },
        { id: 'cancelled', role: 'assistant', metadata: { interrupted: true }, parts: [pending('cancelled')] },
        { id: 'last', role: 'assistant', parts: [{ type: 'text', text: 'Waiting' }, pending('second', 'tool-lookup')] },
    ];
    assert.deepEqual(approvalState.pendingToolApprovals(messages).map(entry => entry.approvalId), ['first', 'second']);
    messages[2].parts[0] = { ...messages[2].parts[0], state: 'approval-responded', approval: { id: 'first', approved: false } };
    assert.deepEqual(approvalState.pendingToolApprovals(messages).map(entry => entry.approvalId), ['second']);
});

test('shared continuation waits for all results/decisions and treats cloned assistant snapshots as the same submitted batch', () => {
    const gate = continuation.createAgentChatContinuation();
    const user = { id: 'user', role: 'user', parts: [] };
    const result = { type: 'tool-lookup', toolCallId: 'one', state: 'approval-responded', approval: { id: 'review', approved: true }, output: { content: [] } };
    const first = { id: 'first', role: 'assistant', parts: [result] };
    const second = { id: 'second', role: 'assistant', parts: [{ type: 'tool-lookup', toolCallId: 'two', state: 'input-available' }] };
    assert.equal(gate.shouldSend({ messages: [user, first, second] }), false);
    second.parts[0] = { ...second.parts[0], state: 'approval-requested', approval: { id: 'review-two' }, output: { content: [] } };
    assert.equal(gate.shouldSend({ messages: [user, first, second] }), false);
    second.parts[0] = { ...second.parts[0], state: 'approval-responded', approval: { id: 'review-two', approved: false } };
    assert.equal(gate.shouldSend({ messages: [user, first, second] }), true);
    assert.equal(gate.shouldSend({ messages: [user, { ...first, id: 'cloned-first' }, { ...second, id: 'cloned-second' }] }), false);
    assert.equal(gate.shouldSend({ messages: [{ ...user, id: 'new-user' }, first, second] }), true);
});

test('multiple browser tool calls execute once, then their backend approval batch uses the ordinary modal before inference', async () => {
    const requests = [];
    const h = harness(async (_, init) => {
        requests.push(JSON.parse(init.body));
        if (requests.length === 1) return response([{ type: 'start', messageId: 'client-batch' }, { type: 'start-step' },
            ...['one', 'two'].map(id => ({ type: 'tool-input-available', toolCallId: id, toolName: 'lookup', input: { id }, providerExecuted: false })), ...finish]);
        if (requests.length === 2) return response([{ type: 'start', messageId: 'client-batch' },
            ...['one', 'two'].flatMap(id => [{ type: 'tool-output-available', toolCallId: id, output: { content: [{ type: 'text', text: 'Browser result' }] }, providerExecuted: false },
                { type: 'tool-approval-request', toolCallId: id, approvalId: `review:${id}` }]), ...finish]);
        return response([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('answer', 'Finished'), ...finish]);
    });
    await h.controller.start(); await h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Call both tools' }] });
    await until(() => approvalState.pendingToolApprovals(h.render().approvalMessages).length === 2);
    assert.equal(h.localCalls.length, 2); assert.equal(requests.length, 2);
    for (let i = 0; i < 2; i++) {
        const modal = findElement(h.renderApproval(), 'Modal'); assert.ok(modal);
        modal.props.actions.props.onAllow();
        await until(() => approvalState.pendingToolApprovals(h.render().approvalMessages).length <= 1 - i);
    }
    await until(() => requests.length === 3 && !h.render().streaming);
    assert.equal(h.localCalls.length, 2); assert.deepEqual(h.errors, []);
    assert.equal(requests[2].messages.flatMap(message => message.parts).filter(part => part.approval?.approved).length, 2);
    await h.controller.stop();
});

test('a saved approval applies only to its exact tool; another tool still requires the existing window', async () => {
    const requests = [];
    const h = harness(async (_, init) => {
        requests.push(JSON.parse(init.body));
        return requests.length === 1
            ? response([{ type: 'start', messageId: 'batch' }, { type: 'start-step' }, ...approvalChunks('one', 'lookup'), ...approvalChunks('two', 'unrelated_lookup'), ...finish])
            : response([{ type: 'start', messageId: 'answer' }, { type: 'start-step' }, ...text('answer', 'Done'), ...finish]);
    }, { allowedToolList: ['lookup'] });
    await h.controller.start(); await h.controller.sendMessage({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Check' }] });
    assert.equal(h.renderApproval(), null);
    await until(() => approvalState.pendingToolApprovals(h.render().approvalMessages).length === 1);
    const modal = findElement(h.renderApproval(), 'Modal'); assert.ok(modal);
    assert.equal(modal.props.actions.props.toolName, 'unrelated_lookup'); assert.equal(requests.length, 1);
    modal.props.actions.props.onAllow();
    await until(() => requests.length === 2 && !h.render().streaming);
    assert.equal(h.localCalls.length, 0); assert.deepEqual(h.errors, []);
    await h.controller.stop();
});

for (const withStart of [true, false]) {
    test(`three consecutive typed turns render streamed answers and execute tools (${withStart ? 'reused backend message id' : 'no start event'})`, async () => {
        const requests = [];
        const h = harness(async (_, init) => {
            const body = JSON.parse(init.body); requests.push(body);
            const user = [...body.messages].reverse().find(message => message.role === 'user');
            const country = user.parts.find(part => part.type === 'text').text;
            const toolId = `lookup:${country}`;
            const result = body.messages.flatMap(message => message.parts).find(part => part.toolCallId === toolId && part.state === 'output-available');
            return response([...(withStart ? [{ type: 'start', messageId: 'backend-assistant' }] : []), { type: 'start-step' },
                ...(result ? text(`text:${country}`, `Answer about ${country}`)
                    : [{ type: 'reasoning-start', id: `reason:${country}` }, { type: 'reasoning-delta', id: `reason:${country}`, delta: 'Looking up' },
                        { type: 'reasoning-end', id: `reason:${country}` }, { type: 'tool-input-available', toolCallId: toolId, toolName: 'lookup', input: { country }, providerExecuted: false }]),
                ...finish]);
        });
        await h.controller.start();
        for (const [index, country] of ['Poland', 'Hungary', 'Austria'].entries()) {
            await h.controller.sendMessage({ id: `user:${country}`, role: 'user', parts: [{ type: 'text', text: country }] });
            await until(() => h.render().messages.some(message => message.role === 'assistant' && message.parts.some(part => part.type === 'text' && part.text === `Answer about ${country}`)),
                () => JSON.stringify({ country, requests: requests.length, calls: h.localCalls.length, messages: h.render().messages.map(message => ({ id: message.id, role: message.role, parts: message.parts.map(part => ({ type: part.type, text: part.text, state: part.state })) })), errors: h.errors.map(error => error.message) }));
            assert.equal(h.localCalls.length, index + 1);
        }
        assert.deepEqual(h.errors, []); assert.equal(requests.length, 6);
        await h.controller.stop();
    });
}

test('three transcribed microphone turns keep updating the same mounted controller', async () => {
    let count = 0;
    const h = harness(async () => {
        count++;
        return response([{ type: 'start', messageId: 'reused-voice-answer' }, { type: 'start-step' }, ...text(`text:${count}`, `Answer ${count}`), ...finish]);
    });
    await h.controller.start();
    for (let turn = 1; turn <= 3; turn++) {
        h.transcription.onStart(); h.transcription.onPreview(`Question ${turn}`); h.transcription.onTurn(`Question ${turn}`);
        await until(() => h.render().messages.some(message => message.parts.some(part => part.type === 'text' && part.text === `Answer ${turn}`)));
    }
    assert.equal(count, 3); assert.deepEqual(h.errors, []);
    await h.controller.stop();
});

for (const withStart of [true, false]) {
test(`approval history never redirects a later user turn into an old response (${withStart ? 'reused backend id' : 'no start event'})`, async () => {
    const requests = [];
    const h = harness(async (_, init) => {
        const body = JSON.parse(init.body); requests.push(body);
        const userIndex = body.messages.findLastIndex(message => message.role === 'user');
        const country = body.messages[userIndex].parts.find(part => part.type === 'text').text;
        const approved = body.messages.slice(userIndex + 1).flatMap(message => message.parts).some(part => part.approval?.approved);
        return response([...(withStart ? [{ type: 'start', messageId: 'reused-agent-answer' }] : []), { type: 'start-step' },
            ...(approved ? text(`answer:${country}`, `Approved answer about ${country}`) : approvalChunks(`lookup:${country}`, 'lookup')), ...finish]);
    });
    await h.controller.start();
    for (const country of ['Poland', 'Hungary', 'Austria']) {
        await h.controller.sendMessage({ id: `user:${country}`, role: 'user', parts: [{ type: 'text', text: country }] });
        const pending = approvalState.pendingToolApprovals(h.render().approvalMessages);
        assert.equal(pending.length, 1, JSON.stringify({ country, requests: requests.length, messages: h.render().messages,
            approvals: h.render().approvalMessages, errors: h.errors.map(error => error.message) }));
        findElement(h.renderApproval(), 'Modal').props.actions.props.onAllow();
        await until(() => h.render().messages.some(message => message.parts.some(part => part.type === 'text' && part.text === `Approved answer about ${country}`)));
    }
    const answers = h.render().messages.filter(message => message.role === 'assistant' && message.parts.some(part => part.type === 'text'));
    assert.equal(answers.length, 3); assert.equal(new Set(answers.map(message => message.id)).size, 3);
    assert.equal(h.localCalls.length, 0); assert.equal(requests.length, 6); assert.deepEqual(h.errors, []);
    await h.controller.stop();
    for (const answer of answers) assert.ok(h.saved.has(answer.id));
});
}
