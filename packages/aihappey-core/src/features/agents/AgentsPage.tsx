import { useCallback, useState } from "react";
import { useAppStore } from "aihappey-state";
import { AgentCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ServersHeader } from "../mcp-catalog/ServersHeader";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { AgentEditModal } from "./AgentEditModal";
import { Agent } from "aihappey-types";
import { NativeTypes } from "react-dnd-html5-backend";
import { useDrop } from "react-dnd";


// --- Component ---------------------------------------------------------------

export const AgentsPage = () => {
  const { SearchBox, Paragraph, Tabs, Tab } = useTheme();
  const { t } = useTranslation();

  //const agents = useAppStore((s) => s.agents as Record<string, AgentCardType>);
  const agents = useAppStore((s) => s.agents);
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
  const [{ isOver }, dropRef] = useDrop({
    accept: [NativeTypes.FILE],
    canDrop: (item: { files: File[] }) =>
      item.files?.every(f => f.name.endsWith(".json")),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

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
            title={t("agents.framework")}
            officialUrl={"https://learn.microsoft.com/en-us/agent-framework/overview/agent-framework-overview"}
            docsUrl={"https://github.com/microsoft/agent-framework"}
          />

          <Paragraph style={{ textAlign: "center" }}>
            {t("agents.description")}
          </Paragraph>

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
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  width: "100%",
                  maxWidth: 700,
                  marginBottom: 24,
                  justifyItems: "center",
                }}
              >
                {agents.map(r =>
                  <div key={r.name} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
                    <AgentCard
                      agent={r}
                      onDelete={() => deleteAgent(r.name)}
                      onEdit={() => handleEdit(r.name)}
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