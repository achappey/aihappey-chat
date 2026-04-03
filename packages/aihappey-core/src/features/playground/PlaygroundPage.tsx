import { useEffect, useMemo, useState } from "react";
import {
  AiChatSettingsForm,
  AnthropicChatConfigForm,
  CohereChatConfigForm,
  GroqChatConfigForm,
  JinaChatConfigForm,
  MistralChatConfigForm,
  OpenAIChatConfigForm,
  PerplexityChatConfigForm,
  PollinationsChatConfigForm,
  SambanovaChatConfigForm,
  TogetherChatConfigForm,
  useTheme,
  XAIChatConfigForm,
} from "aihappey-components";
import { useDarkMode } from "usehooks-ts";
import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { MessageList } from "../chat/messages/MessageList";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import {
  invokePlayground,
  playgroundClientChoices,
  playgroundClientOptions,
  playgroundEndpointOptions,
} from "aihappey-clients";
import { DefaultChatTransport, useChat, type UIMessage } from "aihappey-ai";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";
import {
  createPlaygroundFetch,
  createPlaygroundSystemMessage,
  createPlaygroundUiMessage,
  resolvePlaygroundUrl,
  toPlaygroundPayloadMessages,
} from "./playgroundChat";
import { PlaygroundInput } from "./PlaygroundInput";

