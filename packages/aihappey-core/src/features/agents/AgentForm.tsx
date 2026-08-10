import { AnthropicChatConfigForm, BlackboxChatConfigForm, BrowserUseChatConfigForm, BraveChatConfigForm, ClientCapabilitiesForm, CohereChatConfigForm, CortecsChatConfigForm, DepazaChatConfigForm, GroqChatConfigForm, JinaChatConfigForm, LinkupChatConfigForm, MaritacaAIChatConfigForm, McpPolicySettings, MicrosoftChatConfigForm, MistralChatConfigForm, NinjaChatChatConfigForm, OpenAIChatConfigForm, OpenHandsChatConfigForm, OpenRouterChatConfigForm, PerplexityChatConfigForm, PoolsideChatConfigForm, PollinationsChatConfigForm, SambanovaChatConfigForm, TemboChatConfigForm, TogetherChatConfigForm, useTheme, XAIChatConfigForm, RequestyChatConfigForm, WebCrawlerAPIChatConfigForm, XiaomiMIMOChatConfigForm, ZaiChatConfigForm } from "aihappey-components";
import { VeniceChatConfigForm } from "aihappey-components/src/forms/providers/venice";
import { useTranslation } from "aihappey-i18n";
import { Agent, McpRegistryServerResponse, McpServer, ServerClientConfig } from "aihappey-types";
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
import { buildSkillMatchKey, buildStoredSkillMatchKey, createInlineAgentSkill, getInlineAgentSkillPayload, readInlineAgentSkillMetadata } from "./agentSkills";
import { useChatContext } from "../chat/context/ChatContext";
import { SkillToggleGroups } from "../skills/SkillToggleGroups";

