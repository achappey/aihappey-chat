const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
const { load, auth } = require("./credential-test-loader.cjs");
const { renderer } = require("./react-test-renderer.cjs");
const base = "packages/aihappey-core/src/features/";
const endpointState = load("packages/aihappey-state/src/slices/chatEndpoint.ts");
const providers = {
    openai: { name: "OpenAI", apiBaseUrl: "https://openai.test", chatEndpoints: ["/v1/chat/completions", "/v1/responses"] },
    anthropic: { name: "Anthropic", apiBaseUrl: "https://anthropic.test", chatEndpoints: ["/v1/messages"] },
    google: { name: "Google", apiBaseUrl: "https://google.test", chatEndpoints: ["/v1beta/interactions"] },
    unsupported: { name: "Unsupported" },
};
const keys = { "X-OpenAI-Key": "openai-secret", "X-Anthropic-Key": "anthropic-secret", "X-Google-Key": "google-secret" };
const stateApi = { ...endpointState, getProviderHeadersForKey: (headers, key) => headers?.[key] };
const routes = transpile(base + "chat/engine/endpointProfiles.ts", {
    "aihappey-state": stateApi,
    "aihappey-types": load("packages/aihappey-types/src/modelIdentity.ts"),
    "../../../runtime/providers/providerMetadata": { PROVIDERS: providers },
    "../../../runtime/providers/providerRequestConfig": { sanitizeProviderRequestConfigForProvider: value => value },
    "./genericChatEndpoint": { isGenericChatEndpoint: endpoint => endpointState.CHAT_ENDPOINT_IDS.includes(endpoint) && endpoint !== "/api/chat" },
    "../../provider-credentials/providerAuthHeaders": auth,
});
const { createChatRouteHeaders } = load(base + "chat/engine/chatRouteHeaders.ts");
const route = (options = {}) => routes.resolveChatRoute({ modelId: "openai/model", providers, customHeaders: keys, ...options });
const plain = headers => Object.fromEntries(new Headers(headers).entries());

function transpile(filename, mocks) {
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
    }).outputText;
    const module = { exports: {} };
    new Function("require", "module", "exports", code)(id => {
        if (id in mocks) return mocks[id];
        throw Error("Unmocked import " + id);
    }, module, module.exports);
    return module.exports;
}

test("canonical discovery merges transports, prefers gateway metadata, and preserves model types and direct request IDs", async () => {
    const requests = [];
    const { listModelsWithSplitProviderHeaders } = load(base + "provider-credentials/providerAuthHeaders.ts", {
        "aihappey-http": { createHttpClient: config => ({ get: async url => {
            requests.push({ url, headers: plain(config.headers) });
            return { data: url.startsWith("https://openai.test") ? [
                { id: "model", type: "language", name: "Direct label", context_window: 100 },
                { id: "direct-only", type: "language" },
            ] : [
                { id: "openai/model", type: "language", name: "Gateway label", context_window: 200 },
                { id: "openai/model", type: "decision", name: "Decision label" },
            ] };
        } }) },
    });
    const result = await listModelsWithSplitProviderHeaders({
        modelsApi: "https://gateway.test/models", customHeaders: { "X-OpenAI-Key": keys["X-OpenAI-Key"] },
        providers, directProviderModels: true, includeGatewayModels: true,
    });
    assert.equal(result.data.length, 3);
    const model = result.data.find(model => model.id === "openai/model" && model.type === "language");
    assert.equal(model.name, "Gateway label");
    assert.equal(model.context_window, 200);
    assert.equal(model.providerModelId, "model");
    assert.equal(model.sourceProviderKey, "openai");
    assert.equal(model.route, "gateway", "source availability is not the chosen transport");
    assert.equal(result.data.some(model => model.id.includes("__direct")), false);
    assert.equal(result.data.some(model => model.type === "decision"), true);
    const direct = requests.find(request => request.url.startsWith("https://openai.test"));
    assert.deepEqual(direct.headers, { authorization: "Bearer openai-secret" });
});

