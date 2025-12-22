import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { Agent, McpRegistryServerResponse, McpServer, ServerClientConfig } from "aihappey-types";
import { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { useAppStore } from "aihappey-state";
import { ModelSelect } from "../models/ModelSelect";
import { useState } from "react";
import { AnthropicTab } from "../provider-config/AnthropicTab";
import { OpenAITab } from "../provider-config/OpenAITab";
import { ServerManagement } from "aihappey-components";
import { ServerCatalogModal } from "../mcp-catalog/ServerCatalogModal";
import { CohereTab } from "../provider-config/CohereTab";
import { GoogleTab } from "../provider-config/GoogleTab";
import { GroqTab } from "../provider-config/GroqTab";
import { JinaTab } from "../provider-config/JinaTab";
import { MistralTab } from "../provider-config/MistralTab";
import { PerplexityTab } from "../provider-config/PerplexityTab";
import { PollinationsTab } from "../provider-config/PollinationsTab";
import { TogetherTab } from "../provider-config/TogetherTab";
import { XAITab } from "../provider-config/XAITab";
import { McpPolicySettings } from "../mcp-client/McpPolicySettings";
import { McpClientCapabilitiesCard } from "../mcp-client/McpClientCapabilitiesCard";
import { useAgent } from "./useAgentMcpServers";

export interface AgentFormProps {
    agent: Agent;
    onChange: (agent: Agent) => void;
    isEditing: boolean;
}

export const AgentForm = ({
    agent,
    isEditing,
    onChange }: AgentFormProps) => {
    const { Input, TextArea, Tabs, Tab, Button } = useTheme();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("general");
    const models = useAppStore((s) => s.models);
    // flatten all registry entries once
    const [showCatalog, setShowCatalog] = useState(false);
    const enrichedAgent = useAgent(agent)
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


    const providerKey = agent?.model?.id?.split("/")?.[0];
    const providerMeta = agent?.model?.providerMetadata ?? {};
    const updateProviderMetadata = (patch: any) =>
        onChange({
            ...agent,
            model: {
                ...agent.model,
                providerMetadata: {
                    ...agent.model?.providerMetadata,
                    ...patch,
                },
            },
        });

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
                                },
                            })
                        }
                    />
                    <TextArea label={t('agentEdit.instructions')}
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
                        <McpClientCapabilitiesCard
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
                        onRemove={remove} />
                    <Button
                        icon="catalog"
                        variant="subtle"
                        onClick={() => setShowCatalog(true)}
                    >
                        {t("manageServersModal.catalog")}
                    </Button>

                </Tab>}

                {/* ---------------- Provider Settings ---------------- */}
                <Tab eventKey="providers"
                    title={agent?.model?.id?.split("/")?.[0]}>
                    {providerKey === "openai" && (
                        <OpenAITab
                            openai={providerMeta}
                            updateOpenAI={(openai) =>
                                updateProviderMetadata(openai)
                            }
                        />
                    )}

                    {providerKey === "anthropic" && (
                        <AnthropicTab
                            anthropic={providerMeta}
                            updateAnthropic={(anthropic) =>
                                updateProviderMetadata(anthropic)
                            }
                        />
                    )}

                    {providerKey === "cohere" && (
                        <CohereTab
                            cohere={providerMeta}
                            updateCohere={(cohere) =>
                                updateProviderMetadata(cohere)
                            }
                        />
                    )}

                    {providerKey === "google" && (
                        <GoogleTab
                            google={providerMeta}
                            updateGoogle={(google) =>
                                updateProviderMetadata(google)
                            }
                        />
                    )}

                    {providerKey === "groq" && (
                        <GroqTab
                            groq={providerMeta}
                            updateGroq={(groq) =>
                                updateProviderMetadata(groq)
                            }
                        />
                    )}

                    {providerKey === "jina" && (
                        <JinaTab
                            jina={providerMeta}
                            updateJina={(jina) =>
                                updateProviderMetadata(jina)
                            }
                        />
                    )}

                    {providerKey === "mistral" && (
                        <MistralTab
                            mistral={providerMeta}
                            updateMistral={(mistral) =>
                                updateProviderMetadata(mistral)
                            }
                        />
                    )}

                    {providerKey === "perplexity" && (
                        <PerplexityTab
                            perplexity={providerMeta}
                            updatePerplexity={(perplexity) =>
                                updateProviderMetadata(perplexity)
                            }
                        />
                    )}

                    {providerKey === "pollinations" && (
                        <PollinationsTab
                            pollinations={providerMeta}
                            updatePollinations={(pollinations) =>
                                updateProviderMetadata(pollinations)
                            }
                        />
                    )}

                    {providerKey === "together" && (
                        <TogetherTab
                            together={providerMeta}
                            updateTogether={(together) =>
                                updateProviderMetadata(together)
                            }
                        />
                    )}

                    {providerKey === "xai" && (
                        <XAITab
                            xAI={providerMeta}
                            updateXAI={(xai) =>
                                updateProviderMetadata(xai)
                            }
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
