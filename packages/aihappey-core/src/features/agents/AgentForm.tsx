import {
    AnthropicChatConfigForm, BlackboxChatConfigForm, BrowserUseChatConfigForm,
    BraveChatConfigForm, ClientCapabilitiesForm, CohereChatConfigForm,
    CortecsChatConfigForm, DeepSeekChatConfigForm, DepazaChatConfigForm, GroqChatConfigForm,
    InworldChatConfigForm, InterfazeChatConfigForm, JinaChatConfigForm, LinkupChatConfigForm,
    LocalToolsSettingsForm, MaritacaAIChatConfigForm, McpPolicySettings,
    CopilotChatConfigForm,
    MistralChatConfigForm, NinjaChatChatConfigForm, OpenAIChatConfigForm,
    OpenHandsChatConfigForm, OpenRouterChatConfigForm, PerplexityChatConfigForm,
    PoolsideChatConfigForm, PollinationsChatConfigForm, SambanovaChatConfigForm,
    TemboChatConfigForm, TogetherChatConfigForm, useTheme, XAIChatConfigForm,
    RequestyChatConfigForm, WebCrawlerAPIChatConfigForm, XiaomiMIMOChatConfigForm,
    ZaiChatConfigForm
} from "aihappey-components";
import { VeniceChatConfigForm } from "aihappey-components/src/forms/providers/venice";
import { useTranslation } from "aihappey-i18n";
import { Agent, McpRegistryServerResponse, McpServer, ServerClientConfig, type AgentPluginFile, type Skill as AgentSkill } from "aihappey-types";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import {
    getAgentModelProviderKey,
    resolveAgentModelProviderHeaders,
    resolveAgentModelProviderMetadata,
    useAppStore,
} from "aihappey-state";
import { ModelSelect } from "../models/ModelSelect";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ServerManagement } from "aihappey-components";
import { ServerCatalogModal } from "../mcp-catalog/ServerCatalogModal";
import { useAgent } from "./useAgentMcpServers";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";
import {
    buildOpenAISkillOptions,
    createOpenAIShellSkillResolver,
} from "../provider-config/openai/openAISkillOptions";
import { useSkills } from "aihappey-skills";
import { AGENT_SKILL_DEFAULT_VERSION, AGENT_SKILL_LATEST_VERSION, buildSkillMatchKey, buildStoredSkillMatchKey, createAgentSkillReference, createInlineAgentSkill, getInlineAgentSkillPayload, isAgentSkillReference, readInlineAgentSkillMetadata, resolveInlineSkillVersion } from "./agentSkills";
import { useChatContext } from "../chat/context/ChatContext";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { AgentSkillsEditor, type AgentSkillEditorValue, type AgentSkillMode } from "./AgentSkillsEditor";
import { usePlugins } from "aihappey-plugins";
import { ChatPluginsEditor } from "../chat-settings/ChatPluginsEditor";
import { createEmbeddedAgentPlugin, getEmbeddedAgentPluginPayload, readEmbeddedAgentPluginName } from "./agentPlugins";
import { useStructuredOutputs } from "aihappey-structured-outputs";
import { toValidSchemaName } from "../chat-settings/GeneralTab";

const AGENT_TOOL_SEARCH_TYPE = "tool_search";
const AGENT_TOOL_SEARCH_TOGGLE_ID = "client-tool-search";
const AGENT_RESOURCE_SEARCH_TYPE = "resource_search";
const AGENT_RESOURCE_SEARCH_TOGGLE_ID = "client-resource-search";

export interface AgentFormProps {
    agent: Agent;
    onChange: Dispatch<SetStateAction<Agent>>;
    isEditing: boolean;
    onBusyChange?: (busy: boolean) => void;
}