test("authenticated discovery never calls a direct provider, even with stale saved keys", async () => {
    const calls = [];
    const { listModelsWithSplitProviderHeaders } = load(base + "provider-credentials/providerAuthHeaders.ts", {
        "aihappey-http": { createHttpClient: config => ({ get: async url => { calls.push({ config, url }); return { data: [] }; } }) },
    });
    await listModelsWithSplitProviderHeaders({ modelsApi: "https://gateway.test/models", getAccessToken: async () => "entra",
        customHeaders: keys, providers, directProviderModels: true, includeGatewayModels: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://gateway.test/models");
    assert.deepEqual(calls[0].config.headers, {});
});

test("Gateway defaults to API chat, exposes exactly four protocols, and never follows model discovery source", () => {
    assert.deepEqual(routes.GATEWAY_CHAT_ENDPOINT_IDS, ["/api/chat", "/v1/responses", "/v1/messages", "/v1/chat/completions"]);
    assert.equal(route({ model: { id: "openai/model", route: "direct" } }).mode, "default");
    assert.equal(route().endpoint, "/api/chat");
    for (const endpoint of routes.GATEWAY_CHAT_ENDPOINT_IDS) {
        const selected = route({ mode: "default", selectedChatEndpoint: endpoint });
        assert.equal(selected.mode, "default"); assert.equal(selected.endpoint, endpoint);
        assert.equal(selected.endpointProfile.kind, "default");
    }
    assert.equal(route({ selectedChatEndpoint: "/v1/conversations" }).endpoint, "/api/chat");
});

test("Direct preserves a supported endpoint, otherwise chooses the provider preference and uses the real provider model ID", () => {
    const selected = route({ mode: "direct", selectedChatEndpoint: "/v1/chat/completions" });
    assert.equal(selected.mode, "direct"); assert.equal(selected.endpoint, "/v1/chat/completions");
    assert.equal(selected.endpointProfile.apiBaseUrl, "https://openai.test");
    assert.equal(route({ mode: "direct" }).endpoint, "/v1/responses");
    const switched = route({ mode: "direct", modelId: "anthropic/model", selectedChatEndpoint: selected.endpoint });
    assert.equal(switched.mode, "direct"); assert.equal(switched.endpoint, "/v1/messages");
    assert.equal(routes.resolveProviderRequestModelId({ modelId: "openai/model", providerKey: "openai" }), "model");
    assert.equal(routes.resolveProviderRequestModelId({ modelId: "openai/model", providerKey: "openai", model: { providerModelId: "upstream/exact-ID" } }), "upstream/exact-ID");
    assert.equal(routes.validateEndpointProfileForModel({ endpointProfile: selected.endpointProfile, modelId: "anthropic/model" }), undefined);
});

test("Direct requires an owned key and supported endpoint; fallback respects disabled Gateway", () => {
    for (const options of [{ modelId: "unsupported/model" }, { customHeaders: {} }, { customHeaders: { "X-OpenAIHK-Key": "not-openai" } }]) {
        const fallback = route({ mode: "direct", selectedChatEndpoint: "/v1/responses", ...options });
        assert.equal(fallback.mode, "default"); assert.equal(fallback.endpoint, "/api/chat");
        assert.equal(fallback.directAvailable, false); assert.equal(fallback.available, true);
        const blocked = route({ mode: "direct", gatewayEnabled: false, ...options });
        assert.equal(blocked.available, false); assert.match(blocked.error, /enable the gateway/);
    }
    const noGateway = route({ gatewayEnabled: false });
    assert.equal(noGateway.mode, "direct"); assert.equal(noGateway.available, true);
    assert.equal(noGateway.endpoint, "/v1/responses");
});

test("authenticated routing prohibits Direct and keeps gateway endpoint selection", () => {
    const forced = route({ authenticated: true, mode: "direct" });
    assert.equal(forced.mode, "default"); assert.equal(forced.directAvailable, false);
    assert.equal(forced.directProfile, undefined); assert.equal(forced.endpoint, "/api/chat");
    assert.equal(route({ authenticated: true, selectedChatEndpoint: "/v1/messages" }).endpoint, "/v1/messages");
});

test("gateway and native authentication are selected by route, never just by protocol", () => {
    const configuredHeaders = { Authorization: "gateway-secret", "X-Tenant": "gateway-only", ...keys };
    const common = { configuredHeaders, modelId: "anthropic/model", endpoint: "/v1/messages", providers, authenticated: false };
    const gateway = plain(createChatRouteHeaders(common));
    assert.equal(gateway.authorization, "gateway-secret");
    assert.equal(gateway["x-anthropic-key"], "anthropic-secret");
    assert.equal(gateway["x-openai-key"], undefined); assert.equal(gateway["x-api-key"], undefined);
    const direct = plain(createChatRouteHeaders({ ...common, directProviderKey: "anthropic",
        providerHeaders: { "x-trace": "selected-provider", Authorization: "wrong", "X-OpenAI-Key": "wrong-provider" } }));
    assert.equal(direct["x-api-key"], "anthropic-secret");
    assert.equal(direct["anthropic-version"], "2023-06-01");
    assert.equal(direct["anthropic-dangerous-direct-browser-access"], "true");
    assert.equal(direct.authorization, undefined); assert.equal(direct["x-tenant"], undefined);
    assert.equal(direct["x-openai-key"], undefined); assert.equal(direct["x-trace"], "selected-provider");
    const openai = plain(createChatRouteHeaders({ ...common, directProviderKey: "openai", endpoint: "/v1/responses",
        customHeaders: { "x-OPENAI-key": "override" } }));
    assert.deepEqual(openai, { authorization: "Bearer override" });
    const google = plain(createChatRouteHeaders({ ...common, directProviderKey: "google", endpoint: "/v1beta/interactions" }));
    assert.deepEqual(google, { "x-goog-api-key": "google-secret" });
    assert.throws(() => createChatRouteHeaders({ ...common, directProviderKey: "openai", authenticated: true }), /unavailable/);
});

test("blocked routes dispatch no request; gateway auth owns Authorization on all protocols", async () => {
    let calls = 0;
    const { useAuthFetch } = transpile(base + "chat/engine/useAuthFetch.ts", {
        react: { useMemo: factory => factory() },
        "../../provider-credentials/scopedRequest": { createCredentialScopedFetch: fetch => fetch },
        "./apiDebug": { setApiDebugHeader() {} },
    });
    const blocked = useAuthFetch({ chatMode: "chat", requestError: route({ gatewayEnabled: false, customHeaders: {} }).error,
        customFetch: async () => { calls++; } });
    await assert.rejects(blocked("https://gateway.test/api/chat"), /Direct access is unavailable/);
    assert.equal(calls, 0);
    let seen;
    const authenticated = useAuthFetch({ chatMode: "chat", getAccessToken: async () => "entra",
        customHeaders: { Authorization: "stale", "x-api-key": "endpoint-key" },
        customFetch: async (url, init) => { seen = plain(init.headers); return new Response(); } });
    await authenticated("https://gateway.test/v1/messages");
    assert.equal(seen.authorization, "Bearer entra");
    const failing = useAuthFetch({ chatMode: "chat", getAccessToken: async () => { throw Error("token failed"); },
        customFetch: async () => { calls++; } });
    await assert.rejects(failing("https://gateway.test/v1/responses"), /token failed/);
    assert.equal(calls, 0);
});

test("direct fetch pins native credentials, omits cookies, and rejects a different destination", async () => {
    const requests = [];
    const { useAuthFetch } = transpile(base + "chat/engine/useAuthFetch.ts", {
        react: { useMemo: factory => factory() },
        "../../provider-credentials/scopedRequest": { createCredentialScopedFetch: fetch => fetch },
        "./apiDebug": { setApiDebugHeader() {} },
    });
    const fetcher = useAuthFetch({ chatMode: "chat", directBaseUrl: "https://openai.test/provider",
        customHeaders: { Authorization: "Bearer openai-secret" },
        customFetch: async (url, init) => { requests.push({ url, ...init }); return new Response(); } });
    await fetcher("https://openai.test/provider/v1/responses", { credentials: "include",
        headers: { Authorization: "gateway-secret", "x-api-key": "anthropic-secret", "X-Trace": "trace" } });
    assert.equal(plain(requests[0].headers).authorization, "Bearer openai-secret");
    assert.equal(plain(requests[0].headers)["x-api-key"], undefined);
    assert.equal(plain(requests[0].headers)["x-trace"], "trace");
    assert.equal(requests[0].credentials, "omit");
    await assert.rejects(fetcher("https://gateway.test/v1/responses"), /different endpoint/);
    await assert.rejects(fetcher("https://openai.test/gateway/v1/responses"), /different endpoint/);
    assert.equal(requests.length, 1);
});

test("refresh ignores old routing storage and persistence retains gateway enablement, not route selections", () => {
    let options;
    transpile("packages/aihappey-state/src/persist.ts", {
        "zustand/middleware": { persist: (creator, config) => { options = config; return creator; } },
        "./slices/modelPreferences": require("./credential-test-loader.cjs").load("packages/aihappey-state/src/slices/modelPreferences.ts"),
        "./slices/chatSlice": { DEFAULT_CHAT_VERBOSITY: "medium", DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: {}, DEFAULT_TOOL_OUTPUT_CONTENT_SETTINGS: {} },
        "./slices/chatEndpoint": endpointState,
        "./slices/uiSlice": { normalizeCustomProviders: value => value },
        "./slices/apiKeyEncryption": { resolveApiKeyEncryptionStatus: () => "none" },
        "./slices/providerHeaders": { normalizeProviderHeaders: value => value, splitLegacyProviderHeadersFromMetadata: value => value },
        "./slices/defaultProviderTranscriptionMetadata": { normalizeProviderTranscriptionMetadata: value => value },
        "./slices/providerMetadataAliases": { normalizeSpaceXAiProviderMetadata: value => value },
    }).withPersist(() => ({}));
    const stale = { configuredChatEndpointMode: "direct", selectedChatEndpointMode: "direct", selectedChatEndpoint: "/v1/messages",
        configuredChatEndpoint: "/v1/responses", selectedEndpointProfileId: "provider:anthropic", selectedBaseUrl: "https://old.test", gatewayEnabled: false };
    const hydrated = options.migrate(stale, 37);
    assert.equal(hydrated.effectiveChatEndpointMode, "default"); assert.equal(hydrated.effectiveChatEndpoint, "/api/chat");
    assert.equal(hydrated.selectedEndpointProfileId, undefined); assert.equal(hydrated.selectedBaseUrl, undefined);
    assert.equal(hydrated.gatewayEnabled, false);
    const saved = options.partialize(stale);
    for (const field of Object.keys(stale).filter(field => field !== "gatewayEnabled")) assert.equal(field in saved, false, field);
    assert.equal(saved.gatewayEnabled, false);
    const original = global.window;
    global.window = { localStorage: { getItem: () => "direct", setItem: () => { throw Error("must not save routing"); } } };
    try { assert.equal(endpointState.readStoredChatEndpointMode(), undefined); }
    finally { global.window = original; }
});

test("the real menu exposes Gateway in AzureAuth, hides Direct there, and disables unavailable route groups", () => {
    for (const authenticated of [false, true]) for (const directAvailable of [false, true]) {
        const render = renderer();
        let props;
        const selected = [];
        const state = { models: [], enabledProvidersByType: {}, setSelectedChatEndpointMode: value => selected.push(value),
            setSelectedChatEndpoint: value => selected.push(value) };
        const { UserMenuButton } = transpile(base + "user-settings/UserMenuButton.tsx", {
            react: render.react, "aihappey-components": { useTheme: () => ({ UserMenu: value => { props = value; return null; } }) },
            "aihappey-i18n": { useTranslation: () => ({ t: (key, fallback) => fallback ?? key }) },
            "aihappey-state": { useAppStore: selector => selector(state), PROVIDER_CAPABILITIES: [] },
            "../../runtime/providers/providerMetadata": { PROVIDERS: providers },
            "../chat/context/ChatContext": { useChatContext: () => ({ config: authenticated ? { getAccessToken() {} } : {} }) },
            "../chat/engine/endpointProfiles": routes,
            "../chat/engine/useChatRoute": { useChatRoute: () => ({ ...route(), gatewayAvailable: true, directAvailable,
                directProfile: { chatEndpoints: ["/v1/responses"] } }) },
            "../provider-credentials/ProviderKeysModal": { ProviderKeysModal: () => null },
        });
        render.render(UserMenuButton, { onSettings() {}, onLogout() {} });
        assert.equal(props.showChatEndpointsItem, true);
        assert.equal(props.chatEndpointGroups[0].label, "Gateway");
        assert.equal(props.chatEndpointGroups[0].options.length, 4);
        assert.equal(props.chatEndpointGroups.length, authenticated ? 1 : 2);
        assert.equal(props.showApiKeysItem, !authenticated);
        if (!authenticated) {
            assert.equal(props.chatEndpointGroups[1].disabled, !directAvailable);
            props.onSelectChatEndpoint("direct:/v1/responses");
            assert.deepEqual(selected, directAvailable ? ["direct", "/v1/responses"] : []);
        }
    }
});

test("synchronized route state keeps Direct between supported providers, falls back once, and never silently re-enters Direct", () => {
    const render = renderer();
    const state = {
        selectedModel: "openai/model", models: [], effectiveChatEndpointMode: "direct", effectiveChatEndpoint: "/v1/chat/completions",
        customHeaders: keys, gatewayEnabled: true,
        setSelectedChatEndpointMode(mode) { state.effectiveChatEndpointMode = mode; },
        setSelectedChatEndpoint(endpoint) { state.effectiveChatEndpoint = endpoint; },
    };
    const { useChatRoute } = transpile(base + "chat/engine/useChatRoute.ts", {
        react: render.react, "aihappey-state": { useAppStore: selector => selector(state) },
        "../../../runtime/providers/useProviderRegistry": { useProviderRegistry: () => providers },
        "../../provider-credentials/providerAuthHeaders": auth, "./endpointProfiles": routes,
    });
    let result;
    function Component({ config }) { result = useChatRoute(config, true); return null; }
    const config = { baseUrl: "https://gateway.test" };
    const update = patch => { Object.assign(state, patch); render.render(Component, { config }); };
    update({}); assert.equal(result.endpoint, "/v1/chat/completions");
    update({ selectedModel: "anthropic/model" });
    assert.equal(state.effectiveChatEndpointMode, "direct"); assert.equal(state.effectiveChatEndpoint, "/v1/messages");
    update({ selectedModel: "unsupported/model" });
    assert.equal(state.effectiveChatEndpointMode, "default"); assert.equal(state.effectiveChatEndpoint, "/api/chat");
    update({ selectedModel: "openai/model" }); assert.equal(result.mode, "default");
    update({ gatewayEnabled: false }); assert.equal(result.mode, "direct");
    update({ customHeaders: {} }); assert.equal(result.available, false); assert.equal(state.gatewayEnabled, false);
    assert.equal(state.effectiveChatEndpointMode, "direct");
    update({ customHeaders: keys }); assert.equal(result.available, true); assert.equal(result.mode, "direct");
});

test("manual direct tool continuations keep the dispatched provider URL and key until the next user turn", async () => {
    const render = renderer(), requests = [];
    const state = { chatMode: "chat", selectedChatModelIds: undefined, sideInferenceAgentNames: {}, favoriteAgentRouter: false };
    const store = { getState: () => state, setState: patch => Object.assign(state, patch) };
    const { useAuthFetch } = transpile(base + "chat/engine/useAuthFetch.ts", {
        react: render.react, "../../provider-credentials/scopedRequest": { createCredentialScopedFetch: fetch => fetch },
        "./apiDebug": { setApiDebugHeader() {} },
    });
    const { useFavoriteRouterTransport } = transpile(base + "chat/engine/useFavoriteRouterTransport.ts", {
        react: render.react, "react-dom": { flushSync: fn => fn() }, "aihappey-state": { store },
        "../context/ChatContext": { useChatContext: () => ({ config: {} }) },
        "../../transcriptions/knownSpeakersProviderMetadata": {},
        "./favoriteRouter": {
            isNewFavoriteRouterTurn: options => options.trigger === "submit-message" && options.messages.at(-1)?.role === "user",
            chatModelCandidateIds: () => ["one-model"],
        },
    });
    let transport;
    function Component({ providerKey }) {
        const selected = route({ mode: "direct", modelId: `${providerKey}/model` });
        const url = selected.endpointProfile.apiBaseUrl + selected.endpoint;
        const headers = createChatRouteHeaders({ customHeaders: keys, modelId: `${providerKey}/model`,
            directProviderKey: providerKey, endpoint: selected.endpoint, authenticated: false, providers });
        const fetcher = useAuthFetch({ chatMode: "chat", directBaseUrl: selected.endpointProfile.apiBaseUrl,
            customHeaders: headers, customFetch: async (url, init) => { requests.push({ url, headers: plain(init.headers) }); return new Response(); } });
        const actual = { sendMessages: () => fetcher(url), reconnectToStream: () => fetcher(url) };
        transport = useFavoriteRouterTransport(actual, { model: "model" });
        return null;
    }
    render.render(Component, { providerKey: "openai" });
    await transport.sendMessages({ trigger: "submit-message", messages: [{ role: "user" }] });
    render.render(Component, { providerKey: "anthropic" });
    await transport.sendMessages({ trigger: "submit-message", messages: [{ role: "assistant" }] });
    assert.equal(requests[0].url, "https://openai.test/v1/responses");
    assert.deepEqual(requests[1], requests[0]);
    await transport.sendMessages({ trigger: "regenerate-message", messages: [{ role: "user" }] });
    assert.equal(requests[2].url, "https://anthropic.test/v1/messages");
    assert.equal(requests[2].headers["x-api-key"], "anthropic-secret");
    assert.equal(requests[2].headers.authorization, undefined);
    render.render(Component, { providerKey: "openai" });
    await transport.sendMessages({ trigger: "submit-message", messages: [{ role: "assistant" }] });
    assert.deepEqual(requests[3], requests[2]);
    await transport.sendMessages({ trigger: "submit-message", messages: [{ role: "user" }] });
    assert.deepEqual(requests[4], requests[0]);
});

test("all three theme menus render distinct Gateway and Direct groups and disambiguated checked endpoint values", () => {
    const React = require("react");
    const groups = [{ value: "default", label: "Gateway", options: [{ value: "default:/v1/responses", label: "/v1/responses" }] },
        { value: "direct", label: "Direct", disabled: true, options: [{ value: "direct:/v1/responses", label: "/v1/responses" }] }];
    const primitive = new Proxy({}, { get: (_, name) => String(name) });
    for (const theme of ["fluent", "bootstrap", "material"]) {
        const render = renderer();
        const bootstrap = Object.assign(props => React.createElement("Dropdown", props), {
            Toggle: "DropdownToggle", Menu: "DropdownMenu", Item: "DropdownItem", Header: "DropdownHeader", Divider: "DropdownDivider",
        });
        const { UserMenu } = transpile(`packages/aihappey-theme-${theme}/src/primitives/UserMenu.tsx`, {
            react: render.react, "@fluentui/react-components": primitive, "@fluentui/react-icons": primitive,
            "@mui/material": primitive, "./icons": { renderIcon: () => null },
            "react-bootstrap/Dropdown": { default: bootstrap }, "react-bootstrap-icons": primitive,
        });
        const tree = render.render(UserMenu, { onSettings() {}, onLogout() {}, showChatEndpointsItem: true,
            chatEndpointGroups: groups, selectedChatEndpoint: "default:/v1/responses", labels: {} });
        const text = JSON.stringify(tree);
        assert.match(text, /Gateway/); assert.match(text, /Direct/);
        assert.match(text, /default:\/v1\/responses/);
        assert.doesNotMatch(text, /Chat endpoint \(default:/);
    }
});

test("typed and prompt actions use the same canonical gateway or upstream direct model and block unavailable routes before saving", async () => {
    for (const mode of ["default", "direct", "blocked"]) {
        const saved = [], sent = [], errors = [];
        const model = { id: "openai/model", providerModelId: "native-exact-model", type: "language" };
        const state = { chatMode: "chat", models: [model], selectedAgentNames: [], agents: [], remoteAgentModels: [],
            providerMetadata: { openai: { service_tier: "auto" }, anthropic: { thinking: { type: "disabled" } } } };
        const selected = route({ mode: mode === "default" ? "default" : "direct", model,
            ...(mode === "blocked" ? { gatewayEnabled: false, customHeaders: {} } : {}) });
        const runtime = { clear() {} };
        const message = text => ({ role: "user", parts: [{ type: "text", text }] });
        const { useChatActions } = transpile(base + "chat/engine/useChatActions.ts", {
            react: { useMemo: fn => fn(), useCallback: fn => fn }, "aihappey-state": { useAppStore: selector => selector(state) },
            "../messages/useUserMessageBuilder": { useUserMessageBuilder: () => ({
                buildFromText: async text => message(text), buildFromPrompt: async prompt => message(prompt.name),
            }) },
            "./useActiveProviderMetadata": { useActiveProviderMetadata: () => state.providerMetadata },
            "../layout/useChatErrors": { useChatErrors: () => ({ addChatError: error => errors.push(error) }) },
            "../context/ChatContext": { useChatContext: () => ({ config: {} }) },
            "./useChatRoute": { useChatRoute: () => selected },
            "../../storage/storageErrorMessage": { useStorageErrorMessage: () => error => error },
            "../../../runtime/mcp/mcpResourceRuntime": { mcpResourceRuntime: runtime },
            "../../../runtime/files/fileAttachmentRuntime": { fileAttachmentRuntime: runtime },
            "../../../runtime/files/urlAttachmentRuntime": { urlAttachmentRuntime: runtime },
            "../../agents/agentSelection": { buildSelectedAgentRequest: () => ({ requestAgents: [], models: [] }), buildWorkflowMetadata() {} },
            "./endpointProfiles": routes,
            "../../tools/toolRequestConfig": { decorateToolsWithRequestConfig: tools => tools },
            "./genericChatEndpoint": { isGenericChatEndpoint: endpoint => endpoint !== "/api/chat" },
        });
        const actions = useChatActions({ selectedModel: model.id, conversationId: "conversation", finalTools: [],
            addMessage: async (id, message) => saved.push(message), sendMessage: async (message, options) => sent.push(options.body) });
        await actions.handleSend("typed");
        await actions.onPromptExecute({ name: "prompt" });
        if (mode === "blocked") {
            assert.equal(saved.length, 0); assert.equal(sent.length, 0); assert.equal(errors.length, 2);
        } else {
            assert.equal(errors.length, 0); assert.equal(saved.length, 2); assert.equal(sent.length, 2);
            for (const body of sent) {
                assert.equal(body.model, mode === "direct" ? "native-exact-model" : "openai/model");
                if (mode === "direct") {
                    assert.equal(body.omitProviderMetadataInNativeMetadata, true);
                    assert.deepEqual(body.providerMetadata, { openai: { service_tier: "auto" } });
                    assert.deepEqual(body.providerRequestConfig, { service_tier: "auto" });
                } else assert.deepEqual(body.providerMetadata, state.providerMetadata);
            }
        }
    }
});

test("optional helper requests never fall back to another provider's URL or use Azure tokens for direct access", async () => {
    const { invokeSideInferenceAgent } = transpile("packages/aihappey-core/src/runtime/chat-app/sideInferenceAgentCall.ts", {
        "../../features/provider-credentials/providerAuthHeaders": auth,
        "../../features/chat/engine/endpointProfiles": routes,
        "../../features/chat/engine/genericChatEndpoint": { isGenericChatEndpoint: endpoint => endpoint !== "/api/chat" },
        "../providers/providerRequestConfig": { sanitizeProviderRequestConfigForProvider: value => value },
        "../providers/providerMetadata": { PROVIDERS: providers },
    });
    const requests = [];
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
        for (const options of [
            { fallbackModelId: "unsupported/model", models: [{ id: "unsupported/model" }] },
            { fallbackModelId: "anthropic/model", models: [{ id: "anthropic/model" }] },
            { fallbackModelId: "openai/model", models: [{ id: "openai/model" }], customHeaders: {} },
            { fallbackModelId: "openai/model", models: [{ id: "openai/model" }], getAccessToken: async () => "entra" },
        ]) {
            const result = await invokeSideInferenceAgent({ feature: "conversationName", input: "title", gatewayEnabled: false,
                baseUrl: "https://different-provider.test", endpointProviderKey: "google", providers, customHeaders: keys,
                fetch: async (url, init) => { requests.push({ url, init }); return Response.json({ output_text: "title" }); },
                fallback: "New chat", ...options });
            assert.equal(result, "New chat");
        }
        assert.equal(requests.length, 0);
        const result = await invokeSideInferenceAgent({ feature: "conversationName", input: "title", gatewayEnabled: false,
            baseUrl: "https://different-provider.test", providers, customHeaders: keys,
            models: [{ id: "openai/model", sourceProviderKey: "openai", providerModelId: "native-ID" }], fallbackModelId: "openai/model",
            fetch: async (url, init) => { requests.push({ url, init }); return Response.json({ output_text: "title" }); } });
        assert.equal(result, "title"); assert.equal(requests[0].url, "https://openai.test/v1/responses");
        assert.deepEqual(plain(requests[0].init.headers), { "content-type": "application/json", authorization: "Bearer openai-secret" });
        assert.equal(JSON.parse(requests[0].init.body).model, "native-ID");
    } finally { console.warn = originalWarn; }
});

test("authenticated shell guard clears Direct overrides but does not reset a selected Gateway endpoint", () => {
    const filename = "packages/aihappey-core/src/shell/CoreShell.tsx";
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let effect;
    function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === "useEffect"
            && node.arguments[0]?.getText(source).includes("authenticated && configuredChatEndpointMode")) {
            effect = node.arguments[0].body.getText(source);
        }
        ts.forEachChild(node, visit);
    }
    visit(source); assert.ok(effect);
    const calls = [];
    const guard = new Function("authenticated", "configuredChatEndpointMode", "selectedChatEndpointMode", "selectedBaseUrl",
        "selectedEndpointProfileId", "setConfiguredChatEndpointMode", "setSelectedChatEndpointMode", "setSelectedBaseUrl", "setSelectedEndpointProfileId", effect);
    const setters = ["configured", "mode", "base", "profile"].map(name => value => calls.push([name, value]));
    guard(true, "default", "default", undefined, undefined, ...setters);
    assert.deepEqual(calls, [], "choosing a Gateway endpoint must not clear it on the next effect");
    guard(true, "default", "direct", undefined, undefined, ...setters);
    assert.deepEqual(calls, [["mode", undefined]]);
});
