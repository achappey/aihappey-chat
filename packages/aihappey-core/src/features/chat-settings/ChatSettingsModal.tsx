import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import {
  DEFAULT_CHAT_TOOL_ANNOTATIONS,
  DEFAULT_CHAT_VERBOSITY,
  DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
  defaultProviderHeaders,
  defaultProviderMetadata,
  defaultProviderRealtimeConversationMetadata,
  defaultProviderFileMetadata,
  useAppStore,
  type ChatVerbosity,
} from "aihappey-state";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import {
  SettingsActionButtons,
  ProviderSettingsTabs,
  RealtimeProviderConfigForm,
  hasRealtimeProviderConfig,
  normalizeRealtimeSettingsProviderKey,
  useTheme,
} from "aihappey-components";
import { GeneralTab } from "./GeneralTab";
import { ToolsTab } from "./ToolsTab";
import { ToolConfigurationTab, type ToolRequestConfig } from "./ToolConfigurationTab";
import { ChatSkillsEditor } from "./ChatSkillsEditor";
import { renderProviderChatForm } from "./ProviderChatForm";
import {
  buildOpenAISkillOptions,
  createOpenAIShellSkillResolver,
} from "../provider-config/openai/openAISkillOptions";
import { useSkills } from "aihappey-skills";
import { useChatContext } from "../chat/context/ChatContext";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useTools } from "../tools/useTools";
import { usePlugins } from "aihappey-plugins";
import { ChatPluginsEditor } from "./ChatPluginsEditor";
import { connectedMcpSkills } from "../skills/connectedMcpSkills";
import { hasProviderFileSettings, useProviderFileSettingsTabs } from "../providers/ProviderFileSettings";
import { getModelProviderKey, type ProviderFileMetadata } from "aihappey-types";

