import { useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useDarkMode } from "usehooks-ts";
import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { MessageList } from "../chat/messages/MessageList";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import {
  getPlaygroundClient,
  invokePlayground,
  preparePlaygroundRequest,
  type PlaygroundAttachment,
  type PlaygroundEndpointConfigMap,
  type PlaygroundClientId,
  playgroundClientOptions,
  playgroundEndpointOptions,
} from "aihappey-clients";
import { DefaultChatTransport, useChat, type UIMessage } from "aihappey-ai";
import {
  createPlaygroundFetch,
  toPlaygroundApiChatMessages,
  createPlaygroundUiMessage,
  replaceLastPlaygroundAssistantMessage,
  resolvePlaygroundUrl,
  streamPlaygroundResponse,
  stringifyPlaygroundPreview,
  toPlaygroundPayloadMessages,
} from "./playgroundChat";
import { PlaygroundInput } from "./PlaygroundInput";
import { PlaygroundSettingsDrawer } from "./PlaygroundSettingsDrawer";
import { encodePlaygroundAttachment, getPlaygroundUnsupportedAttachmentKinds } from "./playgroundAttachments";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import {
  createChatAuthHeadersForModel,
  createProviderBearerHeadersForProviderKey,
} from "../provider-credentials/providerAuthHeaders";
import {
  resolveEndpointProfileProviderConfig,
  resolveEndpointProfileRequestMetadata,
  resolveProviderEndpointProfileForModel,
  splitEndpointProfileProviderConfig,
  stripProviderPrefix,
} from "../chat/engine/endpointProfiles";

