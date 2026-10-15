const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const { Chat } = require("@ai-sdk/react");
const { DefaultChatTransport } = require("ai");

const root = "packages/aihappey-core/src/features/";
function evaluate(source, mocks = {}, bindings = {}) {
    const output = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", ...Object.keys(bindings), output)(id => {
        if (id === "react/jsx-runtime") return require(id);
        if (id in mocks) return mocks[id];
        throw new Error(`Unmocked import ${id}`);
    }, module, module.exports, ...Object.values(bindings));
    return module.exports;
}
const load = (path, mocks) => evaluate(fs.readFileSync(path, "utf8"), mocks);
const managedTools = load(root + "chat/engine/managedAgentMcpTools.ts");
const { ManagedAgentChatTransport } = load(root + "chat/engine/ManagedAgentChatTransport.ts", {
    "aihappey-ai": { DefaultChatTransport },
});
const {
    buildManagedAgentMcpCatalog, executeManagedAgentMcpTool,
    pendingManagedAgentMcpCalls, managedAgentMcpCallsPending, managedAgentStopTools,
} = managedTools;
const { sendAutomaticallyWhen } = evaluate(fs.readFileSync(root + "chat/engine/sendAutomaticallyWhen.ts", "utf8"), {}, { console: { log() {} } });
const tool = (name = "lookup", annotations) => ({
    name, description: "Look up a record", inputSchema: { type: "object", properties: { query: { type: "string" } } },
    ...(annotations ? { annotations } : {}),
});
const server = disabled => ({ config: { url: "https://mcp.example/mcp", type: "http", disabled } });
const initialState = () => ({
    mcpServers: { alpha: server(), beta: server(), disabled: server(true), offline: server() },
    mcpServerContent: Object.fromEntries(["alpha", "beta", "disabled", "offline"].map(id => [id, {
        tools: [tool()], resources: [{ uri: "resource://private" }], resourceTemplates: [{ uriTemplate: "private://{id}" }],
    }])),
    toolAnnotations: {},
    toolTimeout: 300000, resetTimeoutOnProgress: true,
});
function runtimeHarness() {
    const state = initialState(), calls = [];
    const runtime = new Map(["alpha", "beta", "disabled"].map(id => [id, {
        async callTool(request, options) {
            calls.push({ id, request, options });
            return { content: [{ type: "text", text: id }], structuredContent: { server: id } };
        },
    }]));
    const { createMcpSlice } = load("packages/aihappey-state/src/slices/mcpSlice.ts", {
        "aihappey-mcp": {},
        "./uiSlice": { mcpRuntime: runtime },
        "./mcpSkillDiscovery": { createMcpSkillDiscovery: () => ({}) },
        "aihappey-types": {},
    });
    state.callTool = createMcpSlice(() => {}, () => state, {}).callTool;
    return { state, calls, runtime, catalog: buildManagedAgentMcpCatalog(state, runtime) };
}

test("managed agents advertise only enabled connected MCP tools, retaining duplicates and excluding other context", () => {
    const { catalog, state } = runtimeHarness();
    assert.equal(catalog.tools.length, 2);
    assert.notEqual(catalog.tools[0].name, catalog.tools[1].name);
    for (const definition of catalog.tools) {
        assert.match(definition.name, /^[a-zA-Z0-9_-]{1,64}$/);
        assert.deepEqual(Object.keys(definition).sort(), ["description", "inputSchema", "name"]);
        assert.deepEqual(definition.inputSchema, tool().inputSchema);
    }
    const reversed = { ...state, mcpServerContent: Object.fromEntries(Object.entries(state.mcpServerContent).reverse()) };
    const updated = buildManagedAgentMcpCatalog(reversed, new Set(["alpha", "beta"]));
    assert.deepEqual([...updated.routes].sort(), [...catalog.routes].sort());
    assert.equal(state.mcpServerContent.alpha.tools[0].name, "lookup");
    assert.deepEqual(buildManagedAgentMcpCatalog({ ...state, mcpServerContent: {} }, new Set()).tools, []);
    const longName = "💬".repeat(80);
    state.mcpServerContent.alpha.tools = [tool(longName)];
    assert.match(buildManagedAgentMcpCatalog(state, new Set(["alpha"])).tools[0].name, /^[a-zA-Z0-9_-]{1,64}$/);
});

