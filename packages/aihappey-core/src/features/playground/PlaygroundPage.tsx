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

export const PlaygroundPage = () => {
  const { isDarkMode } = useDarkMode();
  const { config } = useChatContext();
  const { Button, Card, Select, Switch, Text, Input, TextArea, Spinner } = useTheme();
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
        minHeight: "100%",
        background: isDarkMode ? "#1f1f1f" : "#f7f7f8",
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
            padding: "8px 12px",
            borderBottom: isDarkMode ? "1px solid #3a3a3a" : "1px solid #e5e5e5",
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
            display: "grid",
            gridTemplateColumns: sidebarOpen ? "minmax(0, 1fr) 380px" : "minmax(0, 1fr)",
            gap: 16,
            minHeight: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 0,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "55vh",
                  maxHeight: "55vh",
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

            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <TextArea
                  label="Message"
                  rows={6}
                  value={draft}
                  onChange={setDraft}
                  placeholder="Type a prompt to test the selected endpoint and client combination."
                />
                {error ? <Text style={{ color: "#d13438" }}>{error}</Text> : null}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center" }}>
                  {isStreaming ? <Spinner /> : null}
                  <Button onClick={() => {
                    setRawResponse(undefined);
                    setError(undefined);
                    if (usesVercelApiChat) {
                      setPlaygroundChatId(`playground-${Date.now()}`);
                      return;
                    }
                    setManualMessages([]);
                  }} variant="subtle">
                     Clear
                   </Button>
                  <Button onClick={() => void handleSend()} disabled={!canSend}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {sidebarOpen ? (
            <div style={{ minHeight: 0, overflowY: "auto" }}>
              <Card size="small" title="Settings">
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
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