const hostnameOf = (url?: string) => {
  if (!url) return "remote";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export interface ProviderSettingsModalProps {
  realtimeModel?: string;
  open: boolean;
  setTemperature?: any;
  temperature?: any;
  providerMetadata: any;
  providerHeaders: Record<string, Record<string, string>>;
  resetDefaults?: any;
  setProviderMetadata: (meta: any | ((current: any) => any)) => void;
  setProviderHeaders: (headers: Record<string, Record<string, string>> | ((current: Record<string, Record<string, string>> | undefined) => Record<string, Record<string, string>> | undefined)) => void;
  onEditProviderKeys?: () => void
  onClose: () => void;
}

import { LiveClientTargetSelect } from '../realtime/LiveClientTargetSelect';

type ChatSettingsDraft = {
  liveClientTarget?: { kind: 'agent' | 'model'; id: string };
  temperature?: number;
  maxOutputTokens?: number;
  structuredOutputs?: any;
  verbosity: ChatVerbosity;
  throttle: number;
  toolAnnotations?: ToolAnnotations;
  stopTools?: string[];
  maxToolCalls?: number;
  toolChoice?: string;
  activePlugins: string[];
  enabledAgentPluginIds: string[];
  enabledLocalTools: string[];
  toolRequestConfig: ToolRequestConfig;
  useToolNamespaces: boolean;
  enabledSkillIds: string[];
  providerMetadata: Record<string, any>;
  providerRealtimeConversationMetadata: Record<string, any>;
  providerFileMetadata: ProviderFileMetadata;
  providerHeaders: Record<string, Record<string, string>>;
};

const ProviderTabContent: React.FC<{
  providerKey: string;
  form: React.ReactNode;
  fileSettings: NonNullable<Parameters<typeof useProviderFileSettingsTabs>[1]>;
}> = ({ providerKey, form, fileSettings }) => {
  const { t } = useTranslation();
  const fileSettingsTabs = useProviderFileSettingsTabs(providerKey, fileSettings);
  return <ProviderSettingsTabs tabs={[
    ...(form ? [{ id: "settings", icon: "settings" as const, title: t("settings"), content: form }] : []),
    ...fileSettingsTabs,
  ]} />;
};

export const ChatSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  realtimeModel,
  open,
  providerMetadata,
  providerHeaders,
  temperature,
  resetDefaults,
  setTemperature,
  setProviderMetadata,
  setProviderHeaders,
  onEditProviderKeys,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { config: chatConfig } = useChatContext();
  const defaultTab = "general";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const models = useAppStore((a) => a.models);
  const providerFileMetadata = useAppStore((s) => s.providerFileMetadata);
  const setProviderFileMetadata = useAppStore((s) => s.setProviderFileMetadata);
  const agents = useAppStore((a) => a.agents);
  const selectedModel = useAppStore((a) => a.selectedModel);
  const selectedChatModelIds = useAppStore((a) => a.selectedChatModelIds);
  const providerRealtimeConversationMetadata = useAppStore((s) => s.providerRealtimeConversationMetadata);
  const setProviderRealtimeConversationMetadata = useAppStore((s) => s.setProviderRealtimeConversationMetadata);
  const liveClientTarget = useAppStore(s => s.liveClientTarget);
  const setLiveClientTarget = useAppStore(s => s.setLiveClientTarget);
  const isRealtime = realtimeModel !== undefined;
  const realtimeProviderKey = normalizeRealtimeSettingsProviderKey(
    getModelProviderKey(realtimeModel, models?.find((model) => model.id === realtimeModel)) ?? ""
  );
  const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
  const setMaxOutputTokens = useAppStore((s) => s.setMaxOutputTokens);
  const structuredOutputs = useAppStore((s) => s.structuredOutputs);
  const setStructuredOutputs = useAppStore((s) => s.setStructuredOutputs);
  const verbosity = useAppStore((s) => s.verbosity);
  const setVerbosity = useAppStore((s) => s.setVerbosity);
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
  const enabledAgentPluginIds = useAppStore((s) => s.enabledAgentPluginIds);
  const setEnabledAgentPluginIds = useAppStore((s) => s.setEnabledAgentPluginIds);
  const enabledLocalTools = useAppStore((s) => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore(
    (s) => (s as any).setEnabledLocalTools as (names: string[]) => void
  );
  const toolRequestConfig = useAppStore((s) => (s as any).toolRequestConfig as ToolRequestConfig);
  const setToolRequestConfig = useAppStore((s) => (s as any).setToolRequestConfig as (value: ToolRequestConfig) => void);
  const useToolNamespaces = useAppStore((s) => !!(s as any).useToolNamespaces);
  const setUseToolNamespaces = useAppStore((s) => (s as any).setUseToolNamespaces as (value: boolean) => void);
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const favoriteSkillIds = useAppStore((s: any) => s.favoriteSkillIds as string[] | undefined);
  const skills = useSkills();
  const mcpCatalog = useAppStore((s) => s.mcpSkills);
  const mcpSkills = useMemo(() => connectedMcpSkills(mcpCatalog), [mcpCatalog]);
  const plugins = usePlugins();
  const [skillFeedback, setSkillFeedback] = useState<string | null>(null);
  const createDraft = useCallback(
    (): ChatSettingsDraft => ({
      liveClientTarget: liveClientTarget ? { ...liveClientTarget } : undefined,
      temperature,
      maxOutputTokens,
      structuredOutputs,
      verbosity: verbosity ?? DEFAULT_CHAT_VERBOSITY,
      throttle: experimentalThrottle ?? 100,
      toolAnnotations: toolAnnotations ?? DEFAULT_CHAT_TOOL_ANNOTATIONS,
      stopTools: [...(stopTools ?? [])],
      maxToolCalls,
      toolChoice,
      activePlugins: [...(activePlugins ?? [])],
      enabledAgentPluginIds: [...(enabledAgentPluginIds ?? [])],
      enabledLocalTools: [...(enabledLocalTools ?? [])],
      toolRequestConfig: { ...(toolRequestConfig ?? {}) },
      useToolNamespaces: !!useToolNamespaces,
      enabledSkillIds: [...(enabledSkillIds ?? [])],
      providerMetadata: { ...(providerMetadata ?? {}) },
      providerRealtimeConversationMetadata: structuredClone(providerRealtimeConversationMetadata ?? {}),
      providerFileMetadata: structuredClone(providerFileMetadata ?? defaultProviderFileMetadata),
      providerHeaders: { ...(providerHeaders ?? {}) },
    }),
    [
      activePlugins,
      enabledAgentPluginIds,
      enabledLocalTools,
      enabledSkillIds,
      experimentalThrottle,
      maxOutputTokens,
      maxToolCalls,
      providerHeaders,
      providerMetadata,
      providerRealtimeConversationMetadata,
      liveClientTarget,
      providerFileMetadata,
      stopTools,
      structuredOutputs,
      verbosity,
      temperature,
      toolAnnotations,
      toolRequestConfig,
      toolChoice,
      useToolNamespaces,
    ]
  );
  const [draft, setDraft] = useState<ChatSettingsDraft>(() => createDraft());
  const attachedTools = useTools({
    activePlugins: draft.activePlugins,
    enabledLocalTools: draft.enabledLocalTools,
  }).attachedTools;
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

  const updateProviderHeaders = useCallback(
    (providerKey: string, nextHeaders: Record<string, string> | undefined) => {
      setDraft((current) => {
        const providerHeaders = { ...(current?.providerHeaders ?? {}) };

        if (nextHeaders && Object.keys(nextHeaders).length) {
          providerHeaders[providerKey] = nextHeaders;
        } else {
          delete providerHeaders[providerKey];
        }

        return {
          ...(current ?? {}),
          providerHeaders,
        };
      });
    },
    []
  );

  const providerConfigUpdaters = useMemo(
    () => ({
      abliteration: (abliteration: any) => updateProviderConfig("abliteration", abliteration),
      akumi: (akumi: any) => updateProviderConfig("akumi", akumi),
      anthropic: (anthropic: any) => updateProviderConfig("anthropic", anthropic),
      apertis: (apertis: any) => updateProviderConfig("apertis", apertis),
      neuralwatt: (neuralwatt: any) => updateProviderConfig("neuralwatt", neuralwatt),
      blackbox: (blackbox: any) => updateProviderConfig("blackbox", blackbox),
      cohere: (cohere: any) => updateProviderConfig("cohere", cohere),
      cortecs: (cortecs: any) => updateProviderConfig("cortecs", cortecs),
      depaza: (depaza: any) => updateProviderConfig("depaza", depaza),
      browseruse: (browseruse: any) => updateProviderConfig("browseruse", browseruse),
      brave: (brave: any) => updateProviderConfig("brave", brave),
      baseten: (baseten: any) => updateProviderConfig("baseten", baseten),
      cerebras: (cerebras: any) => updateProviderConfig("cerebras", cerebras),
      deepseek: (deepseek: any) => updateProviderConfig("deepseek", deepseek),
      google: (google: any) => updateProviderConfig("google", google),
      groq: (groq: any) => updateProviderConfig("groq", groq),
      jina: (jina: any) => updateProviderConfig("jina", jina),
      inworld: (inworld: any) => updateProviderConfig("inworld", inworld),
      interfaze: (interfaze: any) => updateProviderConfig("interfaze", interfaze),
      maritacaai: (maritacaai: any) => updateProviderConfig("maritacaai", maritacaai),
      mireye: (mireye: any) => updateProviderConfig("mireye", mireye),
      copilot: (microsoft: any) => updateProviderConfig("copilot", microsoft),
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
      tinyfish: (tinyfish: any) => updateProviderConfig("tinyfish", tinyfish),
      upstage: (upstage: any) => updateProviderConfig("upstage", upstage),
      spacexai: (spacexai: any) => updateProviderConfig("spacexai", spacexai),
      requesty: (requesty: any) => updateProviderConfig("requesty", requesty),
      venice: (venice: any) => updateProviderConfig("venice", venice),
      linkup: (linkup: any) => updateProviderConfig("linkup", linkup),
      webcrawlerapi: (webcrawlerapi: any) => updateProviderConfig("webcrawlerapi", webcrawlerapi),
      xiaomimimo: (xiaomimimo: any) => updateProviderConfig("xiaomimimo", xiaomimimo),
      zai: (zai: any) => updateProviderConfig("zai", zai),
    }),
    [updateProviderConfig]
  );

  const providerHeaderUpdaters = useMemo(
    () => ({
      anthropic: (headers: Record<string, string> | undefined) => updateProviderHeaders("anthropic", headers),
      baseten: (headers: Record<string, string> | undefined) => updateProviderHeaders("baseten", headers),
      interfaze: (headers: Record<string, string> | undefined) => updateProviderHeaders("interfaze", headers),
      openai: (headers: Record<string, string> | undefined) => updateProviderHeaders("openai", headers),
      openrouter: (headers: Record<string, string> | undefined) => updateProviderHeaders("openrouter", headers),
      requesty: (headers: Record<string, string> | undefined) => updateProviderHeaders("requesty", headers),
    }),
    [updateProviderHeaders]
  );

  const selectedProviderKeys = useMemo(() => {
    if (isRealtime) return realtimeProviderKey ? [realtimeProviderKey] : [];
    const ids = selectedChatModelIds ?? (selectedModel ? [selectedModel] : []);
    return Array.from(new Set(ids.map((id) => getModelProviderKey(id, models?.find((model) => model.id === id)))
      .filter((key): key is string => !!key)));
  }, [isRealtime, realtimeProviderKey, models, selectedChatModelIds, selectedModel]);

  const renderProviderForm = useCallback((providerKey: string) => {
    if (isRealtime) {
      return hasRealtimeProviderConfig(providerKey) ? (
        <RealtimeProviderConfigForm
          liveClientSelector={<LiveClientTargetSelect value={draft.liveClientTarget} onChange={liveClientTarget => setDraft(current => ({ ...current, liveClientTarget }))} />}
          providerKey={providerKey}
          providerMetadata={draft.providerRealtimeConversationMetadata}
          setProviderMetadata={(metadata) => setDraft((current) => ({
            ...current,
            providerRealtimeConversationMetadata: metadata,
          }))}
        />
      ) : null;
    }
    return renderProviderChatForm({
      providerKey,
      config: draft.providerMetadata[providerKey] ?? {},
      headers: draft.providerHeaders[providerKey] ?? {},
      updateConfig: providerConfigUpdaters[providerKey as keyof typeof providerConfigUpdaters],
      updateHeaders: providerHeaderUpdaters[providerKey as keyof typeof providerHeaderUpdaters],
      models: models ?? [], appTitle: chatConfig?.appName, openAISkillOptions, resolveOpenAIShellSkill,
    });
  }, [
    isRealtime,
    draft.providerRealtimeConversationMetadata,
    draft.liveClientTarget,
    chatConfig?.appName,
    draft.providerHeaders,
    draft.providerMetadata,
    models,
    openAISkillOptions,
    providerConfigUpdaters,
    providerHeaderUpdaters,
    resolveOpenAIShellSkill,
  ]);

  const providerTabs = useMemo(() => selectedProviderKeys
    .map((key) => ({ key, form: renderProviderForm(key) }))
    .filter(({ key, form }) => form || (!isRealtime && hasProviderFileSettings(key))), [isRealtime, selectedProviderKeys, renderProviderForm]);

  useEffect(() => {
    if (activeTab.startsWith("provider:") && !providerTabs.some(({ key }) => activeTab === `provider:${key}`)) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, providerTabs]);

  const handleSkillSelectionChange = async (next: string[]) => {
    setDraft((current) => ({
      ...current,
      enabledSkillIds: next,
    }));
    setSkillFeedback(null);

    const added = next.filter((skillId) => !draft.enabledSkillIds.includes(skillId));
    if (added.length === 0) return;

    const results = await Promise.allSettled(
      added.filter((skillId) => !skillId.startsWith("mcp:"))
        .map((skillId) => skills.ensureDownloaded(skillId))
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
    //    void setTemperature?.(draft.temperature);
    setMaxOutputTokens(draft.maxOutputTokens);
    setStructuredOutputs(draft.structuredOutputs);
    setVerbosity(draft.verbosity);
    setThrottle(draft.throttle);
    setToolAnnotations(draft.toolAnnotations);
    setStopTools(draft.stopTools);
    setMaxToolCalls(draft.maxToolCalls);
    setToolChoice(draft.toolChoice);
    setActivePlugins(draft.activePlugins);
    setEnabledAgentPluginIds(draft.enabledAgentPluginIds);
    setEnabledLocalTools(draft.enabledLocalTools);
    setToolRequestConfig(draft.toolRequestConfig);
    setUseToolNamespaces(draft.useToolNamespaces);
    setEnabledSkillIds(draft.enabledSkillIds);
    if (isRealtime) {
      setLiveClientTarget(draft.liveClientTarget);
      if (hasRealtimeProviderConfig(realtimeProviderKey)) {
        const metadata = {
          ...(providerRealtimeConversationMetadata ?? {}),
          [realtimeProviderKey]: draft.providerRealtimeConversationMetadata[realtimeProviderKey]
            ?? (realtimeProviderKey === "spacexai" ? draft.providerRealtimeConversationMetadata.xai : undefined)
            ?? {},
        };
        if (realtimeProviderKey === "spacexai") delete metadata.xai;
        setProviderRealtimeConversationMetadata(metadata);
      }
    } else {
      setProviderMetadata(draft.providerMetadata);
      setProviderHeaders(draft.providerHeaders);
      setProviderFileMetadata(draft.providerFileMetadata);
    }
  }, [
    draft,
    isRealtime,
    realtimeProviderKey,
    providerRealtimeConversationMetadata,
    setProviderRealtimeConversationMetadata,
    setLiveClientTarget,
    setActivePlugins,
    setEnabledAgentPluginIds,
    setEnabledLocalTools,
    setToolRequestConfig,
    setUseToolNamespaces,
    setEnabledSkillIds,
    setProviderHeaders,
    setProviderFileMetadata,
    setMaxOutputTokens,
    setMaxToolCalls,
    setProviderMetadata,
    setStopTools,
    setStructuredOutputs,
    setVerbosity,
    //  setTemperature,
    setThrottle,
    setToolAnnotations,
    setToolChoice,
  ]);

  const restoreDraftDefaults = useCallback(() => {
    setDraft((current) => ({
      ...current,
      temperature: 1,
      verbosity: DEFAULT_CHAT_VERBOSITY,
      toolAnnotations: { ...DEFAULT_CHAT_TOOL_ANNOTATIONS },
      ...(isRealtime ? {
        liveClientTarget: undefined,
        providerRealtimeConversationMetadata: {
          ...current.providerRealtimeConversationMetadata,
          [realtimeProviderKey]: structuredClone(
            (defaultProviderRealtimeConversationMetadata as Record<string, any>)[realtimeProviderKey]
              ?? {}
          ),
        },
      } : {
        providerMetadata: { ...defaultProviderMetadata },
        providerFileMetadata: structuredClone(defaultProviderFileMetadata),
        providerHeaders: { ...defaultProviderHeaders },
      }),
      sideInferenceAgentNames: { ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION },
      toolRequestConfig: {},
      useToolNamespaces: false,
    }));

    setSkillFeedback(null);
  }, [isRealtime, realtimeProviderKey]);

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
              verbosity={draft.verbosity}
              setVerbosity={(value: ChatVerbosity) => {
                setDraft((current) => ({
                  ...current,
                  verbosity: value,
                }));
              }}
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
        <theme.Tab eventKey="tool-configuration" title={t("toolConfiguration.title") ?? "Tool configuration"}>
          {activeTab === "tool-configuration" ? (
            <ToolConfigurationTab
              tools={attachedTools}
              config={draft.toolRequestConfig}
              useNamespaces={draft.useToolNamespaces}
              onConfigChange={(value) => setDraft((current) => ({ ...current, toolRequestConfig: value }))}
              onUseNamespacesChange={(value) => setDraft((current) => ({ ...current, useToolNamespaces: value }))}
            />
          ) : null}
        </theme.Tab>
        <theme.Tab eventKey="skills" title={t("skills") ?? "Skills"}>
          {activeTab === "skills" ? (
            <>
              <ChatSkillsEditor
                value={draft.enabledSkillIds}
                onChange={(next) => {
                  void handleSkillSelectionChange(next);
                }}
                items={skills.items}
                mcpSkills={mcpSkills}
                favoriteSkillIds={favoriteSkillIds ?? []}
                remoteTitle={remoteSkillsHost}
              />
              {skillFeedback ? <theme.Text>{skillFeedback}</theme.Text> : null}
            </>
          ) : null}
        </theme.Tab>
        <theme.Tab eventKey="agent-plugins" title={t("pluginsPage.title") ?? "Plugins"}>
          {activeTab === "agent-plugins" ? (
            <ChatPluginsEditor
              items={plugins.items}
              value={draft.enabledAgentPluginIds}
              onChange={(value) => setDraft((current) => ({ ...current, enabledAgentPluginIds: value }))}
            />
          ) : null}
        </theme.Tab>
        {providerTabs.map(({ key, form }) => (
          <theme.Tab key={key} eventKey={`provider:${key}`} title={(PROVIDERS as Record<string, any>)[key]?.name || key}>
            {activeTab === `provider:${key}` ? (isRealtime ? form : <ProviderTabContent key={key} providerKey={key} form={form} fileSettings={{
              metadata: draft.providerFileMetadata,
              updateMetadata: (update) => setDraft((current) => ({
                ...current, providerFileMetadata: update(current.providerFileMetadata),
              })),
            }} />) : null}
          </theme.Tab>
        ))}
      </theme.Tabs>
    </theme.Modal>
  );
};