test("managed MCP catalog respects the existing annotation gates", () => {
    const state = initialState();
    state.mcpServerContent.alpha.tools = [
        tool("readonly", { readOnlyHint: true, destructiveHint: true }),
        tool("idempotent", { idempotentHint: true }),
        tool("destructive", { destructiveHint: true }),
        tool("open", { readOnlyHint: true, openWorldHint: true }),
    ];
    const names = gates => [...buildManagedAgentMcpCatalog({ ...state, toolAnnotations: gates }, new Set(["alpha"])).routes.values()].map(r => r.toolName);
    assert.deepEqual(names({}), ["readonly", "idempotent"]);
    assert.deepEqual(names({ readOnlyHint: true }), ["readonly"]);
    assert.deepEqual(names({ idempotentHint: true, destructiveHint: true, openWorldHint: true }), ["readonly", "idempotent", "open"]);
    assert.deepEqual(names({ destructiveHint: true, openWorldHint: true }), ["readonly", "idempotent", "destructive", "open"]);
});

test("explicit MCP ownership routes duplicate names without changing regular model chat lookup", async () => {
    const { state, catalog, calls } = runtimeHarness();
    const signal = new AbortController().signal;
    const name = [...catalog.routes].find(([, route]) => route.serverId === "beta")[0];
    const result = await executeManagedAgentMcpTool(catalog, { toolCallId: "call-1", toolName: name, input: { query: "q" } }, state.callTool, "nl", signal);
    assert.deepEqual(result.structuredContent, { server: "beta" });
    assert.deepEqual(calls[0], {
        id: "beta",
        request: { name: "lookup", arguments: { query: "q" }, _meta: { "chat/locale": "nl", progressToken: "call-1" } },
        options: { signal, timeout: 300000, resetTimeoutOnProgress: true },
    });
    await state.callTool("regular", "lookup", {});
    assert.equal(calls[1].id, "alpha");
});

test("unknown, server-owned, removed, disabled, disconnected and failed tools never fall back to another server", async () => {
    for (const failure of ["unknown", "provider", "removed", "disabled", "disconnected", "error"]) {
        const { state, catalog, calls, runtime } = runtimeHarness();
        const name = [...catalog.routes].find(([, route]) => route.serverId === "beta")[0];
        if (failure === "removed") delete state.mcpServerContent.beta;
        if (failure === "disabled") state.mcpServers.beta.config.disabled = true;
        if (failure === "disconnected") runtime.delete("beta");
        if (failure === "error") runtime.get("beta").callTool = async () => { throw new Error("MCP failed"); };
        const result = await executeManagedAgentMcpTool(catalog, {
            toolCallId: "call", toolName: failure === "unknown" ? "lookup" : name, input: {},
            providerExecuted: failure === "provider",
        }, state.callTool);
        if (failure === "provider") assert.equal(result, undefined);
        else assert.equal(result.isError, true);
        assert.equal(calls.length, 0);
    }
});

test("cancellation prevents execution and propagates to an in-flight MCP call", async () => {
    const { state, catalog, runtime, calls } = runtimeHarness();
    const toolName = catalog.tools[0].name;
    const controller = new AbortController();
    controller.abort();
    const result = await executeManagedAgentMcpTool(catalog, { toolCallId: "stopped", toolName, input: {} }, state.callTool, "en", controller.signal);
    assert.equal(result.isError, true);
    assert.equal(calls.length, 0);
    const active = new AbortController();
    runtime.get("alpha").callTool = async (_, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Stopped", "AbortError")), { once: true });
    });
    const pending = executeManagedAgentMcpTool(catalog, { toolCallId: "running", toolName, input: {} }, state.callTool, "en", active.signal);
    active.abort();
    assert.match((await pending).content[0].text, /Stopped/);
});

