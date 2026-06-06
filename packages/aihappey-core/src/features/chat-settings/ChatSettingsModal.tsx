import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import {
  DEFAULT_CHAT_TOOL_ANNOTATIONS,
  DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
  defaultProviderMetadata,
  useAppStore,
} from "aihappey-state";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import {
  AnthropicChatConfigForm,
  BlackboxChatConfigForm,
  BrowserUseChatConfigForm,
  BraveChatConfigForm,
  CohereChatConfigForm, GroqChatConfigForm,
  JinaChatConfigForm,
  LinkupChatConfigForm,
  MicrosoftChatConfigForm,
  MistralChatConfigForm, NinjaChatChatConfigForm, OpenAIChatConfigForm,
  OpenHandsChatConfigForm,
  OpenRouterChatConfigForm,
  PerplexityChatConfigForm,
  PoolsideChatConfigForm,
  PollinationsChatConfigForm,
  SambanovaChatConfigForm,
  TemboChatConfigForm,
  SettingsActionButtons, TogetherChatConfigForm,
  useTheme, XAIChatConfigForm,
  RequestyChatConfigForm,
  VeniceChatConfigForm,
  WebCrawlerAPIChatConfigForm,
  XiaomiMIMOChatConfigForm,
  ZaiChatConfigForm,
} from "aihappey-components";
import { GeneralTab } from "./GeneralTab";
import { ToolsTab } from "./ToolsTab";
import { SkillToggleGroups } from "../skills/SkillToggleGroups";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";
import {
  buildOpenAISkillOptions,
  createOpenAIShellSkillResolver,
} from "../provider-config/openai/openAISkillOptions";
import { useSkills } from "aihappey-skills";
import { useChatContext } from "../chat/context/ChatContext";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { SideInferenceAgentsTab } from "./SideInferenceAgentsTab";
import type { SideInferenceAgentNames } from "aihappey-state";

