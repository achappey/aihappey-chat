import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAgentModelProviderKey, useAppStore } from "aihappey-state";
import { AgentCard, FilterDrawerPanel, StickyHeaderActionBar, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { AgentEditModal } from "./AgentEditModal";
import type { Agent, IconToken, MenuItemProps, RemoteAgentModel } from "aihappey-types";
import { NativeTypes } from "react-dnd-html5-backend";
import { useDrop } from "react-dnd";
import React from "react";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useChatContext } from "../chat/context/ChatContext";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { usePlugins } from "aihappey-plugins";
import { useSkills } from "aihappey-skills";
import { collectAgentTags, getAgentTags } from "./agentTags";
import {
  AgentPluginConversionError,
  convertAgentToPluginDraft,
} from "./agentPluginConversion";

const getProviderIconsForModel = (modelId?: string): Agent["icons"] | undefined => {
  const providerKey = getAgentModelProviderKey(modelId);
  if (!providerKey) return undefined;

  return (PROVIDERS as Record<string, { icons?: Agent["icons"] }>)[providerKey]?.icons;
};

const getProviderIconsForAgentModel = (agent?: Pick<Agent, "model">): Agent["icons"] | undefined => {
  return getProviderIconsForModel(agent?.model?.id);
};

const buildRemoteAgentCardAgent = (remoteAgentModel: RemoteAgentModel): Agent => {
  const remoteAgent = remoteAgentModel.agent;

  return {
    ...remoteAgent,
    tags: getAgentTags(remoteAgentModel, remoteAgent),
    name: remoteAgentModel.name ?? remoteAgent?.name ?? remoteAgentModel.id,
    description: remoteAgentModel.description ?? remoteAgent?.description ?? "",
    instructions: remoteAgent?.instructions ?? "",
    model: remoteAgent?.model ?? { id: remoteAgentModel.id },
  };
};

const hostnameOf = (url?: string) => {
  if (!url) return "remote";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};


// --- Component ---------------------------------------------------------------

