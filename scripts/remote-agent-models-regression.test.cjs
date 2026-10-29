const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { load, auth } = require("./credential-test-loader.cjs");

const root = path.resolve(__dirname, "..");
const filename = "packages/aihappey-core/src/features/agents/useRemoteAgentModels.ts";
const { createHttpClient } = load("packages/aihappey-http/src/index.ts");
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(initialState = {}) {
    const hooks = [], effects = [], requests = [], writes = [];
    let index = 0;
    const state = {
        remoteAgentModelsLoaded: false,
        customHeaders: {},
        ...initialState,
        setRemoteAgentModels(models) {
            state.remoteAgentModels = models;
            state.remoteAgentModelsLoaded = true;
            writes.push(models);
        },
    };
    const react = {
        useRef(initial) { return hooks[index++] ??= { current: initial }; },
        useEffect(effect, deps) {
            const slot = index++;
            if (!hooks[slot]?.deps || !deps.every((value, i) => Object.is(value, hooks[slot].deps[i]))) {
                effects.push(() => {
                    hooks[slot]?.cleanup?.();
                    hooks[slot] = { deps, effect, cleanup: effect() };
                });
            }
        },
    };
    const mocks = {
        react,
        "aihappey-state": { useAppStore: selector => selector(state) },
        "../provider-credentials/providerAuthHeaders": auth,
        "aihappey-http": {
            createHttpClient: config => createHttpClient({
                ...config,
                fetch: (url, init) => new Promise((resolve, reject) => requests.push({
                    url, headers: init.headers, reject,
                    resolve: body => resolve({ json: async () => body }),
                })),
            }),
        },
    };
    const code = ts.transpileModule(fs.readFileSync(path.join(root, filename), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => {
        assert.ok(id in mocks, `Unmocked import: ${id}`);
        return mocks[id];
    }, module, module.exports);

    return {
        state, requests, writes,
        render(options = {}) {
            index = 0;
            effects.length = 0;
            const { modelsApi, getAccessToken } = { modelsApi: "https://agents.example/v1/models", ...options };
            module.exports.useRemoteAgentModels(modelsApi, getAccessToken);
            effects.forEach(effect => effect());
        },
        // Strict Mode replays effect setup/cleanup while preserving hook refs.
        replayEffects() {
            hooks.forEach(hook => hook.cleanup?.());
            hooks.forEach(hook => { if (hook.effect) hook.cleanup = hook.effect(); });
        },
        unmount() { hooks.forEach(hook => hook.cleanup?.()); },
    };
}

test("startup rerenders with fresh token callbacks share one pending agent-model request", async () => {
    const app = harness();
    for (let render = 0; render < 12; render++) {
        app.render({ getAccessToken: async () => "agent-token" });
        await flush();
    }
    assert.equal(app.requests.length, 1);
    assert.equal(app.requests[0].headers.get("Authorization"), "Bearer agent-token");
    assert.equal(app.state.remoteAgentModelsLoaded, false);

    app.requests[0].resolve({ data: [{ id: "agent-1", name: "Agent One" }] });
    await flush();
    assert.equal(app.writes.length, 1);
    assert.equal(app.state.remoteAgentModelsLoaded, true);
    assert.equal(app.state.remoteAgentModels[0].id, "agent-1");
    app.render({ getAccessToken: async () => "agent-token" });
    await flush();
    assert.equal(app.requests.length, 1);
});

test("Strict Mode effect replay reuses the pending request and commits only once", async () => {
    const app = harness();
    let tokenCalls = 0;
    let resolveToken;
    app.render({ getAccessToken: () => {
        tokenCalls++;
        return new Promise(resolve => { resolveToken = resolve; });
    } });
    app.replayEffects();
    app.replayEffects();
    assert.equal(tokenCalls, 1);
    assert.equal(app.requests.length, 0);
    resolveToken("strict-token");
    await flush();
    assert.equal(app.requests.length, 1);
    app.requests[0].resolve({ data: [{ id: "strict-agent" }] });
    await flush();
    assert.equal(app.writes.length, 1);
    assert.equal(app.state.remoteAgentModels[0].id, "strict-agent");
});

test("equivalent headers and direct-provider credentials do not restart the agent request", async () => {
    const app = harness({ customHeaders: { "X-Tenant": "one", "X-Region": "eu", "X-OpenAI-Key": "provider-secret" } });
    app.render();
    app.state.customHeaders = { "x-region": "eu", "x-tenant": "one", "X-OpenAI-Key": "different-provider-secret" };
    app.render();
    await flush();
    assert.equal(app.requests.length, 1);
    assert.equal(app.requests[0].headers.get("x-tenant"), "one");
    assert.equal(app.requests[0].headers.has("x-openai-key"), false);
    app.requests[0].resolve({ data: [] });
    await flush();
    assert.deepEqual(app.writes, [[]]);
});

for (const change of ["endpoint", "headers", "authentication"]) {
    for (const obsoleteResult of ["success", "failure"]) {
        test(`${change} changes start a new request and ignore obsolete ${obsoleteResult}`, async () => {
            const app = harness({ customHeaders: { "X-Tenant": "old" } });
            const initial = { getAccessToken: async () => "old-token" };
            app.render(initial);
            await flush();

            const next = { getAccessToken: async () => "new-token" };
            if (change === "endpoint") next.modelsApi = "https://other-agents.example/v1/models";
            if (change === "headers") app.state.customHeaders = { "X-Tenant": "new" };
            if (change === "authentication") next.getAccessToken = undefined;
            app.render(next);
            await flush();
            assert.equal(app.requests.length, 2);
            if (change === "endpoint") assert.equal(app.requests[1].url, next.modelsApi);
            if (change === "headers") assert.equal(app.requests[1].headers.get("x-tenant"), "new");
            assert.equal(app.requests[1].headers.get("Authorization"), change === "authentication" ? null : "Bearer new-token");

            if (obsoleteResult === "success") app.requests[0].resolve({ data: [{ id: "obsolete" }] });
            else app.requests[0].reject(new Error("obsolete failure"));
            await flush();
            assert.equal(app.writes.length, 0);
            assert.equal(app.state.remoteAgentModelsLoaded, false);

            // Settling the obsolete request must not clear the newer pending one.
            app.replayEffects();
            await flush();
            assert.equal(app.requests.length, 2);
            app.requests[1].resolve({ data: [{ id: "current" }] });
            await flush();
            assert.equal(app.writes.length, 1);
            assert.equal(app.state.remoteAgentModels[0].id, "current");
        });
    }
}

test("a slow obsolete response cannot overwrite a newer completed request", async () => {
    const app = harness();
    app.render();
    app.render({ modelsApi: "https://other-agents.example/v1/models" });
    app.requests[1].resolve({ data: [{ id: "current" }] });
    await flush();
    app.requests[0].resolve({ data: [{ id: "obsolete" }] });
    await flush();
    assert.equal(app.writes.length, 1);
    assert.equal(app.state.remoteAgentModels[0].id, "current");
});

for (const cleanup of ["unmount", "disable endpoint"]) {
    test(`${cleanup} detaches the pending result without marking models loaded`, async () => {
        const app = harness();
        app.render();
        if (cleanup === "unmount") app.unmount();
        else app.render({ modelsApi: undefined });
        app.requests[0].resolve({ data: [{ id: "detached" }] });
        await flush();
        assert.equal(app.writes.length, 0);
        assert.equal(app.state.remoteAgentModelsLoaded, false);
    });
}

test("successful responses retain existing filtering and model normalization", async () => {
    const app = harness();
    const agent = { name: "Embedded agent", instructions: "Test instructions" };
    app.render();
    app.requests[0].resolve({ data: [null, {}, { id: "" }, {
        id: 7, name: "  ", description: 42, created: "yesterday", owned_by: false,
        tags: ["tag", 9, null], agent,
    }, {
        id: "named", name: "Agent Name", description: "Description", created: 123, owned_by: "owner",
    }] });
    await flush();
    assert.deepEqual(app.state.remoteAgentModels, [{
        id: "7", name: "7", description: undefined, created: undefined, owned_by: undefined,
        agent, tags: ["tag"], source: "remote",
    }, {
        id: "named", name: "Agent Name", description: "Description", created: 123, owned_by: "owner",
        agent: undefined, tags: undefined, source: "remote",
    }]);
});

for (const response of [{ data: [] }, {}, { data: null }, { data: "invalid" }]) {
    test(`empty or non-array response completes with an empty list: ${JSON.stringify(response)}`, async () => {
        const app = harness();
        app.render();
        app.requests[0].resolve(response);
        await flush();
        assert.deepEqual(app.writes, [[]]);
        assert.equal(app.state.remoteAgentModelsLoaded, true);
    });
}

test("request failure preserves the empty-list fallback and does not automatically retry", async () => {
    const app = harness();
    app.render();
    app.requests[0].reject(new Error("backend unavailable"));
    await flush();
    assert.deepEqual(app.writes, [[]]);
    assert.equal(app.state.remoteAgentModelsLoaded, true);
    app.render();
    app.replayEffects();
    await flush();
    assert.equal(app.requests.length, 1);
});

test("token acquisition failure also preserves the empty-list fallback", async () => {
    const app = harness();
    app.render({ getAccessToken: async () => { throw new Error("token unavailable"); } });
    await flush();
    assert.equal(app.requests.length, 0);
    assert.deepEqual(app.writes, [[]]);
    assert.equal(app.state.remoteAgentModelsLoaded, true);
});

test("absent endpoints and already-loaded models never start a request", async () => {
    const app = harness();
    app.render({ modelsApi: undefined });
    app.render({ modelsApi: "" });
    assert.equal(app.requests.length, 0);
    assert.equal(app.state.remoteAgentModelsLoaded, false);
    app.state.remoteAgentModelsLoaded = true;
    app.render();
    await flush();
    assert.equal(app.requests.length, 0);
    assert.equal(app.writes.length, 0);
});

test("a completed request is not cached if the loaded flag is explicitly reset", async () => {
    const app = harness();
    app.render();
    app.requests[0].resolve({ data: [{ id: "first" }] });
    await flush();
    app.render();
    app.state.remoteAgentModelsLoaded = false;
    app.render();
    assert.equal(app.requests.length, 2);
    app.requests[1].resolve({ data: [{ id: "refreshed" }] });
    await flush();
    assert.equal(app.state.remoteAgentModels[0].id, "refreshed");
});

test("CoreShell shares its memoized agent-token callback with the model loader", () => {
    const shell = fs.readFileSync(path.join(root, "packages/aihappey-core/src/shell/CoreShell.tsx"), "utf8");
    const source = ts.createSourceFile("CoreShell.tsx", shell, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let loader, token;
    function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === "useRemoteAgentModels") loader = node;
        if (ts.isVariableDeclaration(node) && node.name.getText(source) === "getAgentAccessToken") token = node;
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert.equal(loader?.arguments[1].getText(source), "effectiveChatConfig.getAgentAccessToken");
    assert.equal(token?.initializer.expression.getText(source), "useCallback");
    assert.equal(token.initializer.arguments[1].getText(source), "[refreshAgentToken]");
});
