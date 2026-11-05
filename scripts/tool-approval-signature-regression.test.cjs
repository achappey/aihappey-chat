const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");
const { Chat } = require("@ai-sdk/react");
const { DefaultChatTransport } = require("ai");
const { load } = require("./credential-test-loader.cjs");
const root = "packages/aihappey-core/src/features/";
const { withToolApprovalMetadata, createToolApprovalMetadata } = load(root + "chat/engine/toolApprovalMetadata.ts");
const approvalState = load(root + "chat/engine/toolApprovalState.ts");
const signature = "v1." + "ab".repeat(32);
const message = () => ({ id: "assistant", role: "assistant", parts: [{ type: "tool-search", toolCallId: "call",
    state: "approval-requested", input: { q: "test" }, approval: { id: "approval", signature, requestReason: "Review", descriptor: { label: "Search" } } }] });

function isolated(file, mocks) {
    const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file,
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", output)(id => {
        if (id in mocks) return mocks[id];
        if (id === "react/jsx-runtime") return require(id);
        throw new Error("Unmocked import " + id);
    }, module, module.exports);
    return module.exports;
}

function modal({ approveAll = false, allowedToolList = [], status = "ready" } = {}) {
    const effects = [], responses = [];
    const state = { approveAll, allowedToolList, addAllowedTool() {}, toggleApproveAll() {} };
    const { ToolApprovalModalHost } = isolated(root + "tools/ToolApprovalModalHost.tsx", {
        react: { useMemo: fn => fn(), useRef: value => ({ current: value }), useState: value => [value, () => {}], useEffect: fn => effects.push(fn) },
        "aihappey-components": { useTheme: () => ({ Modal: "Modal", Tabs: "Tabs", Tab: "Tab" }), ToolApprovalButtons: "Buttons", ToolContent: "ToolContent", ToolDenyConfirmModal: "DenyModal" },
        "aihappey-state": { useAppStore: select => select(state) },
        "aihappey-i18n": { useTranslation: () => ({ t: key => key }) },
        "../chat/activity/content/ContentBlockView": { ContentBlockView: "Content" },
        "../chat/activity/content/StructuredOutputView": { StructuredOutputView: "Structured" },
        "../chat/engine/toolApprovalState": approvalState,
    });
    const result = ToolApprovalModalHost({ messages: [message()], tools: [], status, addToolApprovalResponse: value => responses.push(value) });
    effects.forEach(fn => fn());
    return { result, responses };
}

test("rule-driven auto approval echoes the signature and sets automatic=true", () => {
    for (const settings of [{ approveAll: true }, { allowedToolList: ["search"] }]) {
        const { result, responses } = modal(settings);
        assert.equal(result, null);
        assert.equal(responses.length, 1);
        assert.equal(responses[0].signature, signature);
        assert.equal(responses[0].isAutomatic, true);
    }
});

test("manual allow, deny and initial automatic-mode choices all report automatic=false", () => {
    const { result, responses } = modal();
    const [main, deny] = React.Children.toArray(result.props.children);
    for (const action of ["onAllow", "onAllowThisTool", "onAllowAllTools"]) main.props.actions.props[action]();
    deny.props.onConfirm("Not trusted");
    assert.equal(responses.length, 4);
    for (const response of responses) { assert.equal(response.signature, signature); assert.equal(response.isAutomatic, false); }
    assert.equal(responses.at(-1).approved, false);
});

test("early automatic approval remains available while the SDK is streaming", () => {
    for (const status of ["streaming", "submitted"]) {
        const { result, responses } = modal({ approveAll: true, status });
        assert.equal(result, null); assert.equal(responses.length, 1);
    }
});

test("metadata overlay survives later SDK snapshots and is scoped to the original message and call", () => {
    const metadata = createToolApprovalMetadata();
    metadata.remember([message()], { id: "approval", approved: true, isAutomatic: true });
    const later = message(); later.parts[0].state = "approval-responded"; later.parts[0].approval.approved = true;
    const projected = metadata.apply([later]);
    assert.equal(projected[0].parts[0].approval.isAutomatic, true);
    assert.equal(projected[0].parts[0].approval.signature, signature);
    assert.equal(metadata.apply(projected), projected);
    const another = { ...later, id: "different-message" };
    assert.equal(metadata.apply([another])[0].parts[0].approval.isAutomatic, undefined);
});

