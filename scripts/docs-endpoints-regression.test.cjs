const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { load } = require('./credential-test-loader.cjs');
const { renderer, nodes } = require('./react-test-renderer.cjs');

const docsRoot = 'packages/aihappey-docs/src/';
const componentsRoot = 'packages/aihappey-docs-components/src/';
const components = { docsInlineCodeStyle: {}, ApiReferenceLayout: 'docs-layout', ApiEndpointPage: 'docs-endpoint', DocsRequestProvider: 'docs-request-provider' };
const data = load(docsRoot + 'docsData.tsx', { 'aihappey-docs-components': components });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const theme = { Badge: 'docs-badge', Button: 'docs-button', Input: 'docs-input', Modal: 'docs-modal', TextArea: 'docs-textarea' };

function text(node) {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(text).join('');
    return text(node.children ?? node.props?.children);
}

function tester(endpoint, requestConfig = {}) {
    const view = renderer();
    view.react.useContext = () => requestConfig;
    const { EndpointTestModal } = load(componentsRoot + 'api/EndpointTestModal.tsx', {
        react: view.react, 'aihappey-components': { useTheme: () => theme },
    });
    let props = { endpoint, show: true, onHide: () => { props = { ...props, show: false }; } };
    let tree;
    const render = () => (tree = view.render(EndpointTestModal, props));
    render(); render();
    return {
        render,
        send: () => nodes(render(), 'form')[0].props.onSubmit({ preventDefault() {} }),
        click(label) {
            const button = nodes(render(), 'docs-button').find(node => text(node) === label);
            assert.ok(button, `Missing ${label} button`);
            assert.notEqual(button.props.disabled, true, `${label} must be enabled`);
            button.props.onClick();
        },
        edit(label, value) {
            const input = [...nodes(render(), 'docs-input'), ...nodes(tree, 'docs-textarea')].find(node => node.props.label === label);
            assert.ok(input, `Missing ${label} input`);
            input.props.onChange(input.type === 'docs-textarea' ? value : { currentTarget: { value } });
        },
        body: () => text(nodes(render(), 'pre')[0]),
        text: () => text(render()),
        show(show) { props = { ...props, show }; render(); render(); },
        endpoint(next) { props = { ...props, endpoint: next }; render(); render(); },
        unmount() { view.render(() => null, {}); },
    };
}

const allEndpoints = () => [
    data.createGenericRealtimeEndpointDoc('token'),
    data.createGenericRealtimeEndpointDoc('session'),
    data.createLiveSessionEndpointDoc(),
    data.createDecisionsEndpointDoc('openai', 'gateway'),
    data.createDecisionsEndpointDoc('ai-sdk', 'gateway'),
    data.createStreamingSpeechEndpointDoc(),
    data.createDecisionsEndpointDoc('openai', 'agents'),
    data.createDecisionsEndpointDoc('ai-sdk', 'agents'),
];