const hostnameOf = (url?: string) => {
  if (!url) return "remote";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export interface ProviderSettingsModalProps {
  open: boolean;
  setTemperature?: any;
  temperature?: any;
  providerMetadata: any;
  resetDefaults?: any;
  setProviderMetadata: (meta: any | ((current: any) => any)) => void;
  onEditProviderKeys?: () => void
  onClose: () => void;
}

type ChatSettingsDraft = {
  temperature?: number;
  maxOutputTokens?: number;
  structuredOutputs?: any;
  throttle: number;
  toolAnnotations?: ToolAnnotations;
  stopTools?: string[];
  maxToolCalls?: number;
  toolChoice?: string;
  activePlugins: string[];
  enabledLocalTools: string[];
  enabledSkillIds: string[];
  providerMetadata: Record<string, any>;
  sideInferenceAgentNames: SideInferenceAgentNames;
};

export const ChatSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  open,
  providerMetadata,
  temperature,
  resetDefaults,
  setTemperature,
  setProviderMetadata,
  onEditProviderKeys,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { config: chatConfig } = useChatContext();
  const defaultTab = "general";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const models = useAppStore((a) => a.models);
  const agents = useAppStore((a) => a.agents);
  const selectedModel = useAppStore((a) => a.selectedModel);
  const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
  const setMaxOutputTokens = useAppStore((s) => s.setMaxOutputTokens);
  const structuredOutputs = useAppStore((s) => s.structuredOutputs);
  const setStructuredOutputs = useAppStore((s) => s.setStructuredOutputs);
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const setThrottle = useAppStore((s) => s.setThrottle);
  const toolAnnotations = useAppStore((s) => s.toolAnnotations);
  const setToolAnnotations = useAppStore((s) => s.setToolAnnotations);
  const stopTools = useAppStore((s) => s.stopTools);
  const setStopTools = useAppStore((s) => s.setStopTools);
  const maxToolCalls = useAppStore((s) => s.maxToolCalls);
  const setMaxToolCalls = useAppStore((s) => s.setMaxToolCalls);
  const toolChoice = useAppStore((s) => s.toolChoice);
  const setToolChoice = useAppStore((s) => s.setToolChoice);
  const activePlugins = useAppStore((s) => s.activePlugins);
  const setActivePlugins = useAppStore((s) => s.setActivePlugins);
  const enabledLocalTools = useAppStore((s) => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore(
    (s) => (s as any).setEnabledLocalTools as (names: string[]) => void
  );
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const sideInferenceAgentNames = useAppStore((s) => s.sideInferenceAgentNames);
  const setSideInferenceAgentNames = useAppStore((s) => s.setSideInferenceAgentNames);
  const restoreDefaultAgents = useAppStore((s) => s.restoreDefaultAgents);
  const favoriteSkillIds = useAppStore((s: any) => s.favoriteSkillIds as string[] | undefined);
  const skills = useSkills();
  const [skillFeedback, setSkillFeedback] = useState<string | null>(null);
  const createDraft = useCallback(
    (): ChatSettingsDraft => ({
      temperature,
      maxOutputTokens,
      structuredOutputs,
      throttle: experimentalThrottle ?? 100,
      toolAnnotations: toolAnnotations ?? DEFAULT_CHAT_TOOL_ANNOTATIONS,
      stopTools: [...(stopTools ?? [])],
      maxToolCalls,
      toolChoice,
      activePlugins: [...(activePlugins ?? [])],
      enabledLocalTools: [...(enabledLocalTools ?? [])],
      enabledSkillIds: [...(enabledSkillIds ?? [])],
      providerMetadata: { ...(providerMetadata ?? {}) },
      sideInferenceAgentNames: {
        ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
        ...(sideInferenceAgentNames ?? {}),
      },
    }),
    [
      activePlugins,
      enabledLocalTools,
      enabledSkillIds,
      experimentalThrottle,
      maxOutputTokens,
      maxToolCalls,
      providerMetadata,
      sideInferenceAgentNames,
      stopTools,
      structuredOutputs,
      temperature,
      toolAnnotations,
      toolChoice,
    ]
  );
  const [draft, setDraft] = useState<ChatSettingsDraft>(() => createDraft());
  const skillItems = useMemo(
    () => skills.items.map((item) => {
      return {
        id: item.skillId,
        label: `${item.name} (v${item.version})`,
        origin: item.origin,
      };
    }),
    [skills.items]
  );
  const remoteSkillsHost = useMemo(
    () => hostnameOf(`${chatConfig.baseUrl}${chatConfig.endpoints.skills}`),
    [chatConfig.baseUrl, chatConfig.endpoints.skills]
  );
  const openAISkillOptions = useMemo(
    () => buildOpenAISkillOptions(skills.items ?? []),
    [skills.items]
  );
  const resolveOpenAIShellSkill = useMemo(
    () => createOpenAIShellSkillResolver(skills, openAISkillOptions),
    [openAISkillOptions, skills]
  );

  useEffect(() => {
    if (!open) return;
    setDraft(createDraft());
    setSkillFeedback(null);
    setActiveTab(defaultTab);
  }, [createDraft, defaultTab, open]);

  const updateProviderConfig = useCallback(
    (providerKey: string, nextConfig: any) => {
      setDraft((current) => ({
        ...(current ?? {}),
        providerMetadata: {
          ...(current?.providerMetadata ?? {}),
          [providerKey]: nextConfig,
        },
      }));
    },
    []
  );

  const providerConfigUpdaters = useMemo(
    () => ({
      anthropic: (anthropic: any) => updateProviderConfig("anthropic", anthropic),
      blackbox: (blackbox: any) => updateProviderConfig("blackbox", blackbox),
      cohere: (cohere: any) => updateProviderConfig("cohere", cohere),
      browseruse: (browseruse: any) => updateProviderConfig("browseruse", browseruse),
      brave: (brave: any) => updateProviderConfig("brave", brave),
      google: (google: any) => updateProviderConfig("google", google),
      groq: (groq: any) => updateProviderConfig("groq", groq),
      jina: (jina: any) => updateProviderConfig("jina", jina),
      microsoft: (microsoft: any) => updateProviderConfig("microsoft", microsoft),
      mistral: (mistral: any) => updateProviderConfig("mistral", mistral),
      ninjachat: (ninjachat: any) => updateProviderConfig("ninjachat", ninjachat),
      openai: (openai: any) => updateProviderConfig("openai", openai),
      openhands: (openhands: any) => updateProviderConfig("openhands", openhands),
      openrouter: (openrouter: any) => updateProviderConfig("openrouter", openrouter),
      pollinations: (pollinations: any) => updateProviderConfig("pollinations", pollinations),
      perplexity: (perplexity: any) => updateProviderConfig("perplexity", perplexity),
      poolside: (poolside: any) => updateProviderConfig("poolside", poolside),
      together: (together: any) => updateProviderConfig("together", together),
      sambanova: (sambanova: any) => updateProviderConfig("sambanova", sambanova),
      tembo: (tembo: any) => updateProviderConfig("tembo", tembo),
      xai: (xai: any) => updateProviderConfig("xai", xai),
      requesty: (requesty: any) => updateProviderConfig("requesty", requesty),
      venice: (venice: any) => updateProviderConfig("venice", venice),
      linkup: (linkup: any) => updateProviderConfig("linkup", linkup),
      webcrawlerapi: (webcrawlerapi: any) => updateProviderConfig("webcrawlerapi", webcrawlerapi),
      xiaomimimo: (xiaomimimo: any) => updateProviderConfig("xiaomimimo", xiaomimimo),
      zai: (zai: any) => updateProviderConfig("zai", zai),
    }),
    [updateProviderConfig]
  );

  const activeProviderKey = useMemo(() => {
    const key = selectedModel?.split("/")[0]?.trim().toLowerCase();
    return key || undefined;
  }, [selectedModel]);

  const selectedModelOption = useMemo(
    () => models?.find((model) => model.id === selectedModel),
    [models, selectedModel]
  );

  const activeProviderTitle = useMemo(() => {
    if (!activeProviderKey) return undefined;

    return (
      (PROVIDERS as Record<string, any>)[activeProviderKey]?.name
      || activeProviderKey
    );
  }, [activeProviderKey, selectedModelOption]);

  const activeProviderForm = useMemo(() => {
    switch (activeProviderKey) {
      case "anthropic":
        return <AnthropicChatConfigForm config={draft.providerMetadata.anthropic ?? {}} updateConfig={providerConfigUpdaters.anthropic} />;
      case "blackbox":
        return <BlackboxChatConfigForm config={draft.providerMetadata.blackbox ?? {}} updateConfig={providerConfigUpdaters.blackbox} />;
      case "cohere":
        return <CohereChatConfigForm config={draft.providerMetadata.cohere ?? {}} updateConfig={providerConfigUpdaters.cohere} />;
      case "browseruse":
        return <BrowserUseChatConfigForm config={draft.providerMetadata.browseruse ?? {}} updateConfig={providerConfigUpdaters.browseruse} />;
      case "brave":
        return <BraveChatConfigForm config={draft.providerMetadata.brave ?? {}} updateConfig={providerConfigUpdaters.brave} />;
      case "google":
        return <GoogleChatConfig google={draft.providerMetadata.google ?? {}} updateGoogle={providerConfigUpdaters.google} />;
      case "groq":
        return <GroqChatConfigForm config={draft.providerMetadata.groq ?? {}} updateConfig={providerConfigUpdaters.groq} />;
      case "jina":
        return <JinaChatConfigForm config={draft.providerMetadata.jina ?? {}} updateConfig={providerConfigUpdaters.jina} />;
      case "mistral":
        return <MistralChatConfigForm config={draft.providerMetadata.mistral ?? {}} updateConfig={providerConfigUpdaters.mistral} />;
      case "microsoft":
        return <MicrosoftChatConfigForm config={draft.providerMetadata.microsoft ?? {}} updateConfig={providerConfigUpdaters.microsoft} />;
      case "ninjachat":
        return <NinjaChatChatConfigForm config={draft.providerMetadata.ninjachat ?? {}} updateConfig={providerConfigUpdaters.ninjachat} />;
      case "openai":
        return (
          <OpenAIChatConfigForm
            config={draft.providerMetadata.openai ?? {}}
            openAISkillOptions={openAISkillOptions}
            resolveOpenAIShellSkill={resolveOpenAIShellSkill}
            updateConfig={providerConfigUpdaters.openai}
          />
        );
      case "openhands":
        return <OpenHandsChatConfigForm config={draft.providerMetadata.openhands ?? {}} updateConfig={providerConfigUpdaters.openhands} />;
      case "openrouter":
        return <OpenRouterChatConfigForm config={draft.providerMetadata.openrouter ?? {}} appTitle={chatConfig?.appName} updateConfig={providerConfigUpdaters.openrouter} />;
      case "requesty":
        return <RequestyChatConfigForm config={draft.providerMetadata.requesty ?? {}} appTitle={chatConfig?.appName} updateConfig={providerConfigUpdaters.requesty} />;
      case "pollinations":
        return <PollinationsChatConfigForm config={draft.providerMetadata.pollinations ?? {}} updateConfig={providerConfigUpdaters.pollinations} />;
      case "perplexity":
        return <PerplexityChatConfigForm config={draft.providerMetadata.perplexity ?? {}} models={models} updateConfig={providerConfigUpdaters.perplexity} />;
      case "poolside":
        return <PoolsideChatConfigForm config={draft.providerMetadata.poolside ?? {}} updateConfig={providerConfigUpdaters.poolside} />;
      case "together":
        return <TogetherChatConfigForm config={draft.providerMetadata.together ?? {}} updateConfig={providerConfigUpdaters.together} />;
      case "sambanova":
        return <SambanovaChatConfigForm config={draft.providerMetadata.sambanova ?? {}} updateConfig={providerConfigUpdaters.sambanova} />;
      case "tembo":
        return <TemboChatConfigForm config={draft.providerMetadata.tembo ?? {}} updateConfig={providerConfigUpdaters.tembo} />;
      case "venice":
        return <VeniceChatConfigForm config={draft.providerMetadata.venice ?? {}} updateConfig={providerConfigUpdaters.venice} />;
      case "linkup":
        return <LinkupChatConfigForm config={draft.providerMetadata.linkup ?? {}} updateConfig={providerConfigUpdaters.linkup} />;
      case "webcrawlerapi":
        return <WebCrawlerAPIChatConfigForm config={draft.providerMetadata.webcrawlerapi ?? {}} updateConfig={providerConfigUpdaters.webcrawlerapi} />;
      case "xai":
        return <XAIChatConfigForm config={draft.providerMetadata.xai ?? {}} updateConfig={providerConfigUpdaters.xai} />;
      case "xiaomimimo":
        return <XiaomiMIMOChatConfigForm config={draft.providerMetadata.xiaomimimo ?? {}} updateConfig={providerConfigUpdaters.xiaomimimo} />;
      case "zai":
        return <ZaiChatConfigForm config={draft.providerMetadata.zai ?? {}} updateConfig={providerConfigUpdaters.zai} />;
      default:
        return null;
    }
  }, [
    activeProviderKey,
    chatConfig?.appName,
    draft.providerMetadata,
    models,
    openAISkillOptions,
    providerConfigUpdaters,
    resolveOpenAIShellSkill,
  ]);

  const handleSkillSelectionChange = async (next: string[]) => {
    setDraft((current) => ({
      ...current,
      enabledSkillIds: next,
    }));
    setSkillFeedback(null);

    const added = next.filter((skillId) => !draft.enabledSkillIds.includes(skillId));
    if (added.length === 0) return;

    const results = await Promise.allSettled(
      added.map((skillId) => skills.ensureDownloaded(skillId))
    );

    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed > 0) {
      setSkillFeedback(
        failed === 1
          ? (t("skillsPage.remoteDownloadFailed") ?? "A remote skill could not be downloaded right now. It will retry on first use.")
          : (t("skillsPage.remoteDownloadFailedMany", { count: failed }) ??
            `${failed} remote skills could not be downloaded right now. They will retry on first use.`)
      );
    }
  };

  const applyDraft = useCallback(() => {
    void setTemperature?.(draft.temperature);
    setMaxOutputTokens(draft.maxOutputTokens);
    setStructuredOutputs(draft.structuredOutputs);
    setThrottle(draft.throttle);
    setToolAnnotations(draft.toolAnnotations);
    setStopTools(draft.stopTools);
    setMaxToolCalls(draft.maxToolCalls);
    setToolChoice(draft.toolChoice);
    setActivePlugins(draft.activePlugins);
    setEnabledLocalTools(draft.enabledLocalTools);
    setEnabledSkillIds(draft.enabledSkillIds);
    setSideInferenceAgentNames(draft.sideInferenceAgentNames);
    setProviderMetadata(draft.providerMetadata);
  }, [
    draft,
    setActivePlugins,
    setEnabledLocalTools,
    setEnabledSkillIds,
    setSideInferenceAgentNames,
    setMaxOutputTokens,
    setMaxToolCalls,
    setProviderMetadata,
    setStopTools,
    setStructuredOutputs,
    setTemperature,
    setThrottle,
    setToolAnnotations,
    setToolChoice,
  ]);

  const restoreDraftDefaults = useCallback(() => {
    setDraft((current) => ({
      ...current,
      temperature: 1,
      toolAnnotations: { ...DEFAULT_CHAT_TOOL_ANNOTATIONS },
      providerMetadata: { ...defaultProviderMetadata },
      sideInferenceAgentNames: { ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION },
    }));
    restoreDefaultAgents();
    setSkillFeedback(null);
  }, [restoreDefaultAgents]);

  const close = () => {
    applyDraft();
    onClose();
    setTimeout(() => {
      setActiveTab(defaultTab);
    }, 200);
  };

  return (
    <theme.Modal
      show={open}
      onHide={close}
      title={t("chatSettings")}
      actions={
        <SettingsActionButtons
          onClose={close}
          onRestoreDefaults={resetDefaults ? restoreDraftDefaults : undefined}
        />
      }
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="general" title={t("general")}>
          {activeTab === "general" ? (
            <GeneralTab
              temperature={draft.temperature}
              onEditProviderKeys={onEditProviderKeys}
              setTemperature={(value: number | undefined) => {
                setDraft((current) => ({
                  ...current,
                  temperature: value,
                }));
              }}
              maxOutputTokens={draft.maxOutputTokens}
              setMaxOutputTokens={(value: number | undefined) => {
                setDraft((current) => ({
                  ...current,
                  maxOutputTokens: value,
                }));
              }}
              structuredOutputs={draft.structuredOutputs}
              setStructuredOutputs={(value: any) => {
                setDraft((current) => ({
                  ...current,
                  structuredOutputs: value,
                }));
              }}
              experimentalThrottle={draft.throttle}
              setThrottle={(value: number) => {
                setDraft((current) => ({
                  ...current,
                  throttle: value,
                }));
              }}
              toolAnnotations={draft.toolAnnotations}
              setToolAnnotations={(value: ToolAnnotations | undefined) => {
                setDraft((current) => ({
                  ...current,
                  toolAnnotations: value,
                }));
              }}
              stopTools={draft.stopTools}
              setStopTools={(value: string[] | undefined) => {
                setDraft((current) => ({
                  ...current,
                  stopTools: value,
                }));
              }}
              maxToolCalls={draft.maxToolCalls}
              setMaxToolCalls={(value: number | undefined) => {
                setDraft((current) => ({
                  ...current,
                  maxToolCalls: value,
                }));
              }}
              toolChoice={draft.toolChoice}
              setToolChoice={(value: string | undefined) => {
                setDraft((current) => ({
                  ...current,
                  toolChoice: value,
                }));
              }}
            />
          ) : null}
        </theme.Tab>
        <theme.Tab eventKey="side-inference" title={t("sideInference.title") ?? "Side inference"}>
          {activeTab === "side-inference" ? (
            <SideInferenceAgentsTab
              agents={agents ?? []}
              value={draft.sideInferenceAgentNames}
              onChange={(next) => {
                setDraft((current) => ({
                  ...current,
                  sideInferenceAgentNames: next,
                }));
              }}
            />
          ) : null}
        </theme.Tab>
        <theme.Tab eventKey="tools" title={t("tools") ?? "Tools"}>
          {activeTab === "tools" ? (
            <ToolsTab
              activePlugins={draft.activePlugins}
              setActivePlugins={(value) => {
                setDraft((current) => ({
                  ...current,
                  activePlugins: value,
                }));
              }}
              enabledLocalTools={draft.enabledLocalTools}
              setEnabledLocalTools={(value) => {
                setDraft((current) => ({
                  ...current,
                  enabledLocalTools: value,
                }));
              }}
            />
          ) : null}
        </theme.Tab>
        <theme.Tab eventKey="skills" title={t("skills") ?? "Skills"}>
          {activeTab === "skills" ? (
            <>
              <SkillToggleGroups
                value={draft.enabledSkillIds}
                onChange={(next) => {
                  void handleSkillSelectionChange(next);
                }}
                columns={2}
                items={skillItems}
                favoriteSkillIds={favoriteSkillIds ?? []}
                remoteTitle={remoteSkillsHost}
              />
              {skillFeedback ? <theme.Text>{skillFeedback}</theme.Text> : null}
            </>
          ) : null}
        </theme.Tab>
        {activeProviderForm && activeProviderTitle ? (
          <theme.Tab eventKey="provider" title={activeProviderTitle}>
            {activeTab === "provider" ? activeProviderForm : null}
          </theme.Tab>
        ) : null}
      </theme.Tabs>
    </theme.Modal>
  );
};
