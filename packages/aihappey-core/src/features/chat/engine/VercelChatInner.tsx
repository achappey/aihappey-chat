import { DefaultChatTransport, FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, useChat } from "aihappey-ai";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { AttachmentsDrawer, MessageSourcesDrawer, useTheme } from "aihappey-components";
import { useFiles } from "aihappey-files";
import { ActivityDrawer } from "../activity/drawer/ActivityDrawer";
import { MessageInput } from "../input/MessageInput";
import { useAttachmentParts } from "../messages/useAttachmentParts";
import { useChatFileDrop } from "../input/useChatFileDrop";
import { useOnToolCall } from "../../tools/toolcalls/useOnToolCall";
import { findLatestLocalJsonRenderTree } from "../../tools/toolcalls/useLocalJsonRenderToolCall";
import { MessageList } from "../messages/MessageList";
import { conversationGatewayCostTotal } from "../messages/toChatMessages";
import { SYSTEM_ROLE, type UIMessage } from "aihappey-types";
import { useChatActions } from "./useChatActions";
import { useSystemMessage } from "../messages/useSystemMessage";
import { useChatContext } from "../context/ChatContext";
import { useChatErrors } from "../layout/useChatErrors";
import { ChatErrors } from "../layout/ChatErrors";
import { useAccessToken } from "aihappey-auth";
import { ToolDrawer } from "../../tools";
import { getToolName, useTools } from "../../tools/useTools";
import { deferClientToolSearchCandidates, shapeToolsForRequest } from "../../tools/toolRequestConfig";
import { useActiveProviderMetadata } from "./useActiveProviderMetadata";
import { conversationName as generateConversationName } from "../../../runtime/chat-app/conversationName";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";
import { MessageActivityDrawer } from "../activity/drawer/MessageActivityDrawer";
import { ToolCallResultModal } from "../activity/content/ToolCallResultModal";
import { useAuthFetch } from "./useAuthFetch";
import { usePendingMessageAutoSend } from "./usePendingMessageAutoSend";
import { useAbortRun } from "./useAbortRun";
import { useApiRef } from "./useApiRef";
import { ElicitationModalHost } from "../../elicitation/ElicitationModalHost";
import { ToolApprovalModalHost } from "../../tools/ToolApprovalModalHost";
import { sendAutomaticallyWhen } from "./sendAutomaticallyWhen";
import { useIsDesktop } from "../../../shell/responsive/useIsDesktop";
import { countCompletedToolCallsLastAssistant } from "./countCompletedToolCallsLastAssistant";
import { shouldForceToolChoiceNone } from "./shouldForceToolChoiceNone";
import { languageNames, useTranslation } from "aihappey-i18n";
import { useAttachmentsToaster } from "./useAttachmentsToaster";
import {
  createCatalogFromStored,
  getDefaultCatalogDefinitionsWithActions,
  mapLegacyDefaultCatalogSelection,
} from "../../json-render/catalog";
import { useJsonRenderRegistry } from "aihappey-json-render-registry";
import { useJsonRenderCatalog } from "aihappey-json-render-catalog";
import { useUIStream } from "../../json-render/useUIStream";
import { useStorageErrorMessage } from "../../storage/storageErrorMessage";
import { buildSelectedAgentRequest } from "../../agents/agentSelection";
import {
  createChatAuthHeadersForModel,
  createMessagesEndpointAuthHeadersForModel,
  createMessagesEndpointHeadersForProviderKey,
  createProviderBearerHeadersForProviderKey,
  getProviderApiKeyHeaderEntries,
  getProviderKeyFromModelId,
} from "../../provider-credentials/providerAuthHeaders";
import {
  GenericChatEndpointTransport,
  isGenericChatEndpoint,
  resolveGenericChatEndpointUrl,
  wrapGenericChatFetch,
} from "./genericChatEndpoint";
import { buildGenericChatEndpointBody } from "./genericEndpointMappers";
import {
  resolveEndpointProfileForSelectedModel,
  resolveEndpointProfileChatEndpoint,
  resolveEndpointProfileProviderConfig,
  resolveEndpointProfileProviderHeaders,
  resolveEndpointProfileRequestMetadata,
  resolveEndpointProfileRequestProviderHeaders,
  resolveProviderRequestModelId,
  splitEndpointProfileProviderConfig,
  stripProviderPrefix,
  validateEndpointProfileForModel,
} from "./endpointProfiles";
import { useProviderRegistry } from "../../../runtime/providers/useProviderRegistry";