test('all eight views use existing layouts, have live testers, and route to the correct service', () => {
    let routes, activePath;
    const { DocsRoot } = load(docsRoot + 'DocsRoot.tsx', {
        react: { ...React, useMemo: factory => factory(), useContext: () => 'provider-key' },
        'aihappey-docs-components': components,
        'react-router': { createBrowserRouter(value) { routes = value; return {}; }, RouterProvider: 'router', useLocation: () => ({ pathname: activePath }) },
    });
    DocsRoot({ authMode: 'provider-key', apiBaseUrl: 'https://gateway.example/base/', agentApiBaseUrl: 'https://agents.example/base/' });
    const newRoutes = [
        '/gateway/ai/realtime/token', '/gateway/ai/realtime/session', '/gateway/openai/live/sessions',
        '/gateway/openai/decisions', '/gateway/ai/decisions', '/gateway/ai/speech/stream',
        '/agents/openai/decisions', '/agents/ai/decisions',
    ];
    const nav = [...data.gatewayNavSections, ...data.getAgentNavSections('provider-key')].flatMap(section => section.items);
    for (activePath of newRoutes) {
        const route = routes.find(route => route.path === activePath);
        assert.ok(route, activePath);
        assert.equal(nav.filter(item => item.href === activePath).length, 1, activePath);
        const page = route.element.type(route.element.props);
        const layout = page.type(page.props);
        assert.equal(layout.type, 'docs-layout');
        assert.equal(layout.props.activePath, activePath);
        assert.equal(layout.props.sidebarTitle, activePath.startsWith('/agents/') ? 'Agents API' : 'Gateway');
        const endpointPage = layout.props.children;
        assert.equal(endpointPage.type, 'docs-endpoint');
        const doc = endpointPage.props.endpoint;
        assert.equal(doc.method, 'POST');
        assert.ok(doc.test && doc.test.body);
        assert.equal(new URL(doc.test.url ?? doc.url).origin, activePath.startsWith('/agents/') ? 'https://agents.example' : 'https://gateway.example');
        assert.ok(doc.requestExamples.length >= 2);
        for (const example of doc.requestExamples) assert.ok(example.code.includes('/base/'), 'configured base path must be retained');
    }
    assert.ok(routes.find(route => route.path === '/gateway/openai/realtime'), 'legacy client-secrets route remains');
    assert.ok(data.getAgentNavSections('azure-ad').flatMap(section => section.items).some(item => item.href === '/agents/openai/responses/list'));
    assert.ok(!data.getAgentNavSections('provider-key').flatMap(section => section.items).some(item => item.href === '/agents/openai/responses/list'));
});

test('realtime contracts keep the model in the catch-all URL and accept editable real SDP', async () => {
    const token = data.createGenericRealtimeEndpointDoc('token', { apiBaseUrl: 'https://gateway.example/' });
    const session = data.createGenericRealtimeEndpointDoc('session');
    const live = data.createLiveSessionEndpointDoc();
    assert.equal(token.path, '/api/realtime/token/{model}');
    assert.equal(session.path, '/api/realtime/session/{model}');
    assert.equal(token.test.url, 'https://gateway.example/api/realtime/token/openai/gpt-realtime');
    assert.deepEqual(token.test.body, { sessionConfig: { instructions: 'Be concise and helpful.' } });
    assert.equal('model' in session.test.body, false);
    assert.equal(live.path, '/v1/live/sessions');
    assert.equal(live.responses[0].status, '201');
    assert.equal(live.test.body.transport.type, 'webrtc');
    assert.ok(live.test.body.session.model.startsWith('openai/gpt-live-'));
    const sdp = 'v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\ns=real offer from caller\r\n';
    for (const doc of [session, live]) {
        let sent;
        const h = tester(doc, { fetch: async (url, init) => { sent = { url, init }; return Response.json({ sessionId: 'rtc', sdp: 'answer' }); } });
        const body = structuredClone(doc.test.body);
        if (doc === live) body.transport.sdp = sdp;
        else body.sdp = sdp;
        h.edit('Request body', JSON.stringify(body));
        if (doc === session) h.edit('URL', 'https://gateway.example/api/realtime/session/example/nested/model');
        await h.send();
        assert.equal(JSON.parse(sent.init.body)[doc === live ? 'transport' : 'sdp']?.sdp ?? JSON.parse(sent.init.body).sdp, sdp);
        if (doc === session) assert.ok(sent.url.endsWith('/example/nested/model'));
        assert.ok(h.body().includes('answer'));
        h.unmount();
    }
    for (const doc of [token, session, live]) assert.ok(doc.errors.some(error => error.status === '501'));
    assert.equal(data.createRealtimeEndpointDoc().path, '/v1/realtime/client_secrets');
});

