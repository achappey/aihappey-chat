import { useTheme } from "../theme/ThemeContext";
import { Agent, MenuItemProps, ModelOption } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";

type AgentCardProps = {
  agent: Agent;
  translations?: any;
  onEdit?: () => void
  onDelete?: () => void
};

export const AgentCard = ({ agent, onEdit, onDelete, translations }: AgentCardProps) => {
  const { Card, Button, Menu } = useTheme();
  const menuItems: MenuItemProps[] = [{
    key: 'delete',
    label: translations?.delete ?? "delete",
    onClick: onDelete
  }]


  const handleExport = async () => {
    // Full object (metadata + messages + anything else)
    const json = JSON.stringify(agent, null, 2);

    // Create blob
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;

    // Filename from conversation name
    const safeName = (agent?.name)
      .replace(/[^a-z0-9\-]+/gi, "_")
      .toLowerCase();

    a.download = `Agent_${safeName}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const exportButton = <Button icon="download"
    size="small"
    variant="transparent"
    onClick={handleExport} />;

  const headerActions = onDelete && <Menu items={menuItems} />;
  const editButton = onEdit
    ? <Button icon="edit"
      size="small"
      variant="transparent"
      onClick={onEdit} /> : undefined;

  const actions = <>{exportButton}{editButton}</>

  return (
    <Card
      title={agent?.name}
      actions={actions}
      headerActions={headerActions}
      description={agent?.model?.id}
      size="small"
    >
      <LimitedTextField text={agent?.description} />
    </Card>
  );
};