export const PlaygroundPage = () => {
  const { isDarkMode } = useDarkMode();
  const { config } = useChatContext();
  const { Button, Card, Drawer, Select, Switch, Text, Input, TextArea } = useTheme();
  const isDesktop = useIsDesktop();
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const maxOutputTokensFromStore = useAppStore((s) => s.maxOutputTokens);
  const temperatureFromStore = useAppStore((s) => s.temperature);

  const [selectedEndpoint, setSelectedEndpoint] = useState(playgroundEndpointOptions[0] ?? "/api/chat");
  const [selectedClient, setSelectedClient] = useState(playgroundClientChoices[0] ?? "vercel-ai-sdk");
  const [playgroundModel, setPlaygroundModel] = useState(selectedModel ?? "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");
  const [temperature, setTemperature] = useState<number>(temperatureFromStore ?? 0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState<number | undefined>(maxOutputTokensFromStore ?? undefined);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [manualMessages, setManualMessages] = useState<UIMessage[]>([]);
  const [providerMetadata, setProviderMetadata] = useState<any>({ openai: {} });
  const [rawResponse, setRawResponse] = useState<any>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerSize, setDrawerSize] = useState<"medium" | "large" | "full">("medium");
  const [playgroundChatId, setPlaygroundChatId] = useState(() => `playground-${Date.now()}`);

  const availableClientsForEndpoint = useMemo(
    () => Array.from(new Set(playgroundClientOptions
      .filter((option) => option.endpoint === selectedEndpoint)
      .map((option) => option.client))),
    [selectedEndpoint],
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

  const effectiveHeaders = useMemo(() => {
    if (!providerKey) return customHeaders ?? {};
    return Object.fromEntries(
      Object.entries(customHeaders ?? {}).filter(([key]) =>
        key.toLowerCase().includes(providerKey),
      ),
    );
  }, [customHeaders, providerKey]);

  const aiSettings = useMemo(
    () => ({
      temperature,
      maxOutputTokens,
    }),
    [maxOutputTokens, temperature],
  );

  const usesVercelApiChat = activeOption?.id === "vercel-api-chat";

  const playgroundFetch = useMemo(
    () => createPlaygroundFetch({
      headers: effectiveHeaders,
      getAccessToken: config?.getAccessToken,
    }),
    [config?.getAccessToken, effectiveHeaders],
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
          messages: opts.messages,
          trigger: opts.trigger,
          model: playgroundModel,
          temperature,
          maxOutputTokens,
          providerMetadata,
        },
      }),
    }),
    [baseUrl, maxOutputTokens, playgroundFetch, playgroundModel, providerMetadata, temperature],
  );

  const vercelSeedMessages = useMemo(() => {
    const systemMessage = createPlaygroundSystemMessage(systemPrompt);
    return systemMessage ? [systemMessage] : [];
  }, [systemPrompt]);

  const {
    messages: vercelMessages,
    sendMessage,
    status: vercelStatus,
    error: vercelError,
  } = useChat({
    id: playgroundChatId,
    transport: playgroundTransport,
    messages: vercelSeedMessages,
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
    setPlaygroundChatId(`playground-${Date.now()}`);
    setError(undefined);
    setRawResponse(undefined);
  }, [usesVercelApiChat, baseUrl, playgroundModel, selectedEndpoint, selectedClient, systemPrompt]);

  const displayMessages = usesVercelApiChat ? (vercelMessages as UIMessage[]) : manualMessages;
  const isStreaming = usesVercelApiChat
    ? vercelStatus === "submitted" || vercelStatus === "streaming"
    : sending;

  const currentProviderForm = useMemo(() => {
    const updateProviderConfig = (next: any) =>
      setProviderMetadata((current: any) => ({
        ...current,
        [providerKey]: next,
      }));

    switch (providerKey) {
      case "anthropic":
        return <AnthropicChatConfigForm config={providerMetadata.anthropic ?? {}} updateConfig={updateProviderConfig} />;
      case "cohere":
        return <CohereChatConfigForm config={providerMetadata.cohere ?? {}} updateConfig={updateProviderConfig} />;
      case "google":
        return <GoogleChatConfig google={providerMetadata.google ?? {}} updateGoogle={updateProviderConfig} />;
      case "groq":
        return <GroqChatConfigForm config={providerMetadata.groq ?? {}} updateConfig={updateProviderConfig} />;
      case "jina":
        return <JinaChatConfigForm config={providerMetadata.jina ?? {}} updateConfig={updateProviderConfig} />;
      case "mistral":
        return <MistralChatConfigForm config={providerMetadata.mistral ?? {}} updateConfig={updateProviderConfig} />;
      case "openai":
        return <OpenAIChatConfigForm config={providerMetadata.openai ?? {}} updateConfig={updateProviderConfig} />;
      case "perplexity":
        return <PerplexityChatConfigForm config={providerMetadata.perplexity ?? {}} updateConfig={updateProviderConfig} />;
      case "pollinations":
        return <PollinationsChatConfigForm config={providerMetadata.pollinations ?? {}} updateConfig={updateProviderConfig} />;
      case "sambanova":
        return <SambanovaChatConfigForm config={providerMetadata.sambanova ?? {}} updateConfig={updateProviderConfig} />;
      case "together":
        return <TogetherChatConfigForm config={providerMetadata.together ?? {}} updateConfig={updateProviderConfig} />;
      case "xai":
        return <XAIChatConfigForm config={providerMetadata.xai ?? {}} updateConfig={updateProviderConfig} />;
      default:
        return (
          <Text>
            No provider-specific playground form is available for <b>{providerKey || "this model"}</b> yet.
          </Text>
        );
    }
  }, [providerKey, providerMetadata, Text]);

  const canSend = !!playgroundModel && !!baseUrl.trim() && !!draft.trim() && !isStreaming;

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

  const settingsContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Input
        label="Base URL"
        disabled
        value={baseUrl}
        onChange={(a) => setBaseUrl(a.target.value)}
      />
      <TextArea
        label="System prompt"
        rows={4}
        value={systemPrompt}
        onChange={setSystemPrompt}
      />
      <AiChatSettingsForm
        value={aiSettings}
        formTitle="AI"
        onChange={(value: { temperature: number; maxOutputTokens?: number }) => {
          setTemperature(value.temperature);
          setMaxOutputTokens(value.maxOutputTokens);
        }}
      />
      {currentProviderForm}
      {rawResponse ? (
        <TextArea
          label="Raw response"
          rows={12}
          value={JSON.stringify(rawResponse, null, 2)}
          onChange={() => undefined}
        />
      ) : null}
    </div>
  );

  const handleSend = async () => {
    if (!canSend) return;

    const trimmedDraft = draft.trim();
    if (!trimmedDraft) return;

    setDraft("");
    setError(undefined);

    if (usesVercelApiChat) {
      setRawResponse(undefined);
      await sendMessage(createPlaygroundUiMessage("user", trimmedDraft) as any, {
        body: {
          model: playgroundModel,
          temperature,
          maxOutputTokens,
          providerMetadata,
        },
      });
      return;
    }

    const nextMessages = [...manualMessages, createPlaygroundUiMessage("user", trimmedDraft)];
    setManualMessages(nextMessages);
    setSending(true);

    try {
      const payloadMessages = toPlaygroundPayloadMessages(nextMessages, systemPrompt);

      const result = await invokePlayground({
        optionId: activeOption.id,
        baseUrl,
        model: playgroundModel,
        messages: payloadMessages,
        temperature,
        maxOutputTokens,
        providerMetadata,
        headers: effectiveHeaders,
        getAccessToken: config?.getAccessToken,
      });

      setRawResponse(result.raw);
      setManualMessages((current) => [...current, createPlaygroundUiMessage("assistant", result.text || "")]);
    } catch (err: any) {
      setError(err?.message ?? "Playground request failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%"
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
            padding: "0px 12px"
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
            valueTitle={selectedClient === "openai" ? "OpenAI" : "Vercel AI SDK"}
            options={availableClientsForEndpoint.map((value) => ({
              value,
              label: value === "openai" ? "OpenAI" : "Vercel AI SDK",
            }))}
            onChange={(value: string) => setSelectedClient(String(value ?? availableClientsForEndpoint[0] ?? selectedClient) as any)}
          >
            {availableClientsForEndpoint.map((value) => (
              <option key={value} value={value}>
                {value === "openai" ? "OpenAI" : "Vercel AI SDK"}
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
                disabled={!canSend}
                streaming={isStreaming}
                error={error}
              />
            </div>
          </div>

          {sidebarOpen ? (
            <Drawer
              open={sidebarOpen}
              title="Settings"
              position="end"
              overlay={!isDesktop}
              size={isDesktop ? drawerSize : "small"}
              headerNavigation={sidebarHeaderNavigation}
              onClose={() => setSidebarOpen(false)}
            >
              <div
                style={{
                  minHeight: 0,
                  height: "100%",
                  overflowY: "auto",
                }}
              >
                {settingsContent}
              </div>
            </Drawer>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