export const AgentForm = ({
    agent,
    isEditing,
    onChange,
    onBusyChange }: AgentFormProps) => {
    const { Input, TextArea, Tabs, Tab, Button, Text, Select, Switch } = useTheme();
    const { t } = useTranslation();
    const { config: chatConfig } = useChatContext();
    const [activeTab, setActiveTab] = useState("general");
    const [skillFeedback, setSkillFeedback] = useState<string | null>(null);
    const [skillSyncPending, setSkillSyncPending] = useState(false);
    const [hasHydratedSkillSelection, setHasHydratedSkillSelection] = useState(false);
    const [selectedSkillPayloads, setSelectedSkillPayloads] = useState<Record<string, string>>({});
    const [skillEditorValues, setSkillEditorValues] = useState<Record<string, AgentSkillEditorValue>>({});
    const [pendingSkillIds, setPendingSkillIds] = useState<string[]>([]);
    const [initialPersistedSkills] = useState(() => agent.skills ?? []);
    const [pluginFeedback, setPluginFeedback] = useState<string | null>(null);
    const [hasHydratedPluginSelection, setHasHydratedPluginSelection] = useState(false);
    const [selectedPluginPayloads, setSelectedPluginPayloads] = useState<Record<string, string>>({});
    const [pendingPluginIds, setPendingPluginIds] = useState<string[]>([]);
    const [initialPersistedPlugins] = useState(() => agent.plugins ?? []);
    const models = useAppStore((s) => s.models);
    const favoriteSkillIds = useAppStore((s: any) => s.favoriteSkillIds as string[] | undefined);
    const skills = useSkills();
    const plugins = usePlugins();
    const structuredOutputsStore = useStructuredOutputs();
    const structuredOutputOptions = useMemo(
        () => (structuredOutputsStore.items ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
        [structuredOutputsStore.items]
    );
    const selectedStructuredOutputId = useMemo(() => {
        const current = agent.responseFormat?.json_schema;
        if (!current) return "";

        return structuredOutputOptions.find((item) => {
            if (toValidSchemaName(item.name) !== current.name) return false;
            try {
                return JSON.stringify(JSON.parse(item.json_schema)) === JSON.stringify(current.schema);
            } catch {
                return false;
            }
        })?.id ?? "";
    }, [agent.responseFormat, structuredOutputOptions]);
    const openAISkillOptions = useMemo(
        () => buildOpenAISkillOptions(skills.items ?? []),
        [skills.items]
    );
    const resolveOpenAIShellSkill = useMemo(
        () => createOpenAIShellSkillResolver(skills, openAISkillOptions),
        [openAISkillOptions, skills]
    );
    // flatten all registry entries once
    const [showCatalog, setShowCatalog] = useState(false);
    const enrichedAgent = useAgent(agent)

    useEffect(() => {
        const busy = skillSyncPending || pendingSkillIds.length > 0 || pendingPluginIds.length > 0;
        onBusyChange?.(busy);
    }, [onBusyChange, pendingPluginIds.length, pendingSkillIds.length, skillSyncPending]);

    useEffect(() => {
        if (hasHydratedSkillSelection) return;

        let cancelled = false;

        const hydrateSkillEditor = async () => {
            const persistedInlineSkills = initialPersistedSkills.filter((skill) => getInlineAgentSkillPayload(skill));
            const nextSelectedSkillPayloads: Record<string, string> = {};
            const nextEditorValues: Record<string, AgentSkillEditorValue> = {};
            const downloadedCatalogItems = skills.items.filter((entry) => entry.isDownloaded);
            const downloadedSkills = await Promise.all(
                downloadedCatalogItems.map(async (item) => ({
                    skillId: item.skillId,
                    storedSkill: await skills.read(item.skillId),
                }))
            );
            const skillIdsByMatchKey = new Map<string, string[]>();

            for (const downloaded of downloadedSkills) {
                if (!downloaded.storedSkill) continue;

                const key = buildStoredSkillMatchKey(downloaded.storedSkill);
                const current = skillIdsByMatchKey.get(key) ?? [];
                skillIdsByMatchKey.set(key, [...current, downloaded.skillId]);
            }

            for (const skill of initialPersistedSkills) {
                if (!isAgentSkillReference(skill)) continue;
                const item = skills.items.find((candidate) => candidate.skillId === skill.skill_id);
                if (!item) continue;
                nextEditorValues[item.skillId] = {
                    enabled: true,
                    mode: "reference",
                    version: skill.version ?? AGENT_SKILL_DEFAULT_VERSION,
                };
            }

            for (const skill of persistedInlineSkills) {
                try {
                    const metadata = await readInlineAgentSkillMetadata(skill);
                    const directSkillId = String(metadata?.skillId ?? "").trim();
                    const directMatch = skills.items.some((item) => item.skillId === directSkillId)
                        ? directSkillId
                        : "";
                    const fallbackMatchKey = buildSkillMatchKey(metadata);
                    const fallbackSkillIds = skillIdsByMatchKey.get(fallbackMatchKey) ?? [];
                    const fallbackSkillId = fallbackSkillIds.shift() ?? "";

                    if (fallbackSkillIds.length > 0) {
                        skillIdsByMatchKey.set(fallbackMatchKey, fallbackSkillIds);
                    } else {
                        skillIdsByMatchKey.delete(fallbackMatchKey);
                    }

                    const skillId = directMatch || fallbackSkillId;
                    if (!skillId) continue;

                    nextSelectedSkillPayloads[skillId] = getInlineAgentSkillPayload(skill);
                    nextEditorValues[skillId] = {
                        enabled: true,
                        mode: "inline",
                        version: String(metadata?.version ?? AGENT_SKILL_DEFAULT_VERSION),
                    };
                } catch {
                    continue;
                }
            }

            if (cancelled) return;
            setSelectedSkillPayloads(nextSelectedSkillPayloads);
            setSkillEditorValues(nextEditorValues);
            setHasHydratedSkillSelection(true);
        };

        void hydrateSkillEditor();

        return () => {
            cancelled = true;
        };
    }, [hasHydratedSkillSelection, initialPersistedSkills, skills.items, skills.read]);

    useEffect(() => {
        if (hasHydratedPluginSelection) return;

        let cancelled = false;
        const hydratePluginEditor = async () => {
            const entries = await Promise.all(initialPersistedPlugins.map(async (plugin) => ({
                name: await readEmbeddedAgentPluginName(plugin),
                payload: getEmbeddedAgentPluginPayload(plugin),
            })));
            if (cancelled) return;

            const payloads: Record<string, string> = {};
            for (const entry of entries) {
                if (entry.name && entry.payload) payloads[entry.name] = entry.payload;
            }
            setSelectedPluginPayloads(payloads);
            setHasHydratedPluginSelection(true);
        };

        void hydratePluginEditor();
        return () => { cancelled = true; };
    }, [hasHydratedPluginSelection, initialPersistedPlugins]);

    const toggle = (key: string) => {
        const servers = agent.mcpServers ?? {}

        const server = servers[key]
        if (!server) return

        onChange({
            ...agent,
            mcpServers: {
                ...servers,
                [key]: {
                    ...server,
                    disabled: !server.disabled
                }
            }
        })
    }

    type McpToolCaller = "direct" | "programmatic";
    const mcpToolCallers: McpToolCaller[] = ["direct", "programmatic"];

    const updateMcpServer = (key: string, update: (server: McpServer) => McpServer) => {
        const servers = agent.mcpServers ?? {};
        const server = servers[key];
        if (!server) return;

        onChange({
            ...agent,
            mcpServers: {
                ...servers,
                [key]: update(server),
            },
        });
    };

    const renderMcpServerSettings = (key: string) => {
        const server = agent.mcpServers?.[key];
        if (!server || server.disabled === true) return null;

        const callers = (server.allowed_callers ?? [])
            .filter((caller): caller is McpToolCaller => mcpToolCallers.includes(caller as McpToolCaller));

        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(180px, 1fr) auto auto",
                alignItems: "end",
                gap: 16,
                marginTop: 16,
            }}>
                <Select
                    label={t("toolConfiguration.allowedCallers")}
                    multiselect
                    values={callers}
                    valueTitle={callers.length
                        ? callers.map((caller) => t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${caller}`)).join(", ")
                        : ""}
                    options={mcpToolCallers.map((caller) => ({
                        value: caller,
                        label: t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${caller}`),
                    }))}
                    onChange={(caller: McpToolCaller) => {
                        const next = callers.includes(caller)
                            ? callers.filter((value) => value !== caller)
                            : [...callers, caller];
                        updateMcpServer(key, (current) => {
                            const { allowed_callers: _, ...rest } = current;
                            return next.length ? { ...rest, allowed_callers: next } : rest as McpServer;
                        });
                    }}
                >
                    {mcpToolCallers.map((caller) => (
                        <option key={caller} value={caller}>
                            {t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${caller}`)}
                        </option>
                    ))}
                </Select>
                <Switch
                    id={`agent-mcp-defer-loading-${key}`}
                    label={t("toolConfiguration.deferLoading")}
                    checked={server.defer_loading === true}
                    onChange={(checked: boolean) => updateMcpServer(key, (current) => {
                        const { defer_loading: _, ...rest } = current;
                        return checked ? { ...rest, defer_loading: true } : rest as McpServer;
                    })}
                />
                <Switch
                    id={`agent-mcp-namespace-${key}`}
                    label={"Namespace"}
                    checked={server.namespace === true}
                    onChange={(checked: boolean) => updateMcpServer(key, (current) => {
                        const { namespace: _, ...rest } = current;
                        return checked ? { ...rest, namespace: true } : rest as McpServer;
                    })}
                />
            </div>
        );
    };

    const installFromCatalog = (item: McpRegistryServerResponse) => {
        const remote = item.server.remotes?.find(r => r.type === "streamable-http")
        if (!remote) return

        const key = item.server.name.toLowerCase()

        const servers = agent.mcpServers ?? {}
        if (servers[key]) return

        onChange({
            ...agent,
            mcpServers: {
                ...servers,
                [key]: {
                    type: "http",
                    url: remote.url,
                    disabled: true // catalog installs disabled by default
                }
            }
        })
    }

    const uninstallFromCatalog = (item: McpRegistryServerResponse) => {
        const key = item.server.name.toLowerCase()

        const servers = agent.mcpServers
        if (!servers || !servers[key]) return

        const { [key]: _, ...rest } = servers

        onChange({
            ...agent,
            mcpServers: rest
        })
    }

    const remove = (key: string) => {
        const servers = agent.mcpServers
        if (!servers || !servers[key]) return

        const { [key]: _, ...rest } = servers

        onChange({
            ...agent,
            mcpServers: rest
        })
    }

    const removeMatchingConfiguredSkill = (configured: AgentSkill[], skillId: string) => {
        const payload = selectedSkillPayloads[skillId];
        return configured.filter((skill) => {
            if (isAgentSkillReference(skill)) return skill.skill_id !== skillId;
            return !payload || getInlineAgentSkillPayload(skill) !== payload;
        });
    };

    const persistConfiguredSkill = (skillId: string, nextSkill?: AgentSkill) => {
        onChange((current) => {
            const retained = removeMatchingConfiguredSkill(current.skills ?? [], skillId);
            const nextSkills = nextSkill ? [...retained, nextSkill] : retained;
            return { ...current, skills: nextSkills.length ? nextSkills : undefined };
        });
    };

    const setSkillPending = (skillId: string, pending: boolean) => {
        setPendingSkillIds((current) => pending
            ? Array.from(new Set([...current, skillId]))
            : current.filter((id) => id !== skillId));
    };

    const createInlineSkillForVersion = async (skillId: string, selectedVersion: string) => {
        const item = skills.items.find((candidate) => candidate.skillId === skillId);
        if (!item) throw new Error(`Unknown skill ${skillId}.`);
        const concreteVersion = resolveInlineSkillVersion(selectedVersion, item);
        const storedSkill = await skills.ensureDownloaded(skillId, concreteVersion);
        if (!storedSkill) throw new Error(`Could not download skill ${skillId}.`);
        const archive = await skills.exportArchive(storedSkill.skillId);
        if (!archive) throw new Error(`Could not load the skill archive for ${storedSkill.name}.`);
        return createInlineAgentSkill(storedSkill, archive.blob);
    };

    const showSkillError = () => setSkillFeedback(
        t("skillsPage.remoteDownloadFailed") ?? "A skill version could not be downloaded right now."
    );

    const handleSkillToggle = async (skillId: string, enabled: boolean) => {
        const item = skills.items.find((candidate) => candidate.skillId === skillId);
        if (!item) return;
        setSkillFeedback(null);
        if (!enabled) {
            setSkillEditorValues((current) => ({
                ...current,
                [skillId]: { ...(current[skillId] ?? { mode: "inline", version: AGENT_SKILL_DEFAULT_VERSION }), enabled: false },
            }));
            persistConfiguredSkill(skillId);
            setSelectedSkillPayloads((current) => {
                const { [skillId]: _, ...rest } = current;
                return rest;
            });
            return;
        }

        const mode: AgentSkillMode = item.origin === "remote" ? "reference" : "inline";
        const version = item.origin === "remote" ? AGENT_SKILL_LATEST_VERSION : AGENT_SKILL_DEFAULT_VERSION;
        setSkillEditorValues((current) => ({ ...current, [skillId]: { enabled: true, mode, version } }));
        if (mode === "reference") {
            persistConfiguredSkill(skillId, createAgentSkillReference(skillId, version));
            return;
        }

        setSkillPending(skillId, true);
        try {
            const inlineSkill = await createInlineSkillForVersion(skillId, version);
            setSelectedSkillPayloads((current) => ({ ...current, [skillId]: getInlineAgentSkillPayload(inlineSkill) }));
            persistConfiguredSkill(skillId, inlineSkill);
        } catch {
            setSkillEditorValues((current) => ({ ...current, [skillId]: { ...current[skillId], enabled: false } }));
            showSkillError();
        } finally {
            setSkillPending(skillId, false);
        }
    };

    const handleSkillModeChange = async (skillId: string, mode: AgentSkillMode) => {
        const currentValue = skillEditorValues[skillId];
        if (!currentValue?.enabled || currentValue.mode === mode) return;
        setSkillFeedback(null);
        setSkillEditorValues((current) => ({ ...current, [skillId]: { ...currentValue, mode } }));
        if (mode === "reference") {
            persistConfiguredSkill(skillId, createAgentSkillReference(skillId, currentValue.version));
            setSelectedSkillPayloads((current) => {
                const { [skillId]: _, ...rest } = current;
                return rest;
            });
            return;
        }

        setSkillPending(skillId, true);
        try {
            const inlineSkill = await createInlineSkillForVersion(skillId, currentValue.version);
            setSelectedSkillPayloads((current) => ({ ...current, [skillId]: getInlineAgentSkillPayload(inlineSkill) }));
            persistConfiguredSkill(skillId, inlineSkill);
        } catch {
            setSkillEditorValues((current) => ({ ...current, [skillId]: currentValue }));
            showSkillError();
        } finally {
            setSkillPending(skillId, false);
        }
    };

    const handleSkillVersionChange = async (skillId: string, version: string) => {
        const currentValue = skillEditorValues[skillId];
        if (!currentValue?.enabled || currentValue.version === version) return;
        setSkillFeedback(null);
        setSkillEditorValues((current) => ({ ...current, [skillId]: { ...currentValue, version } }));
        if (currentValue.mode === "reference") {
            persistConfiguredSkill(skillId, createAgentSkillReference(skillId, version));
            return;
        }

        setSkillPending(skillId, true);
        try {
            const inlineSkill = await createInlineSkillForVersion(skillId, version);
            setSelectedSkillPayloads((current) => ({ ...current, [skillId]: getInlineAgentSkillPayload(inlineSkill) }));
            persistConfiguredSkill(skillId, inlineSkill);
        } catch {
            setSkillEditorValues((current) => ({ ...current, [skillId]: currentValue }));
            showSkillError();
        } finally {
            setSkillPending(skillId, false);
        }
    };

    const persistConfiguredPlugin = (pluginId: string, nextPlugin?: AgentPluginFile) => {
        onChange((current) => {
            const previousPayload = selectedPluginPayloads[pluginId];
            const retained = (current.plugins ?? []).filter((plugin) =>
                !previousPayload || getEmbeddedAgentPluginPayload(plugin) !== previousPayload);
            const nextPlugins = nextPlugin ? [...retained, nextPlugin] : retained;
            return { ...current, plugins: nextPlugins.length ? nextPlugins : undefined };
        });
    };

    const setPluginPending = (pluginId: string, pending: boolean) => {
        setPendingPluginIds((current) => pending
            ? Array.from(new Set([...current, pluginId]))
            : current.filter((id) => id !== pluginId));
    };

    const handlePluginToggle = async (pluginId: string, enabled: boolean) => {
        setPluginFeedback(null);
        if (!enabled) {
            persistConfiguredPlugin(pluginId);
            setSelectedPluginPayloads((current) => {
                const { [pluginId]: _, ...rest } = current;
                return rest;
            });
            return;
        }

        setPluginPending(pluginId, true);
        try {
            const archive = await plugins.exportArchive(pluginId);
            if (!archive) throw new Error(`Could not export plugin ${pluginId}.`);
            const embedded = await createEmbeddedAgentPlugin(archive.blob);
            persistConfiguredPlugin(pluginId, embedded);
            setSelectedPluginPayloads((current) => ({
                ...current,
                [pluginId]: embedded.data,
            }));
        } catch {
            setPluginFeedback(t("pluginsPage.saveFailed") ?? "The plugin snapshot could not be created.");
        } finally {
            setPluginPending(pluginId, false);
        }
    };

    const providerKey = getAgentModelProviderKey(agent?.model?.id);
    const providerTitle = (PROVIDERS as Record<string, { name?: string }>)[providerKey]?.name ?? providerKey;
    const providerMeta = agent?.model?.providerMetadata ?? {};
    const providerHeaders = agent?.model?.providerHeaders ?? {};
    const updateProviderMetadata = (providerMetadata: any) =>
        onChange((current) => ({
            ...current,
            model: {
                ...current.model,
                providerMetadata,
            },
        }));
    const updateProviderHeaders = (headers: Record<string, string> | undefined) =>
        onChange((current) => ({
            ...current,
            model: {
                ...current.model,
                providerHeaders: headers && Object.keys(headers).length ? headers : undefined,
            },
        }));

    const enabled = new Set(Object.entries(agent.mcpServers ?? {})
        .filter(a => a[1].disabled !== true)
        .map(a => a[0]))

    const mapToServerConfig = (
        items: {
            key: string
            server: McpServer
            registry?: McpRegistryServerResponse
        }[]
    ): Record<
        string,
        { config: ServerClientConfig; registry?: McpRegistryServerResponse }
    > =>
        items.reduce((acc, { key, server, registry }) => {
            acc[key] = {
                config: {
                    type: "http",
                    url: server.url,
                    disabled: server.disabled,
                    headers: server.headers
                },
                registry
            }
            return acc
        }, {} as Record<string, { config: ServerClientConfig; registry?: McpRegistryServerResponse }>)


    return (
        <>
            <Tabs
                activeKey={activeTab}
                onSelect={setActiveTab}
                style={{ minHeight: 320 }}
            >
                <Tab eventKey="general" title={t("general")}>
                    <Input label={t('agentEdit.name')}
                        placeholder={t('agentEdit.namePlaceholder')}
                        value={agent.name}
                        required
                        disabled={isEditing}
                        onChange={(v) =>
                            onChange({ ...agent, name: v.target.value })
                        }
                    />
                    <Input label={t('agentEdit.description')}
                        placeholder={t('agentEdit.descriptionPlaceholder')}
                        value={agent.description}
                        required
                        onChange={(v) =>
                            onChange({ ...agent, description: v.target.value })
                        }
                    />
                    <ModelSelect
                        models={models ?? []}
                        label={t('model')}
                        value={agent.model?.id ?? ""}
                        onChange={(id) =>
                            onChange({
                                ...agent,
                                model: {
                                    ...(agent.model ?? {}),
                                    id,
                                    providerMetadata: resolveAgentModelProviderMetadata({
                                        previousModelId: agent.model?.id,
                                        nextModelId: id,
                                        previousProviderMetadata: agent.model?.providerMetadata,
                                    }),
                                    providerHeaders: resolveAgentModelProviderHeaders({
                                        previousModelId: agent.model?.id,
                                        nextModelId: id,
                                        previousProviderMetadata: agent.model?.providerMetadata,
                                        previousProviderHeaders: agent.model?.providerHeaders,
                                    }),
                                },
                            })
                        }
                    />
                    <TextArea label={t('instructions')}
                        placeholder={t('agentEdit.instructionsPlaceholder')}
                        value={agent.instructions}
                        required
                        rows={5}
                        onChange={(v: string) =>
                            onChange({ ...agent, instructions: v })
                        }
                    />
                    <Input label={t('agentEdit.argumentHint')}
                        placeholder={t('agentEdit.argumentHintPlaceholder')}
                        value={agent.argumentHint}
                        onChange={(v) =>
                            onChange({ ...agent, argumentHint: v.target.value })
                        }
                    />
                    <Select
                        label={t("structuredOutputs")}
                        values={[selectedStructuredOutputId]}
                        valueTitle={
                            structuredOutputOptions.find((item) => item.id === selectedStructuredOutputId)?.name
                            ?? t("providerDefault")
                        }
                        options={[
                            { value: "", label: t("providerDefault") },
                            ...structuredOutputOptions.map((item) => ({ value: item.id, label: item.name })),
                        ]}
                        onChange={(selectedValue: string) => {
                            if (!selectedValue) {
                                onChange({ ...agent, responseFormat: undefined });
                                return;
                            }

                            const selected = structuredOutputOptions.find((item) => item.id === selectedValue);
                            if (!selected) return;

                            try {
                                onChange({
                                    ...agent,
                                    responseFormat: {
                                        type: "json_schema",
                                        json_schema: {
                                            name: toValidSchemaName(selected.name),
                                            schema: JSON.parse(selected.json_schema),
                                        },
                                    },
                                });
                            } catch {
                                onChange({ ...agent, responseFormat: undefined });
                            }
                        }}
                    >
                        <option value="">{t("providerDefault")}</option>
                        {structuredOutputOptions.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </Select>

                    <div style={{ marginTop: 12 }}>
                        <McpPolicySettings
                            policySettings={agent.mcpClient?.policy}
                            toggle={(meta: keyof ToolAnnotations) => {
                                const current = agent.mcpClient?.policy?.[meta] ?? false;

                                onChange({
                                    ...agent,
                                    mcpClient: {
                                        ...agent.mcpClient,
                                        policy: {
                                            ...agent.mcpClient?.policy,
                                            [meta]: !current,
                                        },
                                    },
                                });
                            }}
                        />
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <ClientCapabilitiesForm
                            capabilities={agent.mcpClient?.capabilities}
                            onChange={(key, value) => {
                                onChange({
                                    ...agent,
                                    mcpClient: {
                                        ...(agent.mcpClient ?? {}),
                                        capabilities: {
                                            ...(agent.mcpClient?.capabilities ?? {}),
                                            [key]: value,
                                        },
                                    },
                                });
                            }}
                        />
                    </div>
                </Tab>

                {/* ---------------- Model Context ---------------- */}
                {isEditing && <Tab
                    eventKey="modelContext"
                    title={t("serverSelectModal.title")}>
                    <ServerManagement
                        enabled={enabled}
                        onToggle={toggle}
                        mcpServers={mapToServerConfig(enrichedAgent?.mcpServers)}
                        renderServerSettings={renderMcpServerSettings}
                        onRemove={remove} />
                    <Button
                        icon="catalog"
                        variant="subtle"
                        onClick={() => setShowCatalog(true)}
                    >
                        {t("manageServersModal.catalog")}
                    </Button>

                </Tab>}

                <Tab eventKey="skills" title={t("skills") ?? "Skills"}>
                    {activeTab === "skills" ? (
                        <>
                            <AgentSkillsEditor
                                items={skills.items}
                                favoriteSkillIds={favoriteSkillIds ?? []}
                                values={skillEditorValues}
                                disabledSkillIds={pendingSkillIds}
                                listVersions={async (skillId) => {
                                    const data = [];
                                    let after: string | undefined;
                                    do {
                                        const page = await skills.versions.list(skillId, { limit: 100, after });
                                        data.push(...page.data);
                                        after = page.has_more ? page.last_id : undefined;
                                    } while (after);
                                    return { data };
                                }}
                                onToggle={(skillId, enabled) => { void handleSkillToggle(skillId, enabled); }}
                                onModeChange={(skillId, mode) => { void handleSkillModeChange(skillId, mode); }}
                                onVersionChange={(skillId, version) => { void handleSkillVersionChange(skillId, version); }}
                            />
                            {skillFeedback ? <Text>{skillFeedback}</Text> : null}
                        </>
                    ) : null}
                </Tab>

                <Tab eventKey="agent-plugins" title={t("pluginsPage.title") ?? "Plugins"}>
                    {activeTab === "agent-plugins" ? (
                        <>
                            <ChatPluginsEditor
                                items={plugins.items}
                                value={Object.keys(selectedPluginPayloads)}
                                disabledIds={pendingPluginIds}
                                onChange={(next) => {
                                    const current = Object.keys(selectedPluginPayloads);
                                    const added = next.find((id) => !current.includes(id));
                                    const removed = current.find((id) => !next.includes(id));
                                    if (added) void handlePluginToggle(added, true);
                                    else if (removed) void handlePluginToggle(removed, false);
                                }}
                            />
                            {pluginFeedback ? <Text>{pluginFeedback}</Text> : null}
                        </>
                    ) : null}
                </Tab>

                <Tab eventKey="tools" title={t("tools") ?? "Tools"}>
                    <LocalToolsSettingsForm
                        formTitle={t("tools") ?? "Tools"}
                        items={[
                            {
                                id: AGENT_TOOL_SEARCH_TOGGLE_ID,
                                label: t("plugins.client-tool-search") ?? "Tool search",
                            },
                            {
                                id: AGENT_RESOURCE_SEARCH_TOGGLE_ID,
                                label: t("plugins.client-resource-search") ?? "Resource search",
                            },
                        ]}
                        value={[
                            ...((agent.tools ?? []).some((tool) => tool?.type === AGENT_TOOL_SEARCH_TYPE)
                                ? [AGENT_TOOL_SEARCH_TOGGLE_ID]
                                : []),
                            ...((agent.tools ?? []).some((tool) => tool?.type === AGENT_RESOURCE_SEARCH_TYPE)
                                ? [AGENT_RESOURCE_SEARCH_TOGGLE_ID]
                                : []),
                        ]}
                        onChange={(value) => {
                            const toolSearchEnabled = value.includes(AGENT_TOOL_SEARCH_TOGGLE_ID);
                            const resourceSearchEnabled = value.includes(AGENT_RESOURCE_SEARCH_TOGGLE_ID);
                            const remainingTools = (agent.tools ?? [])
                                .filter((tool) => tool?.type !== AGENT_TOOL_SEARCH_TYPE
                                    && tool?.type !== AGENT_RESOURCE_SEARCH_TYPE);
                            const searchTools = [
                                ...(toolSearchEnabled ? [{ type: AGENT_TOOL_SEARCH_TYPE }] : []),
                                ...(resourceSearchEnabled ? [{ type: AGENT_RESOURCE_SEARCH_TYPE }] : []),
                            ];
                            const tools = [...remainingTools, ...searchTools];

                            onChange({
                                ...agent,
                                tools: tools.length ? tools : undefined,
                            });
                        }}
                    />
                </Tab>

                {/* ---------------- Provider Settings ---------------- */}
                <Tab eventKey="providers"
                    title={providerTitle}>
                    {providerKey === "openai" && (
                        <OpenAIChatConfigForm
                            config={providerMeta}
                            headers={providerHeaders}
                            openAISkillOptions={openAISkillOptions}
                            resolveOpenAIShellSkill={resolveOpenAIShellSkill}
                            updateConfig={updateProviderMetadata}
                            updateHeaders={updateProviderHeaders}
                        />
                    )}

                    {providerKey === "openhands" && (
                        <OpenHandsChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "openrouter" && (
                        <OpenRouterChatConfigForm
                            config={providerMeta}
                            headers={providerHeaders}
                            appTitle={chatConfig?.appName}
                            updateConfig={updateProviderMetadata}
                            updateHeaders={updateProviderHeaders}
                        />
                    )}

                    {providerKey === "requesty" && (
                        <RequestyChatConfigForm
                            config={providerMeta}
                            headers={providerHeaders}
                            appTitle={chatConfig?.appName}
                            updateConfig={updateProviderMetadata}
                            updateHeaders={updateProviderHeaders}
                        />
                    )}

                    {providerKey === "blackbox" && (
                        <BlackboxChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "anthropic" && (
                        <AnthropicChatConfigForm
                            config={providerMeta}
                            headers={providerHeaders}
                            updateConfig={updateProviderMetadata}
                            updateHeaders={updateProviderHeaders}
                        />
                    )}

                    {providerKey === "cohere" && (
                        <CohereChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "cortecs" && (
                        <CortecsChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "depaza" && (
                        <DepazaChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "browseruse" && (
                        <BrowserUseChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "brave" && (
                        <BraveChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "deepseek" && (
                        <DeepSeekChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "google" && (
                        <GoogleChatConfig
                            google={providerMeta}
                            updateGoogle={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "groq" && (
                        <GroqChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "jina" && (
                        <JinaChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "mistral" && (
                        <MistralChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "inworld" && (
                        <InworldChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "interfaze" && (
                        <InterfazeChatConfigForm
                            config={providerMeta}
                            headers={providerHeaders}
                            updateConfig={updateProviderMetadata}
                            updateHeaders={updateProviderHeaders}
                        />
                    )}

                    {providerKey === "maritacaai" && (
                        <MaritacaAIChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "copilot" && (
                        <CopilotChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "ninjachat" && (
                        <NinjaChatChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "perplexity" && (
                        <PerplexityChatConfigForm
                            config={providerMeta}
                            models={models}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "pollinations" && (
                        <PollinationsChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "poolside" && (
                        <PoolsideChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "together" && (
                        <TogetherChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "sambanova" && (
                        <SambanovaChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "tembo" && (
                        <TemboChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "spacexai" && (
                        <XAIChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "xiaomimimo" && (
                        <XiaomiMIMOChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "zai" && (
                        <ZaiChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "venice" && (
                        <VeniceChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "linkup" && (
                        <LinkupChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "webcrawlerapi" && (
                        <WebCrawlerAPIChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}
                </Tab>

            </Tabs>
            <ServerCatalogModal
                show={showCatalog}
                onHide={() => setShowCatalog(false)}
                installedServerKeys={Object.keys(agent.mcpServers ?? {})}
                addMcpServer={installFromCatalog}
                removeMcpServer={uninstallFromCatalog}
            />

        </>
    );
};