test("metadata preparation is immutable, preserves the gateway signature, and never infers automation from reason", () => {
    const messages = [message()], before = JSON.stringify(messages);
    const patched = withToolApprovalMetadata(messages, { id: "approval", approved: true, reason: "BRRR", signature: "replacement" });
    assert.equal(JSON.stringify(messages), before);
    assert.equal(patched[0].parts[0].approval.signature, signature);
    assert.equal(patched[0].parts[0].approval.isAutomatic, false);
    assert.deepEqual(patched[0].parts[0].approval.descriptor, { label: "Search" });
});

test("real SDK streams, responses, continuation payloads and saved history retain signed automatic and manual approvals", async () => {
    for (const isAutomatic of [true, false]) for (const approved of [true, false]) {
        const bodies = [];
        const chat = new Chat({ id: "conversation", sendAutomaticallyWhen: ({ messages }) => bodies.length === 1 && messages.at(-1)?.parts.some(part => part.state === "approval-responded"),
            transport: new DefaultChatTransport({ api: "https://gateway.example/api/chat", fetch: async (_, options) => {
                bodies.push(JSON.parse(options.body));
                const parts = bodies.length === 1 ? [
                    { type: "start", messageId: "assistant" }, { type: "start-step" },
                    { type: "tool-input-available", toolCallId: "call", toolName: "search", input: { q: "test" } },
                    { type: "tool-approval-request", toolCallId: "call", approvalId: "approval", signature },
                    { type: "finish-step" }, { type: "finish", finishReason: "tool-calls" },
                ] : [{ type: "start", messageId: "continued" }, { type: "text-start", id: "text" },
                    { type: "text-delta", id: "text", delta: "Done" }, { type: "text-end", id: "text" }, { type: "finish", finishReason: "stop" }];
                return new Response(parts.map(part => `data: ${JSON.stringify(part)}\n\n`).join(""), { headers: { "content-type": "text/event-stream" } });
            } }),
        });
        await chat.sendMessage({ text: "Search" });
        const decision = { id: "approval", approved, isAutomatic, signature };
        chat.messages = withToolApprovalMetadata(chat.messages, decision);
        await chat.addToolApprovalResponse(decision);
        for (let index = 0; index < 100 && (bodies.length < 2 || chat.status !== "ready"); index++) await new Promise(resolve => setImmediate(resolve));
        assert.equal(bodies.length, 2);
        const tool = bodies[1].messages.flatMap(message => message.parts).find(part => part.toolCallId === "call");
        assert.equal(tool.approval.signature, signature); assert.equal(tool.approval.isAutomatic, isAutomatic); assert.equal(tool.approval.approved, approved);
        const restored = new Chat({ messages: JSON.parse(JSON.stringify(chat.messages)) });
        assert.deepEqual(restored.messages.flatMap(message => message.parts).find(part => part.toolCallId === "call").approval, tool.approval);
    }
});

test("signed and automatic badges are independent, accessible, localized and show the complete signature", () => {
    for (const locale of ["en", "nl"]) {
        const labels = JSON.parse(fs.readFileSync(`packages/aihappey-i18n/src/locales/${locale}/${locale}.json`, "utf8").replace(/^\uFEFF/, ""));
        const { ToolInvocationStateBadge } = isolated("packages/aihappey-components/src/badges/ToolInvocationStateBadge.tsx", {
            "aihappey-i18n": { useTranslation: () => ({ t: key => labels[key] }) },
            "../theme/ThemeContext": { useTheme: () => ({ Badge: "Badge" }) }, "./BrrrBadge": { BrrrBadge: "Brrr" },
        });
        for (const automatic of [true, false]) {
            const node = ToolInvocationStateBadge({ state: "approval-responded", toolName: "search", approval: { id: "approval", signature, approved: true, isAutomatic: automatic } });
            const children = React.Children.toArray(node.props.children);
            const lock = children.find(child => child.props?.title?.includes(signature));
            assert.ok(lock); assert.equal(lock.props.tabIndex, 0); assert.equal(lock.props["aria-label"], labels.toolApprovalSignatureAttached);
            assert.equal(lock.props.title, labels.toolApprovalSignatureAttached + "\n" + signature);
            assert.equal(children.some(child => child.props?.["aria-label"] === labels.automatic), automatic);
        }
        const pending = ToolInvocationStateBadge({ state: "approval-requested", toolName: "search", approval: { id: "approval", signature } });
        assert.ok(React.Children.toArray(pending.props.children).some(child => child.props?.title?.includes(signature)));
    }
});
