import type { Resource } from "aihappey-mcp";
import { useTheme } from "../theme/ThemeContext";
import { MimeTypeBadge, PriorityBadge } from "../badges";
import { CapabilityIcon } from "../images/CapabilityIcon";

type ResourceCardProps = {
  resource: Resource;
  onSelect?: () => void;
};

export const ResourceCard = ({ resource, onSelect }: ResourceCardProps) => {
  const { Card, Button } = useTheme();
  const icon = <CapabilityIcon icons={resource?.icons} />;
  const content = resource?.description || resource?.uri;
  const description = <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
    <MimeTypeBadge
      mimeType={resource?.mimeType}
    />
    <PriorityBadge
      priority={resource?.annotations?.priority}
    />
  </div>;

  return (
    <Card
      title={resource?.title ?? resource?.name}
      image={icon}
      description={description}
      size="small"
      actions={
        <Button
          onClick={onSelect}
          variant="transparent"
          icon="add"
          size="small"
        />
      }>
      {content}
    </Card>
  );
};