// Exercise the real engine callbacks without mounting its unrelated browser UI.
const engineSource = fs.readFileSync(root + "chat/engine/VercelChatInner.tsx", "utf8");
const engine = ts.createSourceFile("engine.tsx", engineSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function engineCallback(name, bindings) {
    let expression;
    function visit(node) {
        if (ts.isPropertyAssignment(node) && node.name.getText(engine) === name) expression = node.initializer.getText(engine);
        ts.forEachChild(node, visit);
    }
    visit(engine);
    assert.ok(expression, `Missing engine callback ${name}`);
    return evaluate(`module.exports = ${expression};`, {}, bindings);
}
function prepareRequest(h, chatMode = "agent") {
    return engineCallback("prepareSendMessagesRequest", {
        applyOverrides: messages => messages, mapToolOutputContentForRequest: messages => messages,
        toolOutputContentSettings: {}, baseBody: { agents: [{ name: "Managed", tools: [{ name: "server_tool" }] }], tools: h.catalog.tools },
        conversationId: "conversation", useToolNamespaces: true, hasSourceNamespaces: true,
        tools: h.catalog.tools, toolRequestConfig: {}, chatMode, managedAgentMcpCatalog: h.catalog, agentToolCatalogRef: h.ref,
        agentToolSignalRef: { current: undefined }, abortRef: { current: undefined },
        agentToolMessageRef: { current: undefined },
        agentToolRunActiveRef: { current: false },
        shapeToolsForRequest: load(root + "tools/toolRequestConfig.ts").shapeToolsForRequest,
        deferClientToolSearchCandidates: tools => tools,
        isProviderEndpointProfile: false, requestEndpointProfile: undefined, model: "openai/model",
        maxToolCalls: undefined, stopTools: ["lookup"], managedAgentStopTools,
        shouldForceToolChoiceNone: load(root + "chat/engine/shouldForceToolChoiceNone.ts", {
            "../../tools/useTools": { getToolName: name => name.replace("tool-", "") },
        }).shouldForceToolChoiceNone,
        headers: {}, agentApiKeyHeaders: {}, isGenericChatEndpoint: () => false,
        requestEndpoint: "/api/chat", getGatewayProviderHeaders: () => ({}), api: "https://agents.example/api/chat",
    });
}
function dispatchTool(h, addToolOutput, signal) {
    const execute = engineCallback("execute", {
        chatMode: "agent", agentToolSignalRef: { current: signal }, agentToolCatalogRef: h.ref,
        executeManagedAgentMcpTool, callTool: h.state.callTool, i18n: { language: "en" }, addToolOutput,
    });
    return ({ toolCall }, lifetimeSignal = new AbortController().signal) => execute(toolCall, lifetimeSignal);
}

function managedHookHarness() {
    const slots = [];
    let index = 0, effects = [];
    const { useManagedAgentMcpToolCalls } = load(root + "chat/engine/useManagedAgentMcpToolCalls.ts", {
        react: {
            useRef: value => slots[index++] ??= { current: value },
            useState: value => {
                const slot = index++;
                slots[slot] ??= value;
                return [slots[slot], update => { slots[slot] = typeof update === "function" ? update(slots[slot]) : update; }];
            },
            useEffect: (fn, deps) => {
                const slot = index++, previous = slots[slot];
                if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
                    effects.push(() => {
                        previous?.cleanup?.();
                        slots[slot] = { deps, cleanup: fn() };
                    });
                }
            },
        },
        "./managedAgentMcpTools": managedTools,
    });
    return {
        render(options) {
            index = 0;
            effects = [];
            const busy = useManagedAgentMcpToolCalls(options);
            for (const effect of effects) effect();
            return busy;
        },
        unmount() { for (const slot of slots) slot?.cleanup?.(); },
    };
}