test('Decisions distinguish ordered OpenAI questions from keyed AI SDK questions and catalog agents', () => {
    for (const service of ['gateway', 'agents']) {
        const openai = data.createDecisionsEndpointDoc('openai', service);
        const sdk = data.createDecisionsEndpointDoc('ai-sdk', service);
        assert.equal(openai.path, '/v1/decisions');
        assert.equal(sdk.path, '/api/decisions');
        assert.equal(typeof openai.test.body.input, 'string');
        assert.ok(Array.isArray(openai.test.body.questions));
        assert.equal(openai.test.body.questions[0].type, 'predicate');
        assert.equal(openai.test.body.state, undefined);
        assert.equal(typeof sdk.test.body.state, 'string');
        assert.equal(Array.isArray(sdk.test.body.questions), false);
        assert.equal(sdk.test.body.questions.needsRefund.type, 'boolean');
        assert.deepEqual(sdk.test.body.questions.category.criteria, { billing: 'Payments and refunds', other: 'Other requests' });
        assert.equal(sdk.test.body.input, undefined);
        const openaiResponse = JSON.parse(openai.responses[0].example.code);
        const sdkResponse = JSON.parse(sdk.responses[0].example.code);
        assert.ok(Array.isArray(openaiResponse.answers));
        assert.equal(sdkResponse.answers.needsRefund.type, 'boolean');
        for (const doc of [openai, sdk]) {
            assert.equal(doc.test.responseType, 'json');
            assert.equal('stream' in doc.test.body, false);
            assert.equal(new URL(doc.url).port, service === 'agents' ? '3036' : '3010');
            assert.equal(doc.test.body.model.includes('/'), service === 'gateway');
            if (service === 'agents') {
                assert.ok(doc.errors.some(error => error.status === '502'));
                assert.match(text(doc.description), /catalog agent/);
                assert.equal(doc.parameters.some(parameter => ['headers', 'reasoning', 'providerOptions'].includes(parameter.name)), false);
            }
        }
    }
});

test('all eight testers execute their configured HTTP contract through the injected transport', async () => {
    for (const doc of allEndpoints()) {
        let sent;
        const h = tester(doc, {
            headers: { 'X-Documentation-Test': 'injected' },
            fetch: async (url, init) => { sent = { url, init }; return Response.json({ route: doc.path }, { status: doc.responses[0].status === '201' ? 201 : 200 }); },
        });
        await h.send();
        assert.equal(sent.url, doc.test.url ?? doc.url);
        assert.equal(sent.init.method, 'POST');
        assert.deepEqual(JSON.parse(sent.init.body), doc.test.body);
        assert.equal(sent.init.headers['X-Documentation-Test'], 'injected');
        assert.equal(sent.init.headers['Content-Type'], 'application/json');
        assert.ok(h.body().includes(doc.path));
        assert.equal(sent.init.signal.aborted, false);
        h.unmount();
    }
});

test('identity mode avoids provider-key examples and injects acquired credentials into new endpoints', async () => {
    const options = { authMode: 'azure-ad' };
    const endpoints = [
        data.createGenericRealtimeEndpointDoc('token', options), data.createGenericRealtimeEndpointDoc('session', options),
        data.createLiveSessionEndpointDoc(options), data.createStreamingSpeechEndpointDoc(options),
        ...['gateway', 'agents'].flatMap(service => ['openai', 'ai-sdk'].map(surface => data.createDecisionsEndpointDoc(surface, service, options))),
    ];
    for (const doc of endpoints) {
        assert.equal(doc.test.headers.some(header => /^X-.*-Key$/i.test(header.name)), false);
        assert.ok(doc.requestExamples.every(example => example.code.includes('Bearer') && !example.code.includes('X-OpenAI-Key')));
        let sent;
        const h = tester(doc, { getAccessToken: async () => 'acquired-token', fetch: async (_url, init) => { sent = init; return Response.json({ ok: true }); } });
        await h.send();
        assert.equal(sent.headers.Authorization, 'Bearer acquired-token');
        h.unmount();
    }
});

