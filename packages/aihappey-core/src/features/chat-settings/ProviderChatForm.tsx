import React from "react";
import type { ModelOption } from "aihappey-types";
import {
  AbliterationChatConfigForm,
  AkumiChatConfigForm,
  AnthropicChatConfigForm,
  ApertisChatConfigForm,
  BlackboxChatConfigForm,
  CohereChatConfigForm,
  CortecsChatConfigForm,
  DepazaChatConfigForm,
  BrowserUseChatConfigForm,
  BraveChatConfigForm,
  BasetenChatConfigForm,
  CerebrasChatConfigForm,
  DeepSeekChatConfigForm,
  GroqChatConfigForm,
  JinaChatConfigForm,
  InworldChatConfigForm,
  InterfazeChatConfigForm,
  MistralChatConfigForm,
  MaritacaAIChatConfigForm,
  MireyeChatConfigForm,
  NeuralwattChatConfigForm,
  CopilotChatConfigForm,
  NinjaChatChatConfigForm,
  OpenAIChatConfigForm,
  OpenHandsChatConfigForm,
  OpenRouterChatConfigForm,
  RequestyChatConfigForm,
  PollinationsChatConfigForm,
  PerplexityChatConfigForm,
  PoolsideChatConfigForm,
  TogetherChatConfigForm,
  SambanovaChatConfigForm,
  TemboChatConfigForm,
  TinyFishChatConfigForm,
  UpstageChatConfigForm,
  VeniceChatConfigForm,
  LinkupChatConfigForm,
  WebCrawlerAPIChatConfigForm,
  XAIChatConfigForm,
  XiaomiMIMOChatConfigForm,
  ZaiChatConfigForm,
} from "aihappey-components";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";

export type ProviderChatFormProps = {
  providerKey: string;
  config: any;
  headers: Record<string, string>;
  updateConfig: (config: any) => void;
  updateHeaders: (headers: Record<string, string> | undefined) => void;
  models: ModelOption[];
  appTitle?: string;
  openAISkillOptions?: React.ComponentProps<typeof OpenAIChatConfigForm>["openAISkillOptions"];
  resolveOpenAIShellSkill?: React.ComponentProps<typeof OpenAIChatConfigForm>["resolveOpenAIShellSkill"];
};

/** Controlled provider forms: the caller owns all settings and persistence. */
export function renderProviderChatForm({
  providerKey, config, headers, updateConfig, updateHeaders, models, appTitle,
  openAISkillOptions, resolveOpenAIShellSkill,
}: ProviderChatFormProps): React.ReactNode {
  switch (providerKey) {
    case "abliteration":
      return <AbliterationChatConfigForm config={config} updateConfig={updateConfig} />;
    case "akumi":
      return <AkumiChatConfigForm config={config} updateConfig={updateConfig} />;
    case "anthropic":
      return <AnthropicChatConfigForm config={config} headers={headers} updateConfig={updateConfig} updateHeaders={updateHeaders} />;
    case "apertis":
      return <ApertisChatConfigForm config={config} updateConfig={updateConfig} />;
    case "blackbox":
      return <BlackboxChatConfigForm config={config} updateConfig={updateConfig} />;
    case "cohere":
      return <CohereChatConfigForm config={config} updateConfig={updateConfig} />;
    case "cortecs":
      return <CortecsChatConfigForm config={config} updateConfig={updateConfig} />;
    case "depaza":
      return <DepazaChatConfigForm config={config} updateConfig={updateConfig} />;
    case "browseruse":
      return <BrowserUseChatConfigForm config={config} updateConfig={updateConfig} />;
    case "brave":
      return <BraveChatConfigForm config={config} updateConfig={updateConfig} />;
    case "baseten":
      return <BasetenChatConfigForm config={config} headers={headers} updateConfig={updateConfig} updateHeaders={updateHeaders} />;
    case "cerebras":
      return <CerebrasChatConfigForm config={config} updateConfig={updateConfig} />;
    case "deepseek":
      return <DeepSeekChatConfigForm config={config} updateConfig={updateConfig} />;
    case "google":
      return <GoogleChatConfig google={config} updateGoogle={updateConfig} />;
    case "groq":
      return <GroqChatConfigForm config={config} updateConfig={updateConfig} />;
    case "jina":
      return <JinaChatConfigForm config={config} updateConfig={updateConfig} />;
    case "inworld":
      return <InworldChatConfigForm config={config} updateConfig={updateConfig} />;
    case "interfaze":
      return <InterfazeChatConfigForm config={config} headers={headers} updateConfig={updateConfig} updateHeaders={updateHeaders} />;
    case "mistral":
      return <MistralChatConfigForm config={config} updateConfig={updateConfig} />;
    case "maritacaai":
      return <MaritacaAIChatConfigForm config={config} updateConfig={updateConfig} />;
    case "mireye":
      return <MireyeChatConfigForm config={config} updateConfig={updateConfig} />;
    case "neuralwatt":
      return <NeuralwattChatConfigForm config={config} updateConfig={updateConfig} />;
    case "copilot":
      return <CopilotChatConfigForm config={config} updateConfig={updateConfig} />;
    case "ninjachat":
      return <NinjaChatChatConfigForm config={config} updateConfig={updateConfig} />;
    case "openai":
      return (
        <OpenAIChatConfigForm
          config={config}
          headers={headers}
          openAISkillOptions={openAISkillOptions}
          resolveOpenAIShellSkill={resolveOpenAIShellSkill}
          updateConfig={updateConfig}
          updateHeaders={updateHeaders}
        />
      );
    case "openhands":
      return <OpenHandsChatConfigForm config={config} updateConfig={updateConfig} />;
    case "openrouter":
      return <OpenRouterChatConfigForm config={config} headers={headers} appTitle={appTitle} updateConfig={updateConfig} updateHeaders={updateHeaders} />;
    case "requesty":
      return <RequestyChatConfigForm config={config} headers={headers} appTitle={appTitle} updateConfig={updateConfig} updateHeaders={updateHeaders} />;
    case "pollinations":
      return <PollinationsChatConfigForm config={config} updateConfig={updateConfig} />;
    case "perplexity":
      return <PerplexityChatConfigForm config={config} models={models} updateConfig={updateConfig} />;
    case "poolside":
      return <PoolsideChatConfigForm config={config} updateConfig={updateConfig} />;
    case "together":
      return <TogetherChatConfigForm config={config} updateConfig={updateConfig} />;
    case "sambanova":
      return <SambanovaChatConfigForm config={config} updateConfig={updateConfig} />;
    case "tembo":
      return <TemboChatConfigForm config={config} updateConfig={updateConfig} />;
    case "tinyfish":
      return <TinyFishChatConfigForm config={config} updateConfig={updateConfig} />;
    case "upstage":
      return <UpstageChatConfigForm config={config} updateConfig={updateConfig} />;
    case "venice":
      return <VeniceChatConfigForm config={config} updateConfig={updateConfig} />;
    case "linkup":
      return <LinkupChatConfigForm config={config} updateConfig={updateConfig} />;
    case "webcrawlerapi":
      return <WebCrawlerAPIChatConfigForm config={config} updateConfig={updateConfig} />;
    case "spacexai":
      return <XAIChatConfigForm config={config} updateConfig={updateConfig} />;
    case "xiaomimimo":
      return <XiaomiMIMOChatConfigForm config={config} updateConfig={updateConfig} />;
    case "zai":
      return <ZaiChatConfigForm config={config} updateConfig={updateConfig} />;
    default:
      return null;
  }
}