/*────────────────────────  INNER CHAT  ───────────────────────────*/
export function VercelChatInner({
  getAccessToken,
  headers,
  temperature,
  temperatureChanged,
  customFetch,
  initial,
}: {
  // model?: string;
  temperature?: number;
  temperatureChanged?: (temperature: number) => Promise<void>;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  customFetch?: typeof fetch;
  initial: UIMessage[];
}) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const { addChatError } = useChatErrors();
  const getStorageErrorMessage = useStorageErrorMessage();
  const [sources, setSources] = useState<(SourceUrlUIPart | SourceDocumentUIPart)[] | undefined>(undefined);
  const [messageActivity, setMessageActivity] = useState<any[] | undefined>(undefined);
  const [showToolCall, setShowToolCall] = useState<any | undefined>(undefined);
  const [messageAttachments, setMessageAttachments] = useState<FileUIPart[] | undefined>(undefined);
  const [usedTools, setUsedTool] = useState<any[] | undefined>(undefined);
  const { addMessage, rename, updateMessage, get, items } = useConversations();
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const navigate = useNavigate();
  const debugMode = useAppStore((a) => a.debugMode);
  const chatMode = useAppStore((a) => a.chatMode);
  const stopTools = useAppStore((a) => a.stopTools);
  const toolChoice = useAppStore((a) => a.toolChoice);
  const maxToolCalls = useAppStore((a) => a.maxToolCalls);
  const activeData = useAppStore((a) => a.activeData);
  const maxOutputTokens = useAppStore((a) => a.maxOutputTokens);
  const toolRequestConfig = useAppStore((a) => (a as any).toolRequestConfig);
  const useToolNamespaces = useAppStore((a) => !!(a as any).useToolNamespaces);
  const effectiveChatEndpoint = useAppStore((a) => a.effectiveChatEndpoint);
  const effectiveChatEndpointMode = useAppStore((a) => a.effectiveChatEndpointMode);
  const selectedEndpointProfileId = useAppStore((a) => a.selectedEndpointProfileId);
  const selectedBaseUrl = useAppStore((a) => a.selectedBaseUrl);
  const configuredChatEndpoint = useAppStore((a) => a.configuredChatEndpoint);
  const endpointRawModelIds = useAppStore((a) => a.endpointRawModelIds);
  const endpointProviderMetadataEnabled = useAppStore((a) => a.endpointProviderMetadataEnabled);
  const callTool = useAppStore((a) => a.callTool);
  const activeProviderMetadata = useActiveProviderMetadata();
  const allProviderMetadata = useAppStore((a) => a.providerMetadata);
  const allProviderHeaders = useAppStore((a) => a.providerHeaders);
  const files = useFiles();
  const model = useAppStore((s) => s.selectedModel);
  const models = useAppStore((s) => s.models);
  const selectedModelOption = useMemo(
    () => models?.find((item: any) => item.id === model),
    [models, model],
  );
  const providers = useProviderRegistry();
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const includeSystem = chatMode !== "agent";
  const { Spinner, JsonViewer, Toast } = useTheme();
  const { config } = useChatContext();
  const { t, i18n } = useTranslation();
  const language = languageNames[i18n.language as keyof typeof languageNames] ?? i18n.language;
  const jsonRenderRegistry = useJsonRenderRegistry();
  const jsonRenderCatalog = useJsonRenderCatalog();
  const defaultCatalogs = useAppStore((s) => s.defaultCatalogs);
  const endpointProfile = useMemo(
    () => resolveEndpointProfileForSelectedModel({
        modelId: model,
        model: selectedModelOption,
        selectedEndpointProfileId,
        selectedBaseUrl,
        selectedChatEndpoint: effectiveChatEndpoint,
        configuredChatEndpoint,
        providers,
      }),
    [model, selectedModelOption, selectedEndpointProfileId, selectedBaseUrl, effectiveChatEndpoint, configuredChatEndpoint, providers],
  );
  const requestEndpointProfile = validateEndpointProfileForModel({
    endpointProfile,
    modelId: model,
    model: selectedModelOption,
  });
  const isProviderEndpointProfile = requestEndpointProfile?.kind === "provider";
  const requestEndpoint = resolveEndpointProfileChatEndpoint({
    endpointProfile: requestEndpointProfile,
    selectedChatEndpoint: effectiveChatEndpoint,
  }) ?? effectiveChatEndpoint;
  const requestBaseUrl = isProviderEndpointProfile
    ? requestEndpointProfile.apiBaseUrl ?? config.baseUrl
    : config.baseUrl;
  const requestModel = isProviderEndpointProfile
    ? resolveProviderRequestModelId({
      modelId: model,
      providerKey: requestEndpointProfile.providerKey,
      model: selectedModelOption,
    })
    : endpointRawModelIds
      ? stripProviderPrefix(model)
      : model;
  const providerMetadata = useMemo(
    () => resolveEndpointProfileRequestMetadata({
        activeProviderMetadata,
        providerMetadata: allProviderMetadata,
        endpointProfile: requestEndpointProfile,
        fallbackProviderMetadataEnabled: endpointProviderMetadataEnabled !== false,
      }),
    [activeProviderMetadata, allProviderMetadata, requestEndpointProfile, endpointProviderMetadataEnabled],
  );
  const providerHeaders = useMemo(
    () => resolveEndpointProfileRequestProviderHeaders({
      providerHeaders: allProviderHeaders,
      endpointProfile: requestEndpointProfile,
      selectedModelProviderKey: model?.split("/")[0],
    }),
    [allProviderHeaders, requestEndpointProfile, model],
  );
  const endpointProfileProviderConfig = useMemo(
    () => resolveEndpointProfileProviderConfig({
      activeProviderMetadata,
      providerMetadata: allProviderMetadata,
      endpointProfile: requestEndpointProfile,
    }),
    [activeProviderMetadata, allProviderMetadata, requestEndpointProfile],
  );
  const { body: providerRequestConfig, headers: providerRequestHeaders } = useMemo(
    () => splitEndpointProfileProviderConfig(endpointProfileProviderConfig, requestEndpointProfile?.providerKey, requestEndpoint),
    [endpointProfileProviderConfig, requestEndpointProfile, requestEndpoint],
  );
  const endpointProfileProviderHeaders = useMemo(
    () => resolveEndpointProfileProviderHeaders({
      providerHeaders: allProviderHeaders,
      endpointProfile: requestEndpointProfile,
    }),
    [allProviderHeaders, requestEndpointProfile],
  );

  /* const [toast, setToast] = useState<{
     id: string;
     variant: "info" | "success" | "error";
     message: any;
     show: boolean;
     autohide?: number;
   }>({
     id: "add-to-files",
     variant: "success",
     message: "",
     show: false,
     autohide: 2500,
   });*/

  const isDesktop = useIsDesktop();
  const handoffs = useAppStore(a => a.handoffs)
  const maximumIterationCount = useAppStore(a => a.maximumIterationCount)
  const workflowType = useAppStore(a => a.workflowType)
  const structuredOutputs = useAppStore(a => a.structuredOutputs)
  const verbosity = useAppStore(a => a.verbosity)
  const gatewayEnabled = useAppStore((a: any) => a.gatewayEnabled);
  const selectedAgentRequest = useMemo(
    () => buildSelectedAgentRequest(selectedAgentNames, agents, remoteAgentModels),
    [selectedAgentNames, agents, remoteAgentModels],
  );

  const addAttachmentWithTranscription = async (file: File) => {

    // Fallback: just add as normal file attachment
    fileAttachmentRuntime.add(file);
  };

  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachmentWithTranscription
  );

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  const persistedMessages = useMemo(() => {
    const conversationMessages = items.find(a => a.id == conversationId)?.messages;
    const sourceMessages = conversationMessages?.length ? conversationMessages : initial;

    return [...(sourceMessages ?? [])].sort(
      (a: any, b: any) =>
        new Date(a.metadata?.timestamp ?? 0).getTime() -
        new Date(b.metadata?.timestamp ?? 0).getTime()
    );
  }, [conversationId, items, initial]);
  const systemMessage = useSystemMessage();
  const seededMessages = useMemo(() => {
    const nonSystem = persistedMessages.filter((a) => a.role !== SYSTEM_ROLE);
    return includeSystem ? [systemMessage, ...nonSystem] : nonSystem;
  }, [includeSystem, systemMessage, persistedMessages]);

  const [, , , refreshToken] = useAccessToken(config.agentScopes ?? []);

  const apiKeyHeaders: any = useMemo(
    () => createChatAuthHeadersForModel(customHeaders, model, Boolean(getAccessToken), providers),
    [customHeaders, getAccessToken, model, providers],
  );

  const providerProfileAuthHeaders: any = useMemo(() => {
    const providerKey = isProviderEndpointProfile ? requestEndpointProfile.providerKey : undefined;

    if (requestEndpoint === "/v1/messages") {
      return {
        ...createMessagesEndpointHeadersForProviderKey(customHeaders, providerKey, providers),
        ...(endpointProfileProviderHeaders ?? {}),
        ...(providerRequestHeaders ?? {}),
      };
    }

    return {
      ...createProviderBearerHeadersForProviderKey(customHeaders, providerKey, providers),
      ...(endpointProfileProviderHeaders ?? {}),
      ...(providerRequestHeaders ?? {}),
    };
  }, [customHeaders, requestEndpointProfile, isProviderEndpointProfile, providerRequestHeaders, providers, requestEndpoint, endpointProfileProviderHeaders]);

  const createConversationName = useCallback(
    (text: string) => generateConversationName(text, language, {
      baseUrl: requestBaseUrl,
      fetch: config.fetch ?? customFetch,
      ...(isProviderEndpointProfile
        ? {
          customHeaders,
          endpointProviderKey: requestEndpointProfile.providerKey,
          gatewayEnabled: false,
          providers,
        }
        : {
          getAccessToken,
          customHeaders,
          gatewayEnabled: (config as any)?.gatewayEnabled !== false && gatewayEnabled !== false,
          providers,
        }),
      fallback: t("newChat") ?? "New chat",
    }),
    [
      requestBaseUrl,
      config.fetch,
      customFetch,
      isProviderEndpointProfile,
      customHeaders,
      requestEndpointProfile,
      providers,
      getAccessToken,
      language,
      t,
    ]
  );

  const getAgentApiKeyHeaders = useCallback((agents: any[] | undefined) => {
    const providerKeys = Array.from(
      new Set(
        (agents ?? [])
          .map((agent: any) => getProviderKeyFromModelId(agent?.model?.id))
          .filter(Boolean)
      )
    );

    return Object.fromEntries(
      providerKeys.flatMap((providerKey) => getProviderApiKeyHeaderEntries(customHeaders, providerKey, providers))
    );
  }, [customHeaders, providers]);

  const authFetchCustomHeaders = chatMode === "agent"
    ? undefined
    : isProviderEndpointProfile
      ? providerProfileAuthHeaders
      : requestEndpoint === "/v1/messages"
        ? createMessagesEndpointAuthHeadersForModel(customHeaders, model, Boolean(getAccessToken), providers)
      : apiKeyHeaders;

  const authFetch = useAuthFetch({
    chatMode,
    getAccessToken,
    refreshToken,
    headers,
    customHeaders: authFetchCustomHeaders,
    customFetch,
  });

  const chatFetch = useMemo(() => {
    if (!isGenericChatEndpoint(requestEndpoint)) return authFetch;
    return wrapGenericChatFetch({
      endpoint: requestEndpoint,
      fetcher: authFetch as typeof fetch,
      providerKey: isProviderEndpointProfile ? requestEndpointProfile.providerKey : undefined,
      providers,
    });
  }, [authFetch, requestEndpointProfile, isProviderEndpointProfile, providers, requestEndpoint]);

  const api = chatMode === "agent"
    ? config?.agentEndpoint + "/api/chat"
    : isGenericChatEndpoint(requestEndpoint)
      ? resolveGenericChatEndpointUrl(requestBaseUrl, requestEndpoint)
      : config.baseUrl + config.endpoints.chat;
  const chatInstanceId = isGenericChatEndpoint(requestEndpoint) && chatMode !== "agent"
    ? `${conversationId ?? "chat"}:generic:${requestEndpoint}:${isProviderEndpointProfile ? requestEndpointProfile.providerKey : "gateway"}`
    : conversationId;

  const systemPrompt = useMemo(
    () => {
      const fallbackCatalogs = getDefaultCatalogDefinitionsWithActions(
        jsonRenderRegistry.actions,
        "app",
      );
      const catalogListWithBuiltin = mapLegacyDefaultCatalogSelection(defaultCatalogs);

      const stored = createCatalogFromStored(
        jsonRenderCatalog.items,
        catalogListWithBuiltin,
        fallbackCatalogs,
      );

      return stored.prompt();
    },
    [
      defaultCatalogs,
      jsonRenderCatalog.items,
      jsonRenderRegistry.actions,
    ],
  );

  const { spec: tree, send, isStreaming, error: streamError } = useUIStream({
    api: config.baseUrl + "/api/generate",
    catalogPrompt: systemPrompt,
    model: model,
    getAccessToken: getAccessToken,
    customHeaders: apiKeyHeaders
    /*  onComplete: (nextTree: any) => {
        if (selectedConversationId) {
          setJsonRenderTree(selectedConversationId, nextTree);
        }
      },
      onError: (err: Error) => {
        if (selectedConversationId) {
          setJsonRenderError(selectedConversationId, err.message);
        }
      },*/
  });

  const sendUiRequest = async (request: {
    prompt: string;
    catalogIds?: string[];
    // registryIds?: string[];
  }) => {
    const prompt = String(request?.prompt ?? "").trim();
    if (!prompt) {
      throw new Error("Missing prompt.");
    }

    let promptToSend = prompt;
    const storedTree = findLatestLocalJsonRenderTree(uiMessages as any);
    const effectiveTree = tree ?? storedTree;
    const cleanedCatalogIds = Array.isArray(request?.catalogIds)
      ? Array.from(new Set(request.catalogIds.map((v) => String(v ?? "").trim()).filter(Boolean)))
      : undefined;

    const fallbackCatalogs = getDefaultCatalogDefinitionsWithActions(
      jsonRenderRegistry.actions,
      "app",
    );

    const catalogPromptOverride = cleanedCatalogIds?.length
      ? createCatalogFromStored(
        jsonRenderCatalog.items,
        mapLegacyDefaultCatalogSelection(cleanedCatalogIds.join(",")),
        fallbackCatalogs,
      ).prompt()
      : undefined;

    if (effectiveTree?.root && Object.keys(effectiveTree.elements || {}).length > 0) {
      promptToSend = `CURRENT UI STATE (already loaded, DO NOT recreate existing elements):\n${JSON.stringify(effectiveTree, null, 2)}\n\nUSER REQUEST: ${prompt}\n\nIMPORTANT: The current UI is already loaded. Output ONLY the patches needed to make the requested change, one JSON patch per line (JSONL), using RFC 6902 operations:\n- Add a new element: {"op":"add","path":"/elements/new-key","value":{...}}\n- Update existing value: {"op":"replace","path":"/elements/existing-key/props/title","value":"New title"}\n- Update root: {"op":"replace","path":"/root","value":"new-root-key"}\n- Remove: {"op":"remove","path":"/elements/old-key"}\n\nDo not use op \"set\". Use add/replace/remove (and move/copy/test only if truly needed).\nDO NOT output patches for elements that don't need to change. Only output what's necessary for the requested modification.`;
    }

    return await send(promptToSend, activeData ? {
      ...activeData,
      _meta: undefined,
    } : undefined, providerMetadata, effectiveTree ?? null, maxOutputTokens, catalogPromptOverride)
  }

  const { tools } = useTools();
  const toolUse = useOnToolCall({
    api: config.baseUrl,
    getAccessToken,
    conversationId,
    headers,
    customFetch,
    callTool,
    send: sendUiRequest,
    tools,
  });

  const apiRef = useApiRef(api);
  apiRef.current = api;
  const effectiveChatEndpointRef = useRef(requestEndpoint);
  effectiveChatEndpointRef.current = requestEndpoint;
  // Local UI overlay for edits/deletes (since `useChat()` doesn't expose `setMessages`).
  // We also re-use these overrides when building the next request body so deleted parts
  // are NOT sent to the backend on subsequent turns.
  const [uiMessageOverrides, setUiMessageOverrides] = useState<Record<string, UIMessage | null>>({});
  const uiMessageOverridesRef = useRef<Record<string, UIMessage | null>>({});
  useEffect(() => {
    uiMessageOverridesRef.current = uiMessageOverrides;
  }, [uiMessageOverrides]);

  const applyOverrides = useCallback((list: any[]) => {
    const ov = uiMessageOverridesRef.current;
    return (list ?? [])
      .map((m: any) => {
        const x = ov[m?.id];
        return x === undefined ? m : x;
      })
      .filter((m: any) => !!m);
  }, []);
  const getGatewayProviderHeaders = useCallback((body: any) => {
    const getAgentHeaders = (agent: any): Record<string, any> | undefined => {
      const value = agent?.model?.providerHeaders;
      if (value == null || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
      }

      const providerKey = String(agent?.model?.id ?? "")
        .trim()
        .split("/")
        .filter(Boolean)[0]
        ?.toLowerCase();
      const legacyValue = providerKey ? value[providerKey] : undefined;

      return legacyValue != null && typeof legacyValue === "object" && !Array.isArray(legacyValue)
        ? legacyValue
        : value;
    };
    const entries = [
      ...Object.values(body?.providerHeaders ?? {}),
      ...(body?.agents ?? []).flatMap((agent: any) =>
        getAgentHeaders(agent) ? [getAgentHeaders(agent)] : []
      ),
    ];

    return Object.fromEntries(
      entries
        .filter((headers): headers is Record<string, any> =>
          headers != null && typeof headers === "object" && !Array.isArray(headers)
        )
        .flatMap((headers) => Object.entries(headers))
        .filter(([key, value]) => key.trim().length > 0 && value != null && String(value).trim().length > 0)
        .map(([key, value]) => [key, String(value)])
    );
  }, []);
  const hasSourceNamespaces = tools.some((tool: any) => tool?.source?.namespace === true);
  const baseBody = useMemo(() => ({
    ...(chatMode === "chat" ? { model: requestModel ?? "openai/gpt-5.6-luna" } : {}),
    tools: useToolNamespaces || hasSourceNamespaces ? [] : shapeToolsForRequest(tools, toolRequestConfig, false),
    toolRequestConfig,
    useToolNamespaces,
    hasSourceNamespaces,
    ...(selectedAgentRequest.localAgents.length > 0 ? { agents: selectedAgentRequest.localAgents } : {}),
    ...(selectedAgentRequest.models.length > 0 ? { models: selectedAgentRequest.models } : {}),
    ...(chatMode === "agent" ? { workflowType } : {}),
    maxOutputTokens,
    ...(!isGenericChatEndpoint(requestEndpoint) ? { verbosity } : {}),
    toolChoice,
    maxToolCalls,
    providerMetadata,
    providerHeaders,
    ...(isProviderEndpointProfile && providerRequestConfig ? { providerRequestConfig } : {}),
    ...(isProviderEndpointProfile ? { providerRequestConfigProviderKey: requestEndpointProfile.providerKey } : {}),
    ...(isProviderEndpointProfile && endpointProfileProviderHeaders ? { providerRequestHeaders: endpointProfileProviderHeaders } : {}),
    ...(isProviderEndpointProfile ? { omitProviderMetadataInNativeMetadata: true } : {}),
    response_format: location.state?.responseFormat ?? structuredOutputs,
    workflowMetadata: {
      groupchat: { maximumIterationCount },
      handoff: { handoffs },
    },
    temperature: location.state?.temperature ?? temperature,
  }), [
    chatMode,
    requestModel,
    tools,
    toolRequestConfig,
    useToolNamespaces,
    selectedAgentRequest.localAgents,
    selectedAgentRequest.models,
    workflowType,
    maxOutputTokens,
    verbosity,
    toolChoice,
    maxToolCalls,
    location.state?.responseFormat,
    providerMetadata,
    providerHeaders,
    providerRequestConfig,
    endpointProfileProviderHeaders,
    isProviderEndpointProfile,
    requestEndpointProfile,
    structuredOutputs,
    maximumIterationCount,
    handoffs,
    temperature,
    location.state?.temperature,
  ]);

  const transport = useMemo(
    () => {
      const transportOptions = {
        api: "/api/chat", // just a fallback; we override per-request below
        fetch: isGenericChatEndpoint(requestEndpoint) && chatMode !== "agent" ? authFetch : chatFetch,
        prepareSendMessagesRequest: (opts: any) => {
          const patchedMessages = applyOverrides(opts.messages as any);

          const mergedBody: any = {
            ...baseBody,          // default body (includes toolChoice)
            ...(opts.body ?? {}), // per-call overrides
            id: conversationId ?? opts.id,
            messages: patchedMessages,
            trigger: opts.trigger,
            messageId: opts.messageId,
          };
          // `opts.body` can replace the memoized base tools. Decorate at the
          // final transport boundary so `/api/chat` always receives the two
          // request-only properties directly on each tool definition.
          const namespacesEnabled = (mergedBody.useToolNamespaces ?? useToolNamespaces) || hasSourceNamespaces;
          const sourceTools = namespacesEnabled && (!Array.isArray(mergedBody.tools) || mergedBody.tools.length === 0)
            ? tools
            : mergedBody.tools;
          if (namespacesEnabled) {
            const shapedTools = shapeToolsForRequest(
              sourceTools,
              mergedBody.toolRequestConfig ?? toolRequestConfig,
              mergedBody.useToolNamespaces ?? useToolNamespaces,
            );
            const namespaces = shapedTools.filter((tool: any) => tool?.type === "namespace");
            const ordinaryTools = shapedTools.filter((tool: any) => tool?.type !== "namespace");
            const providerKey = String(
              (isProviderEndpointProfile ? requestEndpointProfile.providerKey : undefined)
              ?? model?.split("/")[0]
              ?? Object.keys(mergedBody.providerMetadata ?? {})[0]
              ?? "",
            ).trim().toLowerCase();
            const providerMetadata = { ...(mergedBody.providerMetadata ?? {}) };
            const providerConfig = { ...(providerMetadata[providerKey] ?? {}) };
            const existingTools = Array.isArray(providerConfig.tools) ? providerConfig.tools : [];
            const namespaceNames = new Set(namespaces.map((tool: any) => tool.name));
            providerConfig.tools = [
              ...existingTools.filter((tool: any) => tool?.type !== "namespace" || !namespaceNames.has(tool?.name)),
              ...namespaces,
            ];
            providerMetadata[providerKey] = providerConfig;
            mergedBody.providerMetadata = providerMetadata;
            // Selective plugin/MCP namespaces must not pull ordinary client tools
            // into provider metadata. Those keep using the established request
            // tools path, while only native namespace entries are provider tools.
            mergedBody.tools = ordinaryTools;
          } else {
            mergedBody.tools = shapeToolsForRequest(
              sourceTools,
              mergedBody.toolRequestConfig ?? toolRequestConfig,
              false,
            );
            const providerKey = String(
              (isProviderEndpointProfile ? requestEndpointProfile.providerKey : undefined)
              ?? model?.split("/")[0]
              ?? Object.keys(mergedBody.providerMetadata ?? {})[0]
              ?? "",
            ).trim().toLowerCase();
            if (providerKey === "anthropic") {
              mergedBody.tools = deferClientToolSearchCandidates(mergedBody.tools);
            } else if (providerKey === "openai") {
              // OpenAI uses its native provider-keyed tool_search definition.
              mergedBody.tools = mergedBody.tools.filter((tool: any) => tool?.name !== "client_tool_search");
            }
          }

          if (mergedBody.providerHeaders == null && baseBody.providerHeaders != null) {
            mergedBody.providerHeaders = baseBody.providerHeaders;
          }

          const completedToolCalls =
            typeof maxToolCalls === "number"
              ? countCompletedToolCallsLastAssistant(patchedMessages as any[])
              : 0;

          const forceNone =
            shouldForceToolChoiceNone(patchedMessages as any[], stopTools) ||
            (typeof maxToolCalls === "number" && completedToolCalls >= maxToolCalls);

          const effectiveToolChoice = forceNone ? "none" : mergedBody.toolChoice;
          const requestHeaders = new Headers(opts.headers as HeadersInit | undefined);

          if (chatMode === "agent") {
            Object.entries(headers ?? {}).forEach(([key, value]) => {
              if (value != null) requestHeaders.set(key, String(value));
            });

            Object.entries(getAgentApiKeyHeaders(mergedBody.agents) ?? {}).forEach(([key, value]) => {
              if (value != null) requestHeaders.set(key, String(value));
            });
          }

          if (!isGenericChatEndpoint(effectiveChatEndpointRef.current)) {
            Object.entries(getGatewayProviderHeaders(mergedBody)).forEach(([key, value]) => {
              requestHeaders.set(key, value);
            });
          }

          const requestApi = apiRef.current;
          const requestEndpoint = effectiveChatEndpointRef.current;
          const requestBody = isGenericChatEndpoint(requestEndpoint) && chatMode !== "agent"
            ? buildGenericChatEndpointBody(requestEndpoint, {
              ...mergedBody,
              toolChoice: effectiveToolChoice,
            })
            : {
              ...mergedBody,
              toolChoice: effectiveToolChoice,
            };

          if (isGenericChatEndpoint(requestEndpoint) && chatMode !== "agent") {
            requestHeaders.delete("Content-Type");
            requestHeaders.set("Accept", "text/event-stream");
          }

          return {
            headers: requestHeaders,
            credentials: opts.credentials,
            body: requestBody,
            api: requestApi,
          };
        },
      };

      return isGenericChatEndpoint(requestEndpoint) && chatMode !== "agent"
        ? new GenericChatEndpointTransport(
          requestEndpoint,
          isProviderEndpointProfile ? requestEndpointProfile.providerKey : undefined,
          providers,
          transportOptions,
        )
        : new DefaultChatTransport(transportOptions);
    },
    [chatFetch, applyOverrides, baseBody, chatMode, headers, getAgentApiKeyHeaders, getGatewayProviderHeaders, maxToolCalls, stopTools, requestEndpoint, api]
  );

  const {
    messages,
    sendMessage,
    status,
    addToolOutput,
    stop,
    addToolApprovalResponse,
  } = useChat({
    id: chatInstanceId,
    transport,
    experimental_throttle: experimentalThrottle,
    onError: addChatError,

    onToolCall: async ({ toolCall }) => {
      const result = await (toolUse.onToolCall as any)({
        toolCall,
        signal: abortRef.current?.signal
      });

      addToolOutput({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: result,
      });

      return result;
    },
    sendAutomaticallyWhen,
    messages: seededMessages,
    onFinish: async ({ message, isDisconnect, isAbort }) => {
      if (!isAbort) {
        if (message.role === "assistant")
          // await addMessage(conversationId!, message as UIMessage);
          try {
            await updateMessage(
              conversationId!,
              message?.id,
              message as UIMessage
            );
          } catch (e) {
            try {
              await addMessage(conversationId!, message as UIMessage);
            } catch (persistErr) {
              addChatError(getStorageErrorMessage(persistErr, "Failed to save the assistant response"));
            }
          }
      }
    },
  });

  const uiMessages = useMemo(() => {
    return (messages ?? [])
      .map((m) => {
        const ov = uiMessageOverrides[m.id];
        return ov === undefined ? (m as any as UIMessage) : ov;
      })
      .filter((m): m is UIMessage => !!m);
  }, [messages, uiMessageOverrides]);

  const conversationCost = useMemo(
    () => conversationGatewayCostTotal(uiMessages),
    [uiMessages],
  );

  const effectiveUiTree = useMemo(() => {
    if (tree) return tree;
    const last = (uiMessages ?? [])
      .flatMap((m: any) => (m?.parts ?? []) as any[])
      .filter((p: any) => (p?.type ?? "").startsWith("tool-"))
      .reverse()
      .find((p: any) => {
        const name = p.toolName ?? String(p.type ?? "").replace(/^tool-/, "");
        return name === "local_json_render";
      });
    return last ? findLatestLocalJsonRenderTree(uiMessages as any) : null;
  }, [tree, uiMessages]);

  const { abortRef, startRun, cancelRun } = useAbortRun(stop);
  const getAttachmentParts = useAttachmentParts();

  const lastPart =
    messages.at(-1)?.role === "assistant"
      ? messages.at(-1)?.parts?.at(-1)?.type?.startsWith("tool-") &&
        typeof messages.at(-1)?.parts?.at(-1)?.state === "string" &&
        messages.at(-1)?.parts?.at(-1)?.state.startsWith("input-")
        ? messages.at(-1)!.parts!.at(-1)
        : undefined
      : undefined;

  const totalTokens = [...messages]
    .reverse()
    .find(m => m.role === "assistant" && (m.metadata?.usage?.totalTokens ?? m.metadata?.totalTokens) != null)
    ?.metadata;
  const latestTotalTokens = totalTokens?.usage?.totalTokens ?? totalTokens?.totalTokens;

  usePendingMessageAutoSend({
    conversationId,
    locationState: location.state,
    messages,
    addMessage,
    sendMessage,
    startRun,
    navigate,
    rename,
    getConversation: get,
    conversationName: createConversationName,
    body: {
      ...(chatMode === "chat" ? { model: requestModel ?? "openai/gpt-5.6-luna" } : {}),
      tools,
      maxOutputTokens,
      ...(!isGenericChatEndpoint(requestEndpoint) ? { verbosity } : {}),
      toolChoice,
      maxToolCalls,
      ...(selectedAgentRequest.localAgents.length > 0 ? { agents: selectedAgentRequest.localAgents } : {}),
      ...(selectedAgentRequest.models.length > 0 ? { models: selectedAgentRequest.models } : {}),
      ...(chatMode === "agent" ? { workflowType } : {}),
      providerMetadata,
      providerHeaders,
      ...(isProviderEndpointProfile && providerRequestConfig ? { providerRequestConfig } : {}),
      ...(isProviderEndpointProfile ? { providerRequestConfigProviderKey: requestEndpointProfile.providerKey } : {}),
      ...(isProviderEndpointProfile && endpointProfileProviderHeaders ? { providerRequestHeaders: endpointProfileProviderHeaders } : {}),
      ...(isProviderEndpointProfile ? { omitProviderMetadataInNativeMetadata: true } : {}),
      response_format: location.state?.responseFormat ?? structuredOutputs,
      workflowMetadata: {
        groupchat: { maximumIterationCount },
        handoff: { handoffs },
      },
      temperature: location.state?.temperature ?? temperature,
    },
    files,
  });

  const { onPromptExecute, handleSend } = useChatActions({
    getAttachmentParts,
    addMessage,
    sendMessage,
    temperature,
    selectedModel: model,
    conversationId,
    finalTools: tools,
    rename,
  });

  const toolName = lastPart ?
    (tools.find(a => a.name == getToolName(lastPart?.type))?.annotations?.title
      ?? getToolName(lastPart?.type))
    : undefined;

  const drawerSize = isDesktop ? "medium" : "small"
  const { toast, closeToast, addAttachmentToFiles } = useAttachmentsToaster();






  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        flex: 1,
        overflow: "hidden",
        minHeight: 0, // important for flex scroll containers!
      }}
    >
      <Toast
        id={toast.id}
        variant={toast.variant}
        message={toast.message}
        show={toast.show}
        autohide={toast.autohide}
        onClose={closeToast}
      />
      <div
        data-chat-resize-scope
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          flex: 1,
          width: "100%",
          border: isOver ? "2px dotted" : undefined,
          borderColor: isOver ? "#888" : "transparent",
        }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ChatErrors />

        {debugMode ? <JsonViewer value={JSON.stringify(uiMessages)} />
          : <MessageList
            // NOTE: `useChat()` doesn't expose `setMessages` in this codebase,
            // so we keep a local overlay for edits/deletes.
            messages={uiMessages}
            streaming={status === "submitted" || status === "streaming"}
            sendMessage={async (msg: any) => {
              startRun()
              await handleSend(msg.prompt)
            }}
            showAttachments={setMessageAttachments}
            showCitations={setSources}
            showActivity={setMessageActivity}
            conversationId={conversationId}
            onUiMessagePatched={(uiMessageId, next) => {
              setUiMessageOverrides((prev) => ({
                ...prev,
                [uiMessageId]: (next as any as UIMessage) ?? null,
              }));
            }}
          />}

        {status === "submitted" || status === "streaming" || lastPart ? (
          <div style={streamingIndicatorStyles}>
            <Spinner
              label={toolName}
            />
          </div>
        ) : undefined}
        <div style={{ paddingRight: 24, paddingLeft: 16, paddingTop: 8, boxSizing: "border-box" }}>
          <MessageInput
            resizeResetKey={conversationId}
            onSend={async (msg) => {
              startRun()
              await handleSend(msg)
            }}
            onStop={cancelRun}
            tokenUsage={latestTotalTokens}
            conversationCost={conversationCost}
            temperature={temperature}
            temperatureChanged={temperatureChanged}
            onPromptExecute={onPromptExecute}
            disabled={status === "submitted" || status === "streaming"}
            streaming={status === "submitted" || status === "streaming"}
          />
        </div>
      </div>

      <MessageSourcesDrawer
        open={sources != undefined}
        sources={sources?.filter(a => a.type == "source-url") ?? []}
        size={drawerSize}
        onClose={() => setSources(undefined)} />

      <ToolDrawer open={usedTools != undefined}
        tools={usedTools ?? []}
        onClose={() => setUsedTool(undefined)} />

      <AttachmentsDrawer
        open={messageAttachments != undefined}
        size={drawerSize}
        attachments={messageAttachments ?? []}
        onAddToFiles={addAttachmentToFiles}
        onClose={() => setMessageAttachments(undefined)} />

      <ActivityDrawer messages={uiMessages} uiTree={effectiveUiTree} uiOutput={activeData} currentModel={model} />

      <MessageActivityDrawer open={messageActivity != undefined}
        content={messageActivity ?? []}
        onShowToolCallResult={(a) => setShowToolCall(a)}
        onClose={() => setMessageActivity(undefined)} />

      <ToolCallResultModal
        open={showToolCall != undefined}
        result={showToolCall?.output}
        onClose={() => setShowToolCall(undefined)}
      />

      <ToolApprovalModalHost
        messages={uiMessages}
        tools={tools}
        status={status}
        addToolApprovalResponse={addToolApprovalResponse}

      />

      <ElicitationModalHost />
    </div>
  );
}

const streamingIndicatorStyles = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  padding: "8px 0 0",
} as const;