test('streaming speech sends ordered text parts and displays SSE before EOF, including split UTF-8 and error events', async () => {
    const doc = data.createStreamingSpeechEndpointDoc();
    assert.equal(doc.path, '/api/speech/stream');
    assert.equal(doc.test.responseType, 'stream');
    assert.equal(doc.test.body.model, 'rime/coda');
    assert.equal(doc.test.body.text.map(part => part.text).join(''), 'Hello, streaming world!');
    assert.ok(doc.test.headers.some(header => header.name === 'X-Rime-Key'));
    let stream, signal;
    const body = new ReadableStream({ start(controller) { stream = controller; } });
    const h = tester(doc, { fetch: async (_url, init) => { signal = init.signal; return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }); } });
    let finished = false;
    const pending = h.send().then(() => { finished = true; });
    await tick();
    const first = 'data: {"type":"stream-start","warnings":[]}\n\n';
    stream.enqueue(new TextEncoder().encode(first)); await tick();
    assert.equal(h.body(), first);
    assert.equal(finished, false, 'first event must render while the stream is still open');
    const bytes = new TextEncoder().encode('data: {"type":"raw","rawValue":"🌍"}\r\n\r\n');
    const split = bytes.indexOf(0xf0) + 2;
    stream.enqueue(bytes.slice(0, split)); await tick();
    assert.equal(h.body().includes('�'), false);
    stream.enqueue(bytes.slice(split)); await tick();
    assert.ok(h.body().includes('🌍'));
    const tail = 'data: {"type":"error","error":"non-fatal warning"}\n\ndata: {"type":"finish"}\n\ndata: [DONE]\n\n';
    stream.enqueue(new TextEncoder().encode(tail)); stream.close();
    await pending;
    assert.ok(h.body().endsWith(tail));
    assert.match(h.text(), /Stream closed — inspect finish\/error events/);
    assert.equal(body.locked, false, 'release the response reader');
    assert.equal(signal.aborted, false);
    assert.equal(nodes(h.render(), 'audio').length, 0, 'HTTP tester must not play audio');
    h.unmount();
});

test('Cancel aborts the stream, releases its reader, retains partial output, and allows another request', async () => {
    let stream, cancelled = false, signal, calls = 0;
    const body = new ReadableStream({ start(controller) { stream = controller; }, cancel() { cancelled = true; } });
    const doc = data.createStreamingSpeechEndpointDoc();
    const h = tester(doc, { fetch: async (_url, init) => {
        calls++;
        signal = init.signal;
        return calls === 1 ? new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }) : Response.json({ next: true });
    } });
    const pending = h.send(); await tick();
    stream.enqueue(new TextEncoder().encode('data: {"type":"audio","audio":"AQID"}\n\n')); await tick();
    const partial = h.body();
    h.click('Cancel'); await pending;
    assert.equal(signal.aborted, true);
    assert.equal(cancelled, true);
    assert.equal(body.locked, false);
    assert.equal(h.body(), partial);
    assert.match(h.text(), /Cancelled — partial output retained/);
    await h.send();
    assert.match(h.body(), /"next": true/);
    h.unmount();
});

for (const action of ['Close', 'hide', 'unmount', 'endpoint']) test(`${action} cancels an active stream and releases its reader`, async () => {
    let cancelled = false, signal;
    const body = new ReadableStream({ cancel() { cancelled = true; } });
    const h = tester(data.createStreamingSpeechEndpointDoc(), { fetch: async (_url, init) => {
        signal = init.signal;
        return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
    } });
    const pending = h.send(); await tick();
    if (action === 'Close') h.click('Close');
    else if (action === 'hide') h.show(false);
    else if (action === 'endpoint') h.endpoint(data.createGenericRealtimeEndpointDoc('token'));
    else h.unmount();
    await pending;
    assert.equal(signal.aborted, true);
    assert.equal(cancelled, true);
    assert.equal(body.locked, false);
    h.unmount();
});

test('a cancelled transport that ignores abort cannot overwrite a newer result', async () => {
    let resolveFirst, firstSignal, calls = 0;
    const h = tester(data.createStreamingSpeechEndpointDoc(), { fetch: async (_url, init) => {
        if (++calls === 1) { firstSignal = init.signal; return new Promise(resolve => { resolveFirst = resolve; }); }
        return Response.json({ newest: true });
    } });
    const stale = h.send(); await tick();
    h.click('Cancel'); await h.send();
    assert.equal(firstSignal.aborted, true);
    assert.match(h.body(), /"newest": true/);
    resolveFirst(Response.json({ stale: true })); await stale;
    assert.match(h.body(), /"newest": true/);
    assert.equal(h.body().includes('stale'), false);
    h.unmount();
});