export const PlaygroundPage = () => {
  const { isDarkMode } = useDarkMode();
  const { config } = useChatContext();
  const { Button, Select, Switch } = useTheme();
  const isDesktop = useIsDesktop();
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const maxOutputTokensFromStore = useAppStore((s) => s.maxOutputTokens);
  const temperatureFromStore = useAppStore((s) => s.temperature);
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const setThrottle = useAppStore((s) => s.setThrottle);

  const [selectedEndpoint, setSelectedEndpoint] = useState("/v1/responses");
  const [selectedClient, setSelectedClient] = useState<PlaygroundClientId>("openai");
  const [playgroundModel, setPlaygroundModel] = useState(selectedModel ?? "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");
  const [temperature, setTemperature] = useState<number>(temperatureFromStore ?? 0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number | undefined>(maxOutputTokensFromStore ?? undefined);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PlaygroundAttachment[]>([]);
  const [attachmentEncoding, setAttachmentEncoding] = useState(false);
  const [providerMetadata, setProviderMetadata] = useState<any>({ openai: {} });
  const [endpointConfigByEndpoint, setEndpointConfigByEndpoint] = useState<PlaygroundEndpointConfigMap>({
    "/api/chat": {},
    "/v1/chat/completions": {},
    "/v1/responses": {},
    "/v1/messages": {}
  });
  const [rawResponse, setRawResponse] = useState<any>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerSize, setDrawerSize] = useState<"medium" | "large" | "full">("medium");
  const [playgroundChatRevision, setPlaygroundChatRevision] = useState(0);
  const [needsVercelRehydrate, setNeedsVercelRehydrate] = useState(false);

  const availableClientsForEndpoint = useMemo(
    () => Array.from(new Set(
      playgroundClientOptions
        .filter((option) => option.endpoint === selectedEndpoint)
        .map((option) => option.client),
    )),
    [selectedEndpoint],
  );

  const availableClientItems = useMemo(
    () => availableClientsForEndpoint.map((clientId) => ({
      value: clientId,
      label: getPlaygroundClient(clientId as any)?.label ?? clientId,
    })),
    [availableClientsForEndpoint],
  );

  const activeOption = useMemo(() => {
    return playgroundClientOptions.find(
      (option) => option.endpoint === selectedEndpoint && option.client === selectedClient,
    ) ?? playgroundClientOptions.find((option) => option.endpoint === selectedEndpoint)
      ?? playgroundClientOptions[0];
  }, [selectedClient, selectedEndpoint]);

  const providerKey = useMemo(
    () => playgroundModel?.split("/")?.[0]?.toLowerCase() ?? "",
    [playgroundModel],
  );
  const providerScopedMetadata = useMemo(
    () => providerKey && providerMetadata?.[providerKey] !== undefined
      ? { [providerKey]: providerMetadata[providerKey] }
      : undefined,
    [providerKey, providerMetadata],
  );
  const playgroundEndpointProfile = useMemo(
    () => resolveProviderEndpointProfileForModel({
      modelId: playgroundModel,
      endpoint: selectedEndpoint,
    }),
    [playgroundModel, selectedEndpoint],
  );
  const isProviderBackedPlaygroundRequest = playgroundEndpointProfile?.kind === "provider";
  const playgroundRequestModel = isProviderBackedPlaygroundRequest
    ? stripProviderPrefix(playgroundModel, playgroundEndpointProfile?.providerKey)
    : playgroundModel;
  const playgroundBaseUrl = isProviderBackedPlaygroundRequest
    ? playgroundEndpointProfile?.apiBaseUrl ?? baseUrl
    : baseUrl;
  const resolvedProviderMetadata = useMemo(
    () => resolveEndpointProfileRequestMetadata({
      activeProviderMetadata: providerScopedMetadata,
      endpointProfile: playgroundEndpointProfile,
      fallbackProviderMetadataEnabled: true,
    }),
    [playgroundEndpointProfile, providerScopedMetadata],
  );
  const playgroundEndpointProfileProviderConfig = useMemo(
    () => resolveEndpointProfileProviderConfig({
      activeProviderMetadata: providerScopedMetadata,
      providerMetadata,
      endpointProfile: playgroundEndpointProfile,
    }),
    [playgroundEndpointProfile, providerMetadata, providerScopedMetadata],
  );
  const {
    body: playgroundProviderRequestConfig,
    headers: playgroundProviderRequestHeaders,
  } = useMemo(
    () => splitEndpointProfileProviderConfig(playgroundEndpointProfileProviderConfig, playgroundEndpointProfile?.providerKey, selectedEndpoint),
    [playgroundEndpointProfileProviderConfig, playgroundEndpointProfile, selectedEndpoint],
  );

  const selectedModelOption = useMemo(
    () => models?.find((model) => model.id === playgroundModel),
    [models, playgroundModel],
  );

  const effectiveHeaders = useMemo(() => {
    if (isProviderBackedPlaygroundRequest) {
      return {
        ...createProviderBearerHeadersForProviderKey(customHeaders, providerKey),
        ...(playgroundProviderRequestHeaders ?? {}),
      };
    }

    return createChatAuthHeadersForModel(customHeaders, playgroundModel, Boolean(config?.getAccessToken));
  }, [config?.getAccessToken, customHeaders, isProviderBackedPlaygroundRequest, playgroundModel, playgroundProviderRequestHeaders, providerKey]);

  const currentEndpointConfig = useMemo(
    () => endpointConfigByEndpoint[selectedEndpoint as keyof PlaygroundEndpointConfigMap] ?? {},
    [endpointConfigByEndpoint, selectedEndpoint],
  );

  const usesVercelApiChat = activeOption?.id === "vercel-api-chat";
  const supportsStreaming = currentEndpointConfig && typeof currentEndpointConfig === "object"
    ? Boolean((currentEndpointConfig as any).stream)
    : false;

  const playgroundFetch = useMemo(
    () => createPlaygroundFetch({
      headers: effectiveHeaders,
      getAccessToken: isProviderBackedPlaygroundRequest ? undefined : config?.getAccessToken,
    }),
    [config?.getAccessToken, effectiveHeaders, isProviderBackedPlaygroundRequest],
  );

  const playgroundTransport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/chat",
      fetch: playgroundFetch,
      prepareSendMessagesRequest: (opts) => ({
        api: resolvePlaygroundUrl(baseUrl, "/api/chat"),
        headers: opts.headers,
        credentials: opts.credentials,
        body: {
          ...(opts.body ?? {}),
          id: opts.id,
          messageId: opts.messageId,
          messages: toPlaygroundApiChatMessages(opts.messages as UIMessage[]),
          trigger: opts.trigger,
          model: playgroundRequestModel,
          temperature,
          maxOutputTokens,
          providerMetadata: resolvedProviderMetadata,
        },
      }),
    }),
    [baseUrl, maxOutputTokens, playgroundFetch, playgroundRequestModel, resolvedProviderMetadata, temperature],
  );

  const {
    messages: vercelMessages,
    sendMessage,
    status: vercelStatus,
    error: vercelError,
  } = useChat({
    id: `playground-${playgroundChatRevision}`,
    transport: playgroundTransport,
    experimental_throttle: experimentalThrottle,
    messages,
  });

  useEffect(() => {
    if (!usesVercelApiChat) return;
    if (!vercelError) return;
    setError(vercelError.message || "Playground request failed.");
  }, [usesVercelApiChat, vercelError]);

  useEffect(() => {
    if (!usesVercelApiChat) return;
    setError(undefined);
  }, [usesVercelApiChat, vercelMessages.length]);

  useEffect(() => {
    if (usesVercelApiChat) {
      setRawResponse(undefined);
    }
  }, [usesVercelApiChat, vercelMessages.length]);

  useEffect(() => {
    if (!usesVercelApiChat) return;
    if (needsVercelRehydrate) return;
    setMessages(vercelMessages as UIMessage[]);
  }, [needsVercelRehydrate, usesVercelApiChat, vercelMessages]);

  useEffect(() => {
    if (!usesVercelApiChat) return;
    setNeedsVercelRehydrate(true);
  }, [usesVercelApiChat]);

  useEffect(() => {
    if (!usesVercelApiChat || !needsVercelRehydrate) return;
    setPlaygroundChatRevision((current) => current + 1);
    setNeedsVercelRehydrate(false);
  }, [needsVercelRehydrate, usesVercelApiChat]);

  useEffect(() => {
    let cancelled = false;

    if (!pendingFiles.length) {
      setPendingAttachments([]);
      setAttachmentEncoding(false);
      return;
    }

    setAttachmentEncoding(true);
    void Promise.all(pendingFiles.map((file) => encodePlaygroundAttachment(file)))
      .then((attachments) => {
        if (cancelled) return;
        setPendingAttachments(attachments);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message ?? "Failed to read one or more attachments.");
      })
      .finally(() => {
        if (cancelled) return;
        setAttachmentEncoding(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingFiles]);

  const addPendingFiles = (files: File[]) => {
    if (!files.length) return;
    setError(undefined);
    setPendingFiles((current) => [...current, ...files]);
  };

  const removePendingFile = (name: string) => {
    setPendingFiles((current) => current.filter((file) => file.name !== name));
  };

  const { isOver, dropRef: pageDrop, handleDrop, handleDragOver } = useChatFileDrop(
    (file) => addPendingFiles([file]),
    addPendingFiles,
  );

  const previewMessages = useMemo(
    () => draft.trim() || pendingAttachments.length > 0
      ? [...messages, createPlaygroundUiMessage("user", draft.trim(), pendingAttachments)]
      : messages,
    [draft, messages, pendingAttachments],
  );

  const preparedPreview = useMemo(() => {
    if (!activeOption?.id || !playgroundBaseUrl.trim() || !playgroundModel) return undefined;

    try {
      return preparePlaygroundRequest({
        optionId: activeOption.id,
        baseUrl: playgroundBaseUrl,
        model: playgroundRequestModel,
        messages: toPlaygroundPayloadMessages(previewMessages, systemPrompt),
        temperature,
        maxOutputTokens,
        providerMetadata: resolvedProviderMetadata,
        providerRequestConfig: playgroundProviderRequestConfig,
        omitProviderMetadataInNativeMetadata: isProviderBackedPlaygroundRequest,
        endpointConfig: currentEndpointConfig,
        headers: effectiveHeaders,
        getAccessToken: isProviderBackedPlaygroundRequest ? undefined : config?.getAccessToken,
      });
    } catch {
      return undefined;
    }
  }, [
    activeOption?.id,
    playgroundBaseUrl,
    config?.getAccessToken,
    currentEndpointConfig,
    effectiveHeaders,
    isProviderBackedPlaygroundRequest,
    maxOutputTokens,
    playgroundRequestModel,
    playgroundProviderRequestConfig,
    previewMessages,
    resolvedProviderMetadata,
    systemPrompt,
    temperature,
  ]);

  const requestPreviewHeaders = useMemo(
    () => stringifyPlaygroundPreview({
      ...effectiveHeaders,
      "Content-Type": "application/json",
      ...(supportsStreaming ? { Accept: "text/event-stream" } : {}),
    }),
    [effectiveHeaders, supportsStreaming],
  );

  const requestPreviewBody = useMemo(
    () => stringifyPlaygroundPreview(preparedPreview?.prepared.body),
    [preparedPreview],
  );

  const displayMessages = messages;
  const isStreaming = usesVercelApiChat
    ? vercelStatus === "submitted" || vercelStatus === "streaming"
    : sending;

  const canSend = !!playgroundModel
    && !!playgroundBaseUrl.trim()
    && (!!draft.trim() || pendingFiles.length > 0)
    && !isStreaming
    && !attachmentEncoding;

  const canAttach = !isStreaming && !attachmentEncoding;

  const sidebarHeaderNavigation = isDesktop ? (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Button
        icon="panelExpand"
        variant="transparent"
        disabled={drawerSize === "full"}
        onClick={() =>
          setDrawerSize((current) => (current === "medium" ? "large" : "full"))
        }
      />
      <Button
        icon="panelContract"
        variant="transparent"
        disabled={drawerSize === "medium"}
        onClick={() =>
          setDrawerSize((current) => (current === "full" ? "large" : "medium"))
        }
      />
    </div>
  ) : undefined;

  const handleSend = async () => {
    if (!canSend) return;

    const trimmedDraft = draft.trim();
    const unsupportedKinds = getPlaygroundUnsupportedAttachmentKinds(selectedEndpoint as any, pendingAttachments);
    if (unsupportedKinds.length > 0) {
      setError(`Attachments of type ${unsupportedKinds.join(", ")} are not implemented for ${selectedEndpoint} yet.`);
      return;
    }

    if (!trimmedDraft && pendingAttachments.length === 0) return;

    const currentDraft = draft;
    const currentFiles = pendingFiles;
    const currentAttachments = pendingAttachments;

    setDraft("");
    setError(undefined);
    setPendingFiles([]);
    setPendingAttachments([]);

    if (usesVercelApiChat) {
      setRawResponse(undefined);

      try {
        await sendMessage(createPlaygroundUiMessage("user", trimmedDraft, currentAttachments) as any, {
          body: {
            model: playgroundRequestModel,
            temperature,
            maxOutputTokens,
            systemPrompt,
            providerMetadata: resolvedProviderMetadata,
          },
        });
      } catch (err: any) {
        setDraft(currentDraft);
        setPendingFiles(currentFiles);
        setPendingAttachments(currentAttachments);
        setError(err?.message ?? "Playground request failed.");
      }

      return;
    }

    const nextMessages = [...messages, createPlaygroundUiMessage("user", trimmedDraft, currentAttachments)];
    setMessages(nextMessages);
    setNeedsVercelRehydrate(true);
    setSending(true);

    try {
      const invocation = preparePlaygroundRequest({
        optionId: activeOption.id,
        baseUrl: playgroundBaseUrl,
        model: playgroundRequestModel,
        messages: toPlaygroundPayloadMessages(nextMessages, systemPrompt),
        temperature,
        maxOutputTokens,
        providerMetadata: resolvedProviderMetadata,
        providerRequestConfig: playgroundProviderRequestConfig,
        omitProviderMetadataInNativeMetadata: isProviderBackedPlaygroundRequest,
        endpointConfig: currentEndpointConfig,
        headers: effectiveHeaders,
        getAccessToken: isProviderBackedPlaygroundRequest ? undefined : config?.getAccessToken,
      });

      if (supportsStreaming && activeOption.id !== "vercel-api-chat") {
        const streamed = await streamPlaygroundResponse({
          invocation,
          fetcher: playgroundFetch ?? fetch,
          onText: (text) => {
            setMessages((current) => replaceLastPlaygroundAssistantMessage(current, text));
          },
        });

        setRawResponse(streamed.raw);
        if (streamed.text) {
          setMessages((current) => replaceLastPlaygroundAssistantMessage(current, streamed.text));
        }
        return;
      }

      const result = await invokePlayground({
        optionId: activeOption.id,
        baseUrl: playgroundBaseUrl,
        model: playgroundRequestModel,
        messages: invocation.request.messages,
        temperature,
        maxOutputTokens,
        providerMetadata: resolvedProviderMetadata,
        providerRequestConfig: playgroundProviderRequestConfig,
        omitProviderMetadataInNativeMetadata: isProviderBackedPlaygroundRequest,
        endpointConfig: currentEndpointConfig,
        headers: effectiveHeaders,
        getAccessToken: isProviderBackedPlaygroundRequest ? undefined : config?.getAccessToken,
      });

      setRawResponse(result.raw);
      setMessages((current) => [...current, createPlaygroundUiMessage("assistant", result.text || "")]);
    } catch (err: any) {
      setDraft(currentDraft);
      setPendingFiles(currentFiles);
      setPendingAttachments(currentAttachments);
      setError(err?.message ?? "Playground request failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      ref={(node) => {
        if (node) pageDrop(node);
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        border: isOver ? "1px dashed #5b5fc7" : undefined,
        borderRadius: isOver ? 8 : undefined,
        backgroundColor: isOver ? "rgba(91, 95, 199, 0.06)" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: isDarkMode ? "#292929" : "#ffffff",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0px 12px",
          }}
        >
          <ModelSelect
            models={models ?? []}
            modelTypes={["language"]}
            value={playgroundModel}
            onChange={setPlaygroundModel}
          />

          <Select
            label=""
            size="large"
            icon="endpoint"
            values={[selectedEndpoint]}
            valueTitle={selectedEndpoint}
            options={playgroundEndpointOptions.map((value) => ({ value, label: value }))}
            onChange={(value: string) => {
              const nextEndpoint = String(value ?? playgroundEndpointOptions[0] ?? "");
              setSelectedEndpoint(nextEndpoint);
              const allowedClients = playgroundClientOptions
                .filter((option) => option.endpoint === nextEndpoint)
                .map((option) => option.client);
              if (!allowedClients.includes(selectedClient)) {
                setSelectedClient(allowedClients[0] ?? selectedClient);
              }
            }}
          >
            {playgroundEndpointOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </Select>

          <Select
            label=""
            size="large"
            icon="client"
            values={[selectedClient]}
            valueTitle={availableClientItems.find((item) => item.value === selectedClient)?.label ?? selectedClient}
            options={availableClientItems}
            onChange={(value: string) => setSelectedClient(String(value ?? availableClientsForEndpoint[0] ?? selectedClient) as any)}
          >
            {availableClientItems.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>

          <div style={{ flex: 1 }} />

          <Switch
            onChange={() => setSidebarOpen((current) => !current)}
            id="playground-sidebar-toggle"
            checked={sidebarOpen}
          />
        </div>

        <div
          style={{
            padding: 16,
            display: "flex",
            minHeight: 0,
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 0,
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  minHeight: 0,
                }}
              >
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                  <MessageList
                    messages={displayMessages}
                    streaming={isStreaming}
                    showCitations={() => undefined}
                    showActivity={() => undefined}
                    showAttachments={() => undefined}
                  />
                </div>
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <PlaygroundInput
                value={draft}
                onChange={setDraft}
                onSend={() => void handleSend()}
                sendDisabled={!canSend}
                attachmentsDisabled={!canAttach}
                streaming={isStreaming}
                error={error}
                attachments={pendingFiles}
                onAddAttachments={addPendingFiles}
                onRemoveAttachment={removePendingFile}
              />
            </div>
          </div>

          {sidebarOpen ? (
            <PlaygroundSettingsDrawer
              open={sidebarOpen}
              isDesktop={isDesktop}
              drawerSize={drawerSize}
              headerNavigation={sidebarHeaderNavigation}
              onClose={() => setSidebarOpen(false)}
              baseUrl={playgroundBaseUrl}
              setBaseUrl={setBaseUrl}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              temperature={temperature}
              setTemperature={setTemperature}
              maxOutputTokens={maxOutputTokens}
              setMaxOutputTokens={setMaxOutputTokens}
              experimentalThrottle={experimentalThrottle ?? 100}
              setExperimentalThrottle={setThrottle}
              selectedEndpoint={selectedEndpoint}
              currentEndpointConfig={currentEndpointConfig}
              setEndpointConfigByEndpoint={setEndpointConfigByEndpoint}
              selectedModelOption={selectedModelOption}
              playgroundModel={playgroundModel}
              providerKey={providerKey}
              providerMetadata={providerMetadata}
              setProviderMetadata={setProviderMetadata}
              appTitle={config?.appName}
              rawResponse={rawResponse}
              requestPreviewHeaders={requestPreviewHeaders}
              requestPreviewBody={requestPreviewBody}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
