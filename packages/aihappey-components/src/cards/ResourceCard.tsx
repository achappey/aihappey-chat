import type { Resource } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";
import { MimeTypeBadge, PriorityBadge } from "../badges";
import { CapabilityIcon } from "../images/CapabilityIcon";

type ResourceCardProps = {
  resource: Resource;
  onSelect?: () => void;
  translations?: any
};

export const ResourceCard = ({ resource, onSelect, translations }: ResourceCardProps) => {
  const { Card, Button } = useTheme();
  const icon = <CapabilityIcon icons={resource?.icons} />;
  const content = resource?.description || resource?.uri;
  const description = <div>
    <MimeTypeBadge
      translations={translations?.mimeTypes ?? translations}
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
