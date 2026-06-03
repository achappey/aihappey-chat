import { useCallback, useMemo, useState } from "react";
import { getAgentModelProviderKey, useAppStore } from "aihappey-state";
import { AgentCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ServersHeader } from "../mcp-catalog/ServersHeader";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { AgentEditModal } from "./AgentEditModal";
import { Agent, RemoteAgentModel } from "aihappey-types";
import { NativeTypes } from "react-dnd-html5-backend";
import { useDrop } from "react-dnd";
import React from "react";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useChatContext } from "../chat/context/ChatContext";

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
  const { SearchBox, Text, Tabs, Tab } = useTheme();
  const { t } = useTranslation();
  const { config: chatConfig } = useChatContext();

  //const agents = useAppStore((s) => s.agents as Record<string, AgentCardType>);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const createAgent = useAppStore((s) => s.createAgent);
  const updateAgent = useAppStore((s) => s.updateAgent);
  const deleteAgent = useAppStore((s) => s.deleteAgent);
  const favoriteAgentIds = useAppStore((s: any) => s.favoriteAgentIds as string[] | undefined);
  const toggleFavoriteAgent = useAppStore((s: any) => s.toggleFavoriteAgent as (agentId: string) => void);
  // rankings stats could come from the store OR from the tool TEXT response we parse locally

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all"); // "top" | "all"

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


  const handleFileDrop = async (item: any) => {
    const files: FileList | undefined = item?.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const importedIds: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".json")) {
        console.warn("Skipping non-chat file:", file.name);
        continue;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data?.name && data?.description && data?.instructions) {
          createAgent(data)
        }
      } catch (err) {
        console.error("Failed to import conversation", file.name, err);
      }
    }
  };

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

  const localCards = useMemo(
    () => cards.filter((card) => card.kind === "local"),
    [cards]
  );

  const remoteCards = useMemo(
    () => cards.filter((card) => card.kind === "remote"),
    [cards]
  );

  const renderGrid = (items: typeof cards) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
          <div key={card.key} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
            <AgentCard
              agent={card.agent}
              providerIcons={card.providerIcons}
              onDelete={card.kind === "local" ? () => deleteAgent(card.agent.name) : undefined}
              onEdit={card.kind === "local" ? () => handleEdit(card.agent.name) : undefined}
              isFavorite={(favoriteAgentIds ?? []).includes(card.key)}
              onToggleFavorite={() => toggleFavoriteAgent(card.key)}
            />
          </div>)
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
      <ServersHeader onAddServer={() => handleCreate()} />
      <div style={{ background: "transparent" }}>
        <div
          style={{
            width: 700,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <OverviewPageHeader
            title={t("agents.title")}
          />

          <Text as="p" align={"center"}>
            {t("agents.description")}
          </Text>

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
              />
            </div>
          </div>

          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            <Tab eventKey="all" icon="cardList" title={`${t("all")} (${cards.length})`}>
              {renderGrid(cards)}
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
      </div>
      <AgentEditModal
        open={showModal}
        agent={
          editingAgent ?? {
            name: "",
            description: "",
            instructions: "",
            model: { id: "" },
            mcpClient: {
              capabilities: {
                elicitation: {},
                sampling: {}
              },
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