export const AgentsPage = () => {
  const theme = useTheme();
  const { SearchBox, Text, Tabs, Tab, Drawer, Switch } = theme;
  const { t } = useTranslation();
  const { config: chatConfig } = useChatContext();
  const isDesktop = useIsDesktop();
  const plugins = usePlugins();
  const skills = useSkills();

  //const agents = useAppStore((s) => s.agents as Record<string, AgentCardType>);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const createAgent = useAppStore((s) => s.createAgent);
  const updateAgent = useAppStore((s) => s.updateAgent);
  const deleteAgent = useAppStore((s) => s.deleteAgent);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const addMcpServer = useAppStore((s) => s.addMcpServer);
  const updateMcpServer = useAppStore((s) => s.updateMcpServer);
  const favoriteAgentIds = useAppStore((s: any) => s.favoriteAgentIds as string[] | undefined);
  const toggleFavoriteAgent = useAppStore((s: any) => s.toggleFavoriteAgent as (agentId: string) => void);
  // rankings stats could come from the store OR from the tool TEXT response we parse locally

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all"); // "top" | "all"
  const [convertingCardKey, setConvertingCardKey] = useState<string | null>(null);
  const [pluginFeedback, setPluginFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagOptions = useMemo(
    () => collectAgentTags(agents, remoteAgentModels),
    [agents, remoteAgentModels]
  );
  useEffect(() => {
    setSelectedTags((current) => {
      const next = current.filter((tag) => tagOptions.includes(tag));
      return next.length === current.length ? current : next;
    });
  }, [tagOptions]);

  const favoriteAgentSet = useMemo(
    () => new Set((favoriteAgentIds ?? []).filter(Boolean)),
    [favoriteAgentIds]
  );

  const remoteAgentsHost = useMemo(
    () => hostnameOf(chatConfig.agentEndpoint ? `${chatConfig.agentEndpoint}${chatConfig.endpoints.models}` : undefined),
    [chatConfig.agentEndpoint, chatConfig.endpoints.models]
  );

  // const handleEdit = (name: string) => setEditingName(name);
  const handleHideEdit = () => {
    setEditingName(null)
    setShowModal(false)
  };

  const editingAgent =
    editingName
      ? agents.find(a => a.name === editingName) ?? null
      : null;

  const handleCreate = () => {
    setEditingName(null);
    setShowModal(true);
  };

  const handleEdit = (name: string) => {
    setEditingName(name);
    setShowModal(true);
  };

  const handleSave = (agent: Agent) => {
    if (editingName) {
      updateAgent(editingName, agent);
    } else {
      createAgent(agent);
    }
    setShowModal(false);
  };



  // DnD preview
  const [{ isOver }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    canDrop: (item: { files: File[] }) =>
      item.files?.every(f => f.name.endsWith(".json")),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const dropRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);


  const importAgentFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".json")) {
        console.warn("Skipping non-agent file:", file.name);
        continue;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data?.name && data?.description && data?.instructions) {
          createAgent(data);
        }
      } catch (err) {
        console.error("Failed to import agent", file.name, err);
      }
    }
  }, [createAgent]);

  const handleFileDrop = useCallback(async (item: any) => {
    const files: FileList | undefined = item?.dataTransfer?.files;
    if (!files || files.length === 0) return;
    await importAgentFiles(Array.from(files));
  }, [importAgentFiles]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) await importAgentFiles(files);
  }, [importAgentFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const cards = useMemo(() => {
    const query = search.trim().toLowerCase();

    const localCards = agents.map((agent) => ({
      key: `local:${agent.name}`,
      kind: "local" as const,
      agent,
      providerIcons: getProviderIconsForAgentModel(agent),
    }));

    const remoteCards = remoteAgentModels.map((remoteAgentModel) => {
      const agent = buildRemoteAgentCardAgent(remoteAgentModel);

      return {
        key: `remote:${remoteAgentModel.id}`,
        kind: "remote" as const,
        agent,
        providerIcons: getProviderIconsForAgentModel(remoteAgentModel.agent),
        remoteAgentModel,
      };
    });

    return [...localCards, ...remoteCards].filter((card) => {
      if (!query) return true;

      const haystack = [
        card.agent.name,
        card.agent.description,
        card.agent.model?.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [agents, remoteAgentModels, search]);

  const filteredCards = useMemo(
    () => cards.filter((card) => !selectedTags.length
      || getAgentTags(card.agent).some((tag) => selectedTags.includes(tag))),
    [cards, selectedTags]
  );

  const localCards = useMemo(
    () => filteredCards.filter((card) => card.kind === "local"),
    [filteredCards]
  );

  const favoriteCards = useMemo(
    () => filteredCards.filter((card) => favoriteAgentSet.has(card.key)),
    [filteredCards, favoriteAgentSet]
  );

  const remoteCards = useMemo(
    () => filteredCards.filter((card) => card.kind === "remote"),
    [filteredCards]
  );

  const tabCards = cards.filter((card) => activeTab === "all"
    || (activeTab === "favorites" ? favoriteAgentSet.has(card.key)
      : activeTab === "local" ? card.kind === "local" : card.kind === "remote"));
  const tagFilterSection = {
    id: "agent-tag-filters",
    label: t("providers:tags"),
    allOption: {
      id: "all-agent-tags",
      label: t("all"),
      count: tabCards.length,
      checked: selectedTags.length === 0,
      onChange: () => setSelectedTags([]),
    },
    items: tagOptions.map((tag) => {
      const count = tabCards.filter((card) => getAgentTags(card.agent).includes(tag)).length;
      const checked = selectedTags.includes(tag);
      return {
        id: `agent-tag-${tag}`,
        label: tag,
        count,
        checked,
        disabled: count === 0 && !checked,
        onChange: () => setSelectedTags((current) => current.includes(tag)
          ? current.filter((item) => item !== tag) : [...current, tag]),
      };
    }),
  };
  const renderFilters = () => (
    <Drawer open={filtersOpen} title={t("filters")} overlay={!isDesktop}
      position="end" size={isDesktop ? "medium" : "small"} onClose={() => setFiltersOpen(false)}>
      <div style={{ width: "100%", boxSizing: "border-box", padding: 16 }}>
        <FilterDrawerPanel sections={[tagFilterSection]} />
      </div>
    </Drawer>
  );

  const handleConnectMcp = useCallback((agent: Agent) => {
    Object.entries(agent.mcpServers ?? {})
      .filter(([name, server]) => name.trim().length > 0 && server.disabled !== true)
      .forEach(([name, server]) => {
        const key = name.trim().toLowerCase();
        const config = {
          type: "http" as const,
          url: server.url,
          disabled: false,
          ...(server.headers ? { headers: server.headers } : {}),
        };

        if (mcpServers[key]) {
          updateMcpServer(key, config);
        } else {
          addMcpServer(key, { config });
        }
      });
  }, [addMcpServer, mcpServers, updateMcpServer]);

  const handleSaveAsPlugin = useCallback(async (cardKey: string, agent: Agent) => {
    if (convertingCardKey) return;
    setConvertingCardKey(cardKey);
    setPluginFeedback(null);
    try {
      const draft = await convertAgentToPluginDraft(agent, {
        existingPluginNames: plugins.items.map((item) => item.name),
        extensionNamespace: plugins.extensionNamespace,
        skills,
      });
      const created = await plugins.create(draft);
      setPluginFeedback(t("agents.pluginCreated", { name: created.name }));
    } catch (cause) {
      if (cause instanceof AgentPluginConversionError && cause.code === "empty-agent") {
        setPluginFeedback(t("agents.pluginEmpty"));
      } else if (cause instanceof AgentPluginConversionError) {
        setPluginFeedback(t("agents.pluginConversionFailed", { message: cause.message }));
      } else {
        const message = cause instanceof Error ? cause.message : t("pluginsPage.saveFailed");
        setPluginFeedback(t("agents.pluginConversionFailed", { message }));
      }
    } finally {
      setConvertingCardKey(null);
    }
  }, [convertingCardKey, plugins, skills, t]);

  const actionMenuItems: MenuItemProps[] = [
    {
      key: "create-agent",
      label: t("agents.actions.create") ?? "Create new agent",
      icon: "add" as IconToken,
      onClick: handleCreate,
    },
    {
      key: "import-agent",
      label: t("agents.actions.import") ?? "Import agent",
      icon: "attachment" as IconToken,
      onClick: () => fileInputRef.current?.click(),
    }
  ];

  const renderGrid = (items: typeof cards) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr",
        gap: 16,
        paddingTop: 12,
        width: "100%",
        maxWidth: 700,
        marginBottom: 24,
        justifyItems: "center",
      }}
    >
      {items.length === 0 ? (
        <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>
          {t("noResults")}
        </div>
      ) : (
        items.map((card) =>
          {
            const hasEnabledMcpServers = Object.entries(card.agent.mcpServers ?? {})
              .some(([name, server]) => name.trim().length > 0 && server.disabled !== true);

            return (
              <div
                key={card.key}
                style={{
                  maxWidth: isDesktop ? 320 : "100%",
                  minWidth: isDesktop ? 320 : 0,
                  width: "100%",
                }}
              >
                <AgentCard
                  agent={card.agent}
                  providerIcons={card.providerIcons}
                  onDelete={card.kind === "local" ? () => deleteAgent(card.agent.name) : undefined}
                  onEdit={card.kind === "local" ? () => handleEdit(card.agent.name) : undefined}
                  onConnectMcp={hasEnabledMcpServers ? () => handleConnectMcp(card.agent) : undefined}
                  onSaveAsPlugin={() => handleSaveAsPlugin(card.key, card.agent)}
                  saveAsPluginDisabled={convertingCardKey !== null}
                  isFavorite={favoriteAgentSet.has(card.key)}
                  onToggleFavorite={() => toggleFavoriteAgent(card.key)}
                />
              </div>
            );
          })
      )}
    </div>
  );


  return (
    <div ref={dropRef}
      onDrop={handleFileDrop}
      style={{
        border: isOver ? "2px dotted" : undefined,
        display: "contents",
        borderColor: isOver ? "#888" : "transparent",
      }}
      onDragOver={handleDragOver}>
      <StickyHeaderActionBar
        actionContent={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Switch id="agents-filters-toggle" label={t("filters")}
              checked={filtersOpen} onChange={setFiltersOpen} />
            <theme.Menu
              align="right"
              direction="bottom"
              size="medium"
              items={actionMenuItems}
              trigger={
                <theme.Button
                  type="button"
                  variant="primary"
                  icon="add"
                  title={t("add") ?? "Add"}
                  aria-label={t("add") ?? "Add"}
                />
              }
            />
          </div>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        multiple
        hidden
        onChange={handleFileSelect}
      />
      <div style={{
        background: "transparent",
        display: filtersOpen && isDesktop ? "grid" : "block",
        gridTemplateColumns: filtersOpen && isDesktop ? "minmax(0, 1fr) 320px" : undefined,
        alignItems: "stretch",
      }}>
        <div
          style={{
            width: 700,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingLeft: isDesktop ? 0 : 12,
            paddingRight: isDesktop ? 0 : 12,
            boxSizing: "border-box",
          }}
        >
          <OverviewPageHeader
            title={t("agents.title")}
          />

          <Text as="p" align={"center"}>
            {t("agents.description")}
          </Text>

          {pluginFeedback ? (
            <Text as="p" align="center">
              {pluginFeedback}
            </Text>
          ) : null}

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ width: 360, maxWidth: "100%" }}>
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
                autoFocus={isDesktop}
              />
            </div>
          </div>

          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            <Tab eventKey="all" icon="cardList" title={`${t("all")} (${filteredCards.length})`}>
              {renderGrid(filteredCards)}
            </Tab>

            <Tab eventKey="favorites" icon="starFilled" title={`${t("favorites")} (${favoriteCards.length})`}>
              {renderGrid(favoriteCards)}
            </Tab>

            <Tab eventKey={`remote:${remoteAgentsHost}`}
              title={`${remoteAgentsHost} (${remoteCards.length})`}>
              {renderGrid(remoteCards)}
            </Tab>

            <Tab eventKey="local" title={`${t("local")} (${localCards.length})`}>
              {renderGrid(localCards)}
            </Tab>
          </Tabs>
        </div>
        {filtersOpen && isDesktop ? (
          <div style={{ width: 320, maxWidth: "100%", height: "100%" }}>
            {renderFilters()}
          </div>
        ) : null}
      </div>
      {!isDesktop ? renderFilters() : null}
      <AgentEditModal
        open={showModal}
        agent={
          editingAgent ?? {
            name: "",
            description: "",
            instructions: "",
            model: { id: "" },
            mcpClient: {
              policy: {
                readOnlyHint: false,
                openWorldHint: true,
                idempotentHint: false,
                destructiveHint: true
              }
            }
          }
        }
        onClose={handleHideEdit}
        onSave={handleSave}
        isEditing={!!editingName}
      />
    </div>
  );
};
