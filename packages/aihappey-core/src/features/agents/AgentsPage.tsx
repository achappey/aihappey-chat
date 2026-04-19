import { useCallback, useMemo, useState } from "react";
import { useAppStore } from "aihappey-state";
import { AgentCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ServersHeader } from "../mcp-catalog/ServersHeader";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { AgentEditModal } from "./AgentEditModal";
import { Agent } from "aihappey-types";
import { NativeTypes } from "react-dnd-html5-backend";
import { useDrop } from "react-dnd";
import React from "react";


// --- Component ---------------------------------------------------------------

export const AgentsPage = () => {
  const { SearchBox, Text, Tabs, Tab } = useTheme();
  const { t } = useTranslation();

  //const agents = useAppStore((s) => s.agents as Record<string, AgentCardType>);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const createAgent = useAppStore((s) => s.createAgent);
  const updateAgent = useAppStore((s) => s.updateAgent);
  const deleteAgent = useAppStore((s) => s.deleteAgent);
  // rankings stats could come from the store OR from the tool TEXT response we parse locally

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all"); // "top" | "all"

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
    }));

    const remoteCards = remoteAgentModels.map((remoteAgentModel) => ({
      key: `remote:${remoteAgentModel.id}`,
      kind: "remote" as const,
      agent: {
        name: remoteAgentModel.name ?? remoteAgentModel.id,
        description:
          remoteAgentModel.description,
        instructions: "",
        model: {
          id: remoteAgentModel.owned_by
            ? `${remoteAgentModel.id}`
            : remoteAgentModel.id,
        },
      } as Agent,
      remoteAgentModel,
    }));

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


  return (
    <div ref={dropRef}
      onDrop={handleFileDrop}
      style={{
        border: isOver ? "2px dotted" : undefined,
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
            <Tab eventKey="all" icon="cardList" title={t("agents.title")}>
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
                {cards.map((card) =>
                  <div key={card.key} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
                    <AgentCard
                      agent={card.agent}
                      showExport={card.kind === "local"}
                      onDelete={card.kind === "local" ? () => deleteAgent(card.agent.name) : undefined}
                      onEdit={card.kind === "local" ? () => handleEdit(card.agent.name) : undefined}
                    />
                  </div>)}
              </div>
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
