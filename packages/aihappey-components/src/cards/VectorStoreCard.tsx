import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";
import { formatFileSize } from "./formatFileSize";
import { CapabilityIcon, type CapabilityIconProps } from "../images/CapabilityIcon";

export type VectorStoreCardProps = {
  name: string;
  description?: string;
  model: string;
  providerIcons?: CapabilityIconProps["icons"];
  size: number;
  fileCount: number;
  onView: () => void;
  onDownload?: () => void;
  onDelete: () => void;
  labels?: { files?: string; view?: string; download?: string; delete?: string };
};

export const VectorStoreCard = ({
  name,
  description,
  model,
  providerIcons,
  size,
  fileCount,
  onView,
  onDownload,
  onDelete,
  labels,
}: VectorStoreCardProps) => {
  const { Card, Button, Menu, Badge } = useTheme();
  const formattedFileCount = new Intl.NumberFormat(typeof navigator !== "undefined" ? navigator.languages : undefined).format(fileCount);
  const image = providerIcons?.length ? <CapabilityIcon icons={providerIcons} /> : undefined;
  return (
    <Card
        title={name}
        image={image}
        description={(
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Badge title={model} icon="brain" size="small" appearance="tint">{model}</Badge>
            <Badge icon="folder" size="small" appearance="neutral" title={`${formattedFileCount} ${labels?.files?.toLocaleLowerCase() ?? "files"}`}>
              {formattedFileCount}
            </Badge>
            <Badge size="small" appearance="neutral">{formatFileSize(size)}</Badge>
          </div>
        )}
        size="small"
        actions={(
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button icon="eye" size="small" variant="transparent" title={labels?.view ?? "View"} onClick={onView} />
            {onDownload && <Button icon="download" size="small" variant="transparent" title={labels?.download ?? "Download"} onClick={onDownload} />}
          </div>
        )}
        headerActions={<Menu items={[{ key: "delete", label: labels?.delete ?? "Delete", onClick: onDelete }]} />}
      >
        <LimitedTextField text={description || " "} />
      </Card>
  );
};