test('cancelling during token acquisition prevents a later network request', async () => {
    let token, calls = 0;
    const h = tester(data.createStreamingSpeechEndpointDoc({ authMode: 'azure-ad' }), {
        getAccessToken: () => new Promise(resolve => { token = resolve; }),
        fetch: async () => { calls++; return Response.json({}); },
    });
    const pending = h.send(); await tick();
    h.click('Cancel'); token('late-token'); await pending;
    assert.equal(calls, 0);
    h.unmount();
});

test('stream testers display pre-stream HTTP errors and in-stream failures without discarding received events', async () => {
    const doc = data.createStreamingSpeechEndpointDoc();
    const h = tester(doc, { fetch: async () => Response.json({ error: 'unavailable model' }, { status: 400 }) });
    await h.send();
    assert.match(h.body(), /"error": "unavailable model"/);
    assert.match(h.text(), /400/);
    h.unmount();
    let stream;
    const body = new ReadableStream({ start(controller) { stream = controller; } });
    const failed = tester(doc, { fetch: async () => new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }) });
    const pending = failed.send(); await tick();
    const partial = 'data: {"type":"error","error":"provider failed"}\n\n';
    stream.enqueue(new TextEncoder().encode(partial)); await tick();
    stream.error(new Error('connection lost')); await pending;
    assert.equal(failed.body(), partial);
    assert.match(failed.text(), /connection lost/);
    assert.equal(body.locked, false);
    failed.unmount();
});

test('JSON, buffered text, audio, blob, auto and form-data tester modes remain functional', async () => {
    for (const responseType of ['json', 'text', 'audio', 'blob', 'auto']) {
        const endpoint = { id: 'legacy', title: 'Legacy', method: 'POST', path: '/legacy', url: 'https://example.test/legacy', test: { responseType, body: { message: 'hello' }, headers: [{ name: 'Content-Type', value: 'application/json' }] } };
        const binary = ['audio', 'blob', 'auto'].includes(responseType);
        const h = tester(endpoint, { fetch: async () => binary ? new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': responseType === 'audio' ? 'audio/mpeg' : 'application/octet-stream' } }) : responseType === 'json' ? Response.json({ hello: 'world' }) : new Response('buffered text') });
        await h.send();
        if (binary) assert.equal(nodes(h.render(), 'a').length, 1);
        else assert.match(h.body(), responseType === 'json' ? /"hello": "world"/ : /buffered text/);
        if (responseType === 'audio') assert.equal(nodes(h.render(), 'audio').length, 1);
        h.unmount();
    }
    let sent;
    const h = tester({ id: 'form', title: 'Form', method: 'POST', path: '/form', test: { bodyType: 'form-data', headers: [{ name: 'Content-Type', value: 'application/json' }], fields: [{ name: 'model', value: 'example/model', required: true }] } }, {
        fetch: async (_url, init) => { sent = init; return Response.json({ ok: true }); },
    });
    await h.send();
    assert.ok(sent.body instanceof FormData);
    assert.equal(sent.body.get('model'), 'example/model');
    assert.equal('Content-Type' in sent.headers, false);
    h.unmount();
});

test('invalid JSON does not send a request, and reset restores each endpoint default', async () => {
    let calls = 0;
    const doc = data.createDecisionsEndpointDoc('ai-sdk', 'agents');
    const h = tester(doc, { fetch: async () => { calls++; return Response.json({}); } });
    h.edit('Request body', '{invalid'); await h.send();
    assert.equal(calls, 0);
    assert.match(h.text(), /JSON is invalid/);
    h.click('Reset'); await h.send();
    assert.equal(calls, 1);
    h.unmount();
});