const hostnameOf = (url?: string) => {
    if (!url) return "remote";
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
};

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
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
    const [selectedSkillPayloads, setSelectedSkillPayloads] = useState<Record<string, string>>({});
    const [initialPersistedSkills] = useState(() => agent.skills ?? []);
    const models = useAppStore((s) => s.models);
    const favoriteSkillIds = useAppStore((s: any) => s.favoriteSkillIds as string[] | undefined);
    const skills = useSkills();
    const skillItems = useMemo(
        () => skills.items.map((item) => ({
            id: item.skillId,
            label: `${item.name} (v${item.version ?? item.downloadedVersion ?? item.latestVersion})`,
            origin: item.origin,
            // description: item.description,
        })),
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
    // flatten all registry entries once
    const [showCatalog, setShowCatalog] = useState(false);
    const enrichedAgent = useAgent(agent)

    useEffect(() => {
        onBusyChange?.(skillSyncPending);
    }, [onBusyChange, skillSyncPending]);

    useEffect(() => {
        if (hasHydratedSkillSelection) return;

        let cancelled = false;

        const resolveSelectedSkillIds = async () => {
            const persistedSkills = initialPersistedSkills.filter((skill) => getInlineAgentSkillPayload(skill));
            if (persistedSkills.length === 0) {
                if (!cancelled) {
                    setSelectedSkillIds([]);
                    setSelectedSkillPayloads({});
                    setHasHydratedSkillSelection(true);
                }
                return;
            }

            const nextSelectedSkillIds: string[] = [];
            const nextSelectedSkillPayloads: Record<string, string> = {};
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

            for (const skill of persistedSkills) {
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

                    nextSelectedSkillIds.push(skillId);
                    nextSelectedSkillPayloads[skillId] = getInlineAgentSkillPayload(skill);
                } catch {
                    continue;
                }
            }

            if (cancelled) return;
            setSelectedSkillIds(nextSelectedSkillIds);
            setSelectedSkillPayloads(nextSelectedSkillPayloads);
            setHasHydratedSkillSelection(true);
        };

        void resolveSelectedSkillIds();

        return () => {
            cancelled = true;
        };
    }, [hasHydratedSkillSelection, initialPersistedSkills, skills.items, skills.read]);

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
        if (!server) return null;

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
                    disabled={server.disabled === true}
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
                    disabled={server.disabled === true}
                    checked={server.defer_loading === true}
                    onChange={(checked: boolean) => updateMcpServer(key, (current) => {
                        const { defer_loading: _, ...rest } = current;
                        return checked ? { ...rest, defer_loading: true } : rest as McpServer;
                    })}
                />
                <Switch
                    id={`agent-mcp-namespace-${key}`}
                    label={"Namespace"}
                    disabled={server.disabled === true}
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

    const handleSkillSelectionChange = async (next: string[]) => {
        setHasHydratedSkillSelection(true);
        setSkillFeedback(null);
        setSelectedSkillIds(next);
        setSkillSyncPending(true);

        const removed = selectedSkillIds.filter((skillId) => !next.includes(skillId));
        const removedPayloadCounts = new Map<string, number>();
        for (const skillId of removed) {
            const payload = selectedSkillPayloads[skillId];
            if (!payload) continue;
            removedPayloadCounts.set(payload, (removedPayloadCounts.get(payload) ?? 0) + 1);
        }

        const retainedSkills = (agent.skills ?? []).filter((skill) => {
            const payload = getInlineAgentSkillPayload(skill);
            const remaining = removedPayloadCounts.get(payload) ?? 0;
            if (remaining <= 0) return true;

            if (remaining === 1) {
                removedPayloadCounts.delete(payload);
            } else {
                removedPayloadCounts.set(payload, remaining - 1);
            }

            return false;
        });

        const added = next.filter((skillId) => !selectedSkillIds.includes(skillId));
        if (added.length === 0) {
            setSelectedSkillPayloads((current) => Object.fromEntries(
                Object.entries(current).filter(([skillId]) => next.includes(skillId))
            ));
            onChange({
                ...agent,
                skills: retainedSkills.length > 0 ? retainedSkills : undefined,
            });
            setSkillSyncPending(false);
            return;
        }

        try {
            const results = await Promise.allSettled(
                added.map(async (skillId) => {
                    const storedSkill = await skills.ensureDownloaded(skillId);
                    if (!storedSkill) {
                        throw new Error(`Could not download skill ${skillId}.`);
                    }

                    const archive = await skills.exportArchive(storedSkill.skillId);
                    if (!archive) {
                        throw new Error(`Could not load the skill archive for ${storedSkill.name}.`);
                    }

                    return {
                        skillId,
                        skill: await createInlineAgentSkill(storedSkill, archive.blob),
                    };
                })
            );

            const nextSkills = [...retainedSkills];
            const nextPayloads = Object.fromEntries(
                Object.entries(selectedSkillPayloads).filter(([skillId]) => next.includes(skillId))
            );

            for (const result of results) {
                if (result.status !== "fulfilled") continue;

                nextSkills.push(result.value.skill);
                nextPayloads[result.value.skillId] = getInlineAgentSkillPayload(result.value.skill);
            }

            setSelectedSkillPayloads(nextPayloads);

            onChange({
                ...agent,
                skills: nextSkills.length > 0 ? nextSkills : undefined,
            });

            const failed = results.filter((result) => result.status === "rejected").length;
            if (failed > 0) {
                setSkillFeedback(
                    failed === 1
                        ? (t("skillsPage.remoteDownloadFailed") ?? "A remote skill could not be downloaded right now. It will retry on first use.")
                        : (t("skillsPage.remoteDownloadFailedMany", { count: failed }) ??
                            `${failed} remote skills could not be downloaded right now. They will retry on first use.`)
                );
            }
        } finally {
            setSkillSyncPending(false);
        }
    }

    const providerKey = getAgentModelProviderKey(agent?.model?.id);
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
                            <SkillToggleGroups
                                value={selectedSkillIds}
                                onChange={(next) => {
                                    void handleSkillSelectionChange(next);
                                }}
                                columns={2}
                                items={skillItems}
                                favoriteSkillIds={favoriteSkillIds ?? []}
                                remoteTitle={remoteSkillsHost}
                            />
                            {skillFeedback ? <Text>{skillFeedback}</Text> : null}
                        </>
                    ) : null}
                </Tab>

                {/* ---------------- Provider Settings ---------------- */}
                <Tab eventKey="providers"
                    title={providerKey}>
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

                    {providerKey === "maritacaai" && (
                        <MaritacaAIChatConfigForm
                            config={providerMeta}
                            updateConfig={updateProviderMetadata}
                        />
                    )}

                    {providerKey === "microsoft" && (
                        <MicrosoftChatConfigForm
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
