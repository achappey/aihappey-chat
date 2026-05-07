import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import {
  DEFAULT_CHAT_TOOL_ANNOTATIONS,
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
  LocalToolsSettingsForm,
  MicrosoftChatConfigForm,
  MistralChatConfigForm, OpenAIChatConfigForm,
  OpenRouterChatConfigForm,
  PerplexityChatConfigForm,
  PollinationsChatConfigForm,
  SambanovaChatConfigForm,
  SettingsActionButtons, TogetherChatConfigForm,
  useTheme, XAIChatConfigForm,
  RequestyChatConfigForm
} from "aihappey-components";
import { GeneralTab } from "./GeneralTab";
import { ToolsTab } from "./ToolsTab";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";
import {
  buildOpenAISkillOptions,
  createOpenAIShellSkillResolver,
} from "../provider-config/openai/openAISkillOptions";
import { useSkills } from "aihappey-skills";
import { useChatContext } from "../chat/context/ChatContext";

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
  const enabledProviders = useAppStore((a) => a.enabledProvidersByType?.language ?? [])
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
    }),
    [
      activePlugins,
      enabledLocalTools,
      enabledSkillIds,
      experimentalThrottle,
      maxOutputTokens,
      maxToolCalls,
      providerMetadata,
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
      };
    }),
    [skills.items]
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
      openai: (openai: any) => updateProviderConfig("openai", openai),
      openrouter: (openrouter: any) => updateProviderConfig("openrouter", openrouter),
      pollinations: (pollinations: any) => updateProviderConfig("pollinations", pollinations),
      perplexity: (perplexity: any) => updateProviderConfig("perplexity", perplexity),
      together: (together: any) => updateProviderConfig("together", together),
      sambanova: (sambanova: any) => updateProviderConfig("sambanova", sambanova),
      xai: (xai: any) => updateProviderConfig("xai", xai),
      requesty: (requesty: any) => updateProviderConfig("requesty", requesty),
    }),
    [updateProviderConfig]
  );

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
    setProviderMetadata(draft.providerMetadata);
  }, [
    draft,
    setActivePlugins,
    setEnabledLocalTools,
    setEnabledSkillIds,
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
    }));
    setSkillFeedback(null);
  }, []);

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
              <LocalToolsSettingsForm
                formTitle={t("skills") ?? "Skills"}
                value={draft.enabledSkillIds}
                onChange={(next) => {
                  void handleSkillSelectionChange(next);
                }}
                columns={2}
                items={skillItems}
              />
              {skillFeedback ? <theme.Text>{skillFeedback}</theme.Text> : null}
            </>
          ) : null}
        </theme.Tab>
        {enabledProviders.includes("Anthropic") &&
          <theme.Tab eventKey="anthropic" title="Anthropic">
            {activeTab === "anthropic" ? (
              <AnthropicChatConfigForm
                config={draft.providerMetadata.anthropic ?? {}}
                updateConfig={providerConfigUpdaters.anthropic}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Cohere") &&
          <theme.Tab eventKey="cohere" title="Cohere">
            {activeTab === "cohere" ? (
              <CohereChatConfigForm
                config={draft.providerMetadata.cohere ?? {}}
                updateConfig={providerConfigUpdaters.cohere}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("BrowserUse") &&
          <theme.Tab eventKey="browseruse" title="BrowserUse">
            {activeTab === "browseruse" ? (
              <BrowserUseChatConfigForm
                config={draft.providerMetadata.browseruse ?? {}}
                updateConfig={providerConfigUpdaters.browseruse}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Brave") &&
          <theme.Tab eventKey="brave" title="Brave">
            {activeTab === "brave" ? (
              <BraveChatConfigForm
                config={draft.providerMetadata.brave ?? {}}
                updateConfig={providerConfigUpdaters.brave}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Google") &&
          <theme.Tab eventKey="google" title="Google">
            {activeTab === "google" ? (
              <GoogleChatConfig
                google={draft.providerMetadata.google ?? {}}
                updateGoogle={providerConfigUpdaters.google}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Groq") &&
          <theme.Tab eventKey="groq" title="Groq">
            {activeTab === "groq" ? (
              <GroqChatConfigForm
                config={draft.providerMetadata.groq ?? {}}
                updateConfig={providerConfigUpdaters.groq}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Jina") &&
          <theme.Tab eventKey="jina" title="Jina">
            {activeTab === "jina" ? (
              <JinaChatConfigForm
                config={draft.providerMetadata.jina ?? {}}
                updateConfig={providerConfigUpdaters.jina}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Mistral") &&
          <theme.Tab eventKey="mistral" title="Mistral">
            {activeTab === "mistral" ? (
              <MistralChatConfigForm
                config={draft.providerMetadata.mistral ?? {}}
                updateConfig={providerConfigUpdaters.mistral}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Microsoft") &&
          <theme.Tab eventKey="microsoft" title="Microsoft">
            {activeTab === "microsoft" ? (
              <MicrosoftChatConfigForm
                config={draft.providerMetadata.microsoft ?? {}}
                updateConfig={providerConfigUpdaters.microsoft}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("OpenAI") &&
          <theme.Tab eventKey="openai" title="OpenAI">
            {activeTab === "openai" ? (
              <OpenAIChatConfigForm
                config={draft.providerMetadata.openai ?? {}}
                openAISkillOptions={openAISkillOptions}
                resolveOpenAIShellSkill={resolveOpenAIShellSkill}
                updateConfig={providerConfigUpdaters.openai}
              />
            ) : null}

          </theme.Tab>
        }
        {enabledProviders.includes("OpenRouter") &&
          <theme.Tab eventKey="openrouter" title="OpenRouter">
            {activeTab === "openrouter" ? (
              <OpenRouterChatConfigForm
                config={draft.providerMetadata.openrouter ?? {}}
                appTitle={chatConfig?.appName}
                updateConfig={providerConfigUpdaters.openrouter}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Requesty") &&
          <theme.Tab eventKey="requesty" title="Requesty">
            {activeTab === "requesty" ? (
              <RequestyChatConfigForm
                config={draft.providerMetadata.requesty ?? {}}
                appTitle={chatConfig?.appName}
                updateConfig={providerConfigUpdaters.requesty}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("BLACKBOX") &&
          <theme.Tab eventKey="blackbox" title="BLACKBOX">
            {activeTab === "blackbox" ? (
              <BlackboxChatConfigForm
                config={draft.providerMetadata.blackbox ?? {}}
                updateConfig={providerConfigUpdaters.blackbox}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Pollinations") &&
          <theme.Tab eventKey="pollinations" title="Pollinations">
            {activeTab === "pollinations" ? (
              <PollinationsChatConfigForm
                config={draft.providerMetadata.pollinations ?? {}}
                updateConfig={providerConfigUpdaters.pollinations}
              />
            ) : null}

          </theme.Tab>
        }
        {enabledProviders.includes("Perplexity") &&
          <theme.Tab eventKey="perplexity"
            title="Perplexity">
            {activeTab === "perplexity" ? (
              <PerplexityChatConfigForm
                config={draft.providerMetadata.perplexity ?? {}}
                models={models}
                updateConfig={providerConfigUpdaters.perplexity}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("Together") &&
          <theme.Tab eventKey="together"
            title="Together">
            {activeTab === "together" ? (
              <TogetherChatConfigForm
                config={draft.providerMetadata.together ?? {}}
                updateConfig={providerConfigUpdaters.together}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("SambaNova") &&
          <theme.Tab eventKey="sambanova" title="SambaNova">
            {activeTab === "sambanova" ? (
              <SambanovaChatConfigForm
                config={draft.providerMetadata.sambanova ?? {}}
                updateConfig={providerConfigUpdaters.sambanova}
              />
            ) : null}
          </theme.Tab>
        }
        {enabledProviders.includes("xAI") &&
          <theme.Tab eventKey="xai"
            title="xAI">
            {activeTab === "xai" ? (
              <XAIChatConfigForm
                config={draft.providerMetadata.xai ?? {}}
                updateConfig={providerConfigUpdaters.xai}
              />
            ) : null}
          </theme.Tab>
        }
      </theme.Tabs>
    </theme.Modal>
  );
};