test("agent transport keeps tools top-level despite namespace settings/overrides and never changes agent configuration", () => {
    const h = runtimeHarness();
    h.ref = { current: undefined };
    const opts = { messages: [], body: { tools: [tool("unrelated-local-tool")], useToolNamespaces: true } };
    const body = prepareRequest(h)(opts).body;
    assert.equal(body.tools, h.catalog.tools);
    assert.deepEqual(body.agents, [{ name: "Managed", tools: [{ name: "server_tool" }] }]);
    assert.equal(body.providerMetadata, undefined);
    assert.equal(h.ref.current, h.catalog);
    const completed = [{ role: "assistant", parts: [{ type: `tool-${h.catalog.tools[0].name}`, state: "output-available" }] }];
    assert.equal(prepareRequest(h)({ messages: completed }).body.toolChoice, "none");
    const original = h.catalog;
    h.catalog = buildManagedAgentMcpCatalog({ ...h.state, mcpServerContent: {} }, h.runtime);
    assert.equal(prepareRequest(h)({ messages: completed }).body.tools, original.tools);
    const regular = prepareRequest(h, "chat")(opts).body;
    assert.ok(regular.providerMetadata.openai.tools.some(t => t.type === "namespace"));
});

test("real SDK streaming returns MCP results to agent backend and continues; provider tools stay server-side", async () => {
    const h = runtimeHarness();
    h.ref = { current: h.catalog };
    const requests = [], errors = [];
    const toolName = h.catalog.tools[1].name;
    let chat;
    const transport = new DefaultChatTransport({
        prepareSendMessagesRequest: prepareRequest(h),
        fetch: async (url, options) => {
            requests.push({ url, body: JSON.parse(options.body) });
            const chunks = [{ type: "start", messageId: "assistant" }, { type: "start-step" }];
            if (requests.length === 1) {
                chunks.push(
                    { type: "tool-input-available", toolCallId: "server", toolName: "server_tool", input: {}, providerExecuted: true },
                    { type: "tool-output-available", toolCallId: "server", output: { content: [] }, providerExecuted: true },
                    { type: "tool-input-start", toolCallId: "client", toolName },
                    { type: "tool-input-delta", toolCallId: "client", inputTextDelta: '{"query":"q"}' },
                    { type: "tool-input-available", toolCallId: "client", toolName, input: { query: "q" }, providerExecuted: false },
                );
            } else chunks.push(
                { type: "text-start", id: "answer" }, { type: "text-delta", id: "answer", delta: "Done" }, { type: "text-end", id: "answer" },
            );
            chunks.push({ type: "finish-step" }, { type: "finish", finishReason: requests.length === 1 ? "tool-calls" : "stop" });
            return new Response(chunks.map(c => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n", { headers: { "Content-Type": "text/event-stream" } });
        },
    });
    chat = new Chat({
        id: "conversation", transport,
        sendAutomaticallyWhen: engineCallback("sendAutomaticallyWhen", { chatMode: "agent", managedAgentMcpCallsPending, sendAutomaticallyWhen }),
        onToolCall: engineCallback("onToolCall", { chatMode: "agent" }),
        onError: error => errors.push(error),
    });
    await chat.sendMessage({ text: "Look up a record" });
    assert.equal(h.calls.length, 0, "execution waits until streamed inputs are complete");
    const hook = managedHookHarness();
    const flush = () => hook.render({
        enabled: true, messages: chat.messages, messageId: chat.messages.at(-1).id, status: chat.status,
        execute: (call, signal) => dispatchTool(h, output => { void chat.addToolOutput(output); }, new AbortController().signal)({ toolCall: call }, signal),
    });
    flush();
    flush();
    for (let i = 0; i < 30 && (requests.length < 2 || chat.status !== "ready"); i++) {
        await new Promise(resolve => setImmediate(resolve));
    }
    assert.deepEqual(errors, []);
    assert.equal(requests.length, 2);
    assert.ok(requests.every(r => r.url === "https://agents.example/api/chat"));
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].id, "beta");
    const part = requests[1].body.messages.at(-1).parts.find(p => p.toolCallId === "client");
    assert.equal(part.state, "output-available");
    assert.deepEqual(part.output.structuredContent, { server: "beta" });
    assert.ok(chat.messages.at(-1).parts.some(p => p.type === "text" && p.text === "Done"));
    hook.unmount();
});

