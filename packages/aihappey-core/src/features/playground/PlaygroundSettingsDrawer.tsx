import { useMemo, useState, type ReactNode } from "react";
import {
  AiChatSettingsForm,
  AnthropicChatConfigForm,
  BrowserUseChatConfigForm,
  BraveChatConfigForm,
  ChatSettingsForm,
  ChatCompletionsEndpointConfigForm,
  CohereChatConfigForm,
  GroqChatConfigForm,
  JinaChatConfigForm,
  MessagesEndpointConfigForm,
  MicrosoftChatConfigForm,
  MistralChatConfigForm,
  OpenAIChatConfigForm,
  PerplexityChatConfigForm,
  PollinationsChatConfigForm,
  ResponsesEndpointConfigForm,
  SambanovaChatConfigForm,
  TogetherChatConfigForm,
  useTheme,
  XAIChatConfigForm,
} from "aihappey-components";
import type { PlaygroundEndpointConfigMap } from "aihappey-clients";
import type { ModelOption } from "aihappey-types";
import { useAppStore } from "aihappey-state";
import { useSkills } from "aihappey-skills";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";
import {
  buildOpenAISkillOptions,
  createOpenAIShellSkillResolver,
} from "../provider-config/openai/openAISkillOptions";

type PlaygroundSettingsDrawerProps = {
  open: boolean;
  isDesktop: boolean;
  drawerSize: "medium" | "large" | "full";
  headerNavigation?: ReactNode;
  onClose: () => void;
  baseUrl: string;
  setBaseUrl: (value: string) => void;
  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  maxOutputTokens?: number;
  setMaxOutputTokens: (value: number | undefined) => void;
  experimentalThrottle: number;
  setExperimentalThrottle: (value: number) => void;
  selectedEndpoint: string;
  currentEndpointConfig: PlaygroundEndpointConfigMap[keyof PlaygroundEndpointConfigMap] | Record<string, any>;
  setEndpointConfigByEndpoint: React.Dispatch<React.SetStateAction<PlaygroundEndpointConfigMap>>;
  selectedModelOption?: ModelOption;
  playgroundModel: string;
  providerKey: string;
  providerMetadata: any;
  setProviderMetadata: React.Dispatch<React.SetStateAction<any>>;
  rawResponse: any;
  requestPreviewHeaders?: string;
  requestPreviewBody?: string;
};


const formatProviderTitle = (providerKey: string, selectedModelOption?: ModelOption) => {
  const displayName = selectedModelOption?.owned_by?.trim();
  if (displayName) return displayName;
  if (!providerKey) return "Provider";
  return providerKey.charAt(0).toUpperCase() + providerKey.slice(1);
};