for (const decision of ["approve", "reject", "BRRR", "streaming BRRR"]) {
test(`post-execution ${decision} continues multiple MCP calls without re-execution`, async () => {
    const h = runtimeHarness();
    h.ref = { current: h.catalog };
    const hook = managedHookHarness();
    const toolNames = h.catalog.tools.map(tool => tool.name);
    const errors = [], requests = [];
    let finishApprovalStream;
    const results = toolNames.map((_, i) => ({ content: [{ type: "text", text: `Reviewed result ${i}` }] }));
    const chat = new Chat({
        id: "approval-conversation",
        transport: new ManagedAgentChatTransport({
            fetch: async (_, options) => {
                requests.push(JSON.parse(options.body));
                const chunks = [{ type: "start", messageId: "assistant" }, { type: "start-step" }];
                if (requests.length === 1) {
                    for (const [i, toolName] of toolNames.entries()) chunks.push(
                        { type: "tool-input-start", toolCallId: `client-${i}`, toolName },
                        { type: "tool-input-delta", toolCallId: `client-${i}`, inputTextDelta: '{"query":"q"}' },
                        { type: "tool-input-available", toolCallId: `client-${i}`, toolName, input: { query: "q" } },
                    );
                } else if (requests.length === 2) {
                    for (const i of [1, 0]) chunks.push({
                        type: "tool-approval-request", toolCallId: `client-${i}`, approvalId: `approve-${i}`, output: results[i],
                    });
                } else {
                    chunks.push({ type: "text-start", id: "answer" }, { type: "text-delta", id: "answer", delta: "Done" }, { type: "text-end", id: "answer" });
                }
                chunks.push({ type: "finish-step" }, { type: "finish", finishReason: requests.length < 3 ? "tool-calls" : "stop" });
                const bytes = new TextEncoder().encode(chunks.map(c => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n");
                return new Response(new ReadableStream({
                    start(controller) {
                        for (let i = 0; i < bytes.length; i += 17) controller.enqueue(bytes.slice(i, i + 17));
                        if (decision === "streaming BRRR" && requests.length === 2) {
                            finishApprovalStream = () => controller.close();
                        } else controller.close();
                    },
                }), { headers: { "Content-Type": "text/event-stream" } });
            },
        }),
        onToolCall: engineCallback("onToolCall", { chatMode: "agent" }),
        sendAutomaticallyWhen: engineCallback("sendAutomaticallyWhen", { chatMode: "agent", managedAgentMcpCallsPending, sendAutomaticallyWhen }),
        onError: error => errors.push(error),
    });
    await chat.sendMessage({ text: "Use MCP" });
    assert.equal(h.calls.length, 0);
    const flush = () => hook.render({
        enabled: true, messages: chat.messages, messageId: "assistant", status: chat.status,
        execute: (call, signal) => dispatchTool(h, output => { void chat.addToolOutput(output); })({ toolCall: call }, signal),
    });
    flush();
    flush();
    for (let i = 0; i < 50 && (requests.length < 2 || chat.status !== "ready"); i++) {
        await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(requests.length, 2);
    assert.equal(h.calls.length, 2, "both tools execute before approval");
    for (const [i, toolName] of toolNames.entries()) {
        const executed = requests[1].messages.at(-1).parts.find(p => p.toolCallId === `client-${i}`);
        assert.equal(executed.state, "output-available");
        assert.equal(executed.output.structuredContent.server, i === 0 ? "alpha" : "beta");
        const part = chat.messages.at(-1).parts.find(p => p.toolCallId === `client-${i}`);
        assert.equal(part.state, "approval-requested");
        assert.deepEqual(part.output, results[i], "approval result is preserved by the SDK and available to the existing UI");
        assert.equal(part.type, `tool-${toolName}`);
    }
    for (const i of [1, 0]) {
        flush();
        assert.deepEqual(pendingManagedAgentMcpCalls(chat.messages, chat.status), []);
        if (decision.includes("BRRR")) {
            const decisions = [];
            approvalHost(chat.messages, { approveAll: true, allowedToolList: [] }, d => decisions.push(d));
            assert.equal(decisions.length, 1);
            assert.equal(decisions[0].reason, "BRRR");
            await chat.addToolApprovalResponse(decisions[0]);
        } else {
            await chat.addToolApprovalResponse({ id: `approve-${i}`, approved: decision === "approve", reason: decision });
        }
        if (i === 1) assert.equal(requests.length, 2, "all approvals must be resolved before continuation");
    }
    if (finishApprovalStream) {
        assert.equal(chat.status, "streaming");
        assert.equal(requests.length, 2, "BRRR decisions during streaming wait for the stream to finish");
        finishApprovalStream();
    }
    for (let i = 0; i < 50 && (requests.length < 3 || chat.status !== "ready"); i++) {
        flush();
        await new Promise(resolve => setImmediate(resolve));
    }
    assert.deepEqual(errors, []);
    assert.equal(requests.length, 3);
    assert.equal(h.calls.length, 2, "approval responses never dispatch MCP calls again");
    for (const [i, output] of results.entries()) {
        const part = requests[2].messages.at(-1).parts.find(p => p.toolCallId === `client-${i}`);
        assert.equal(part.state, "approval-responded");
        assert.equal(part.approval.approved, decision !== "reject");
        assert.deepEqual(part.output, output);
    }
    hook.unmount();
});
}

test("only unresolved inputs execute; streaming and mixed pending calls block continuation, not approval responses", () => {
    const part = { type: "tool-client", toolCallId: "client", input: {} };
    const messages = parts => [{ role: "assistant", parts }];
    for (const state of ["approval-requested", "approval-responded", "output-available", "output-error", "output-denied"]) {
        for (const approved of [false, true]) {
            const input = messages([{ ...part, state, approval: { id: "approval", approved } }]);
            assert.deepEqual(pendingManagedAgentMcpCalls(input, "ready"), []);
            assert.equal(managedAgentMcpCallsPending(input), state === "approval-requested");
        }
    }
    const input = messages([{ ...part, state: "input-available" }]);
    assert.equal(pendingManagedAgentMcpCalls(input, "ready").length, 1);
    assert.deepEqual(pendingManagedAgentMcpCalls(input, "streaming"), []);
    const mixed = messages([
        { ...part, state: "input-available" },
        { ...part, toolCallId: "other", state: "approval-responded", approval: { approved: true } },
    ]);
    assert.equal(managedAgentMcpCallsPending(mixed), true);
    assert.deepEqual(pendingManagedAgentMcpCalls(messages([
        { ...part, state: "input-available", providerExecuted: true },
    ]), "ready"), []);
});

test("stopping an agent run suppresses late tool results and auto-continuation", async () => {
    const h = runtimeHarness();
    h.ref = { current: h.catalog };
    const controller = new AbortController(), outputs = [];
    let finish;
    h.state.callTool = () => new Promise(resolve => { finish = resolve; });
    const pending = dispatchTool(h, result => outputs.push(result), controller.signal)({
        toolCall: { toolCallId: "late", toolName: h.catalog.tools[0].name, input: {} },
    });
    controller.abort();
    finish({ content: [{ type: "text", text: "Late" }] });
    await pending;
    assert.deepEqual(outputs, []);
});

test("seeded history never executes; live execution keeps Stop available and aborts on mode switch or unmount", async () => {
    for (const cancellation of ["mode", "unmount"]) {
        const h = runtimeHarness(), hook = managedHookHarness(), outputs = [];
        h.ref = { current: h.catalog };
        let finish, executionSignal;
        h.state.callTool = (_, __, ___, ____, signal) => {
            executionSignal = signal;
            return new Promise(resolve => { finish = resolve; });
        };
        const message = { id: "history", role: "assistant", parts: [{ type: `tool-${h.catalog.tools[0].name}`, toolCallId: "client", state: "input-available", input: {} }] };
        const options = {
            enabled: true, messages: [message], status: "ready",
            execute: (call, signal) => dispatchTool(h, output => outputs.push(output), undefined)({ toolCall: call }, signal),
        };
        hook.render(options);
        await Promise.resolve();
        assert.equal(executionSignal, undefined);
        hook.render({ ...options, messageId: "different-live-message" });
        await Promise.resolve();
        assert.equal(executionSignal, undefined);
        const live = { ...options, messageId: "history" };
        hook.render(live);
        await Promise.resolve();
        assert.equal(hook.render(live), true);
        assert.match(engineSource, /disabled=\{chatBusy\}\s+streaming=\{chatBusy\}/);
        if (cancellation === "mode") assert.equal(hook.render({ ...live, enabled: false }), false);
        else hook.unmount();
        assert.equal(executionSignal.aborted, true);
        finish({ content: [{ type: "text", text: "Late result" }] });
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(outputs, []);
        hook.unmount();
    }
});

function approvalHost(messages, state, respond) {
    const { ToolApprovalModalHost } = load(root + "tools/ToolApprovalModalHost.tsx", {
        react: {
            useMemo: fn => fn(), useRef: value => ({ current: value }), useState: value => [value, () => {}],
            useEffect: fn => fn(),
        },
        "aihappey-types": {},
        "aihappey-components": { useTheme: () => ({ Modal: "Modal", Tabs: "Tabs", Tab: "Tab" }), ToolApprovalButtons: "ApprovalButtons", ToolDenyConfirmModal: "DenyModal" },
        "aihappey-state": { useAppStore: selector => selector(state) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../chat/activity/content/ContentBlockView": { ContentBlockView: "Content" },
        "../chat/activity/content/StructuredOutputView": { StructuredOutputView: "Structured" },
        "./useTools": { getToolName: name => name.replace("tool-", "") },
    });
    return ToolApprovalModalHost({ messages, tools: [], status: "ready", addToolApprovalResponse: respond });
}

test("existing approval UI requires consent, respects owner-scoped allowlists, and explicitly auto-approves BRRR", () => {
    const { catalog } = runtimeHarness();
    const toolName = catalog.tools[0].name;
    const messages = [{ role: "assistant", parts: [{ type: `tool-${toolName}`, state: "approval-requested", approval: { id: "approval" }, toolCallId: "client", input: {} }] }];
    const decisions = [];
    const state = { approveAll: false, allowedToolList: [], addAllowedTool() {}, toggleApproveAll() {} };
    assert.ok(approvalHost(messages, state, d => decisions.push(d)));
    assert.deepEqual(decisions, []);
    approvalHost(messages, { ...state, allowedToolList: [catalog.tools[1].name] }, d => decisions.push(d));
    assert.deepEqual(decisions, []);
    approvalHost(messages, { ...state, allowedToolList: [toolName] }, d => decisions.push(d));
    assert.deepEqual(decisions.pop(), { id: "approval", approved: true, reason: toolName });
    approvalHost(messages, { ...state, approveAll: true }, d => decisions.push(d));
    assert.deepEqual(decisions.pop(), { id: "approval", approved: true, reason: "BRRR" });
    assert.equal(sendAutomaticallyWhen({ messages }), false);
});