export const PlaygroundSettingsDrawer = ({
  open,
  isDesktop,
  drawerSize,
  headerNavigation,
  onClose,
  baseUrl,
  setBaseUrl,
  systemPrompt,
  setSystemPrompt,
  temperature,
  setTemperature,
  maxOutputTokens,
  setMaxOutputTokens,
  experimentalThrottle,
  setExperimentalThrottle,
  selectedEndpoint,
  currentEndpointConfig,
  setEndpointConfigByEndpoint,
  selectedModelOption,
  playgroundModel,
  providerKey,
  providerMetadata,
  setProviderMetadata,
  rawResponse,
  requestPreviewHeaders = "",
  requestPreviewBody = "",
}: PlaygroundSettingsDrawerProps) => {
  const models = useAppStore((s) => s.models);
  const skills = useSkills();
  const { Drawer, Tabs, Tab, Input, TextArea, Text } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const openAISkillOptions = useMemo(
    () => buildOpenAISkillOptions(skills.items ?? []),
    [skills.items]
  );
  const resolveOpenAIShellSkill = useMemo(
    () => createOpenAIShellSkillResolver(skills, openAISkillOptions),
    [openAISkillOptions, skills]
  );

  const aiSettings = useMemo(
    () => ({ temperature, maxOutputTokens }),
    [maxOutputTokens, temperature],
  );

  const providerTitle = useMemo(
    () => formatProviderTitle(providerKey, selectedModelOption),
    [providerKey, selectedModelOption],
  );

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
      case "browseruse":
        return <BrowserUseChatConfigForm config={providerMetadata.browseruse ?? {}} updateConfig={updateProviderConfig} />;
      case "brave":
        return <BraveChatConfigForm config={providerMetadata.brave ?? {}} updateConfig={updateProviderConfig} />;
      case "google":
        return <GoogleChatConfig google={providerMetadata.google ?? {}} updateGoogle={updateProviderConfig} />;
      case "groq":
        return <GroqChatConfigForm config={providerMetadata.groq ?? {}} updateConfig={updateProviderConfig} />;
      case "jina":
        return <JinaChatConfigForm config={providerMetadata.jina ?? {}} updateConfig={updateProviderConfig} />;
      case "mistral":
        return <MistralChatConfigForm config={providerMetadata.mistral ?? {}} updateConfig={updateProviderConfig} />;
      case "microsoft":
        return <MicrosoftChatConfigForm config={providerMetadata.microsoft ?? {}} updateConfig={updateProviderConfig} />;
      case "openai":
        return (
          <OpenAIChatConfigForm
            config={providerMetadata.openai ?? {}}
            openAISkillOptions={openAISkillOptions}
            resolveOpenAIShellSkill={resolveOpenAIShellSkill}
            updateConfig={updateProviderConfig}
          />
        );
      case "perplexity":
        return <PerplexityChatConfigForm config={providerMetadata.perplexity ?? {}} models={models} updateConfig={updateProviderConfig} />;
      case "pollinations":
        return <PollinationsChatConfigForm config={providerMetadata.pollinations ?? {}} updateConfig={updateProviderConfig} />;
      case "sambanova":
        return <SambanovaChatConfigForm config={providerMetadata.sambanova ?? {}} updateConfig={updateProviderConfig} />;
      case "together":
        return <TogetherChatConfigForm config={providerMetadata.together ?? {}} updateConfig={updateProviderConfig} />;
      case "xai":
        return <XAIChatConfigForm config={providerMetadata.xai ?? {}} updateConfig={updateProviderConfig} />;
      default:
        return <Text>No provider-specific playground form is available for <b>{providerKey || playgroundModel || "this model"}</b> yet.</Text>;
    }
  }, [
    Text,
    openAISkillOptions,
    playgroundModel,
    providerKey,
    providerMetadata,
    resolveOpenAIShellSkill,
    setProviderMetadata,
  ]);

  const currentEndpointForm = useMemo(() => {
    const updateEndpointConfig = (next: any) => {
      setEndpointConfigByEndpoint((current) => ({
        ...current,
        [selectedEndpoint]: next,
      }));
    };

    switch (selectedEndpoint) {
      case "/v1/chat/completions":
        return <ChatCompletionsEndpointConfigForm value={currentEndpointConfig as any} onChange={updateEndpointConfig} />;
      case "/v1/responses":
        return <ResponsesEndpointConfigForm value={currentEndpointConfig as any} onChange={updateEndpointConfig} />;
      case "/v1/messages":
        return <MessagesEndpointConfigForm value={currentEndpointConfig as any} onChange={updateEndpointConfig} />;
      default:
        return <Text>No endpoint-specific playground settings are available for <b>{selectedEndpoint}</b>.</Text>;
    }
  }, [Text, currentEndpointConfig, selectedEndpoint, setEndpointConfigByEndpoint]);

  return (
    <Drawer
      open={open}
      title="Settings"
      position="end"
      overlay={!isDesktop}
      size={isDesktop ? drawerSize : "small"}
      headerNavigation={headerNavigation}
      onClose={onClose}
    >
      <div style={{ minHeight: 0, height: "100%", overflowY: "auto" }}>
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          <Tab eventKey="general" title="General">
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>
              <Input label="Base URL" disabled value={baseUrl} onChange={(a) => setBaseUrl(a.target.value)} />
              <TextArea label="System prompt" rows={4} value={systemPrompt} onChange={setSystemPrompt} />
              <AiChatSettingsForm
                value={aiSettings}
                formTitle="AI"
                onChange={(value: { temperature: number; maxOutputTokens?: number }) => {
                  setTemperature(value.temperature);
                  setMaxOutputTokens(value.maxOutputTokens);
                }}
              />
              <ChatSettingsForm
                value={{ throttle: experimentalThrottle }}
                formTitle="Chat"
                onChange={(value: { throttle: number }) => {
                  setExperimentalThrottle(value.throttle);
                }}
              />
            </div>
          </Tab>
          <Tab eventKey="endpoint" title={selectedEndpoint}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>{currentEndpointForm}</div>
          </Tab>
          <Tab eventKey="provider" title={providerTitle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>{currentProviderForm}</div>
          </Tab>
          <Tab eventKey="request" title="Request">
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>
              <TextArea label="Headers preview" rows={10} value={requestPreviewHeaders} readOnly hint="Preview of the request headers for the current playground state." />
              <TextArea label="Body preview" rows={14} value={requestPreviewBody} readOnly hint="Preview of the request body for the current playground state." />
            </div>
          </Tab>
          <Tab eventKey="response" title="Response">
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 12 }}>
              {rawResponse ? <TextArea label="Raw response" rows={12} value={JSON.stringify(rawResponse, null, 2)} onChange={() => undefined} /> : <Text>No response available yet.</Text>}
            </div>
          </Tab>
        </Tabs>
      </div>
    </Drawer>
  );
};

export default PlaygroundSettingsDrawer;
