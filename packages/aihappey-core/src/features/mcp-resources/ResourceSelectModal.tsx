import { ResourceCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { Resource } from "aihappey-mcp";

export type ResourceSelectModalProps = {
  resources: Resource[];
  open: boolean
  onSelect: (uri: string) => void;
  onHide: () => void;
};

export const ResourceSelectModal = ({
  resources,
  onSelect,
  open,
  onHide,
}: ResourceSelectModalProps) => {
  const { Modal, Button } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      show={open}
      onHide={onHide}
      actions={
        <Button variant="secondary"
          onClick={onHide}>
          {t("close")}
        </Button>}
      title={t("mcp.resources")}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {resources.map((resource, idx) => (
          <ResourceCard
            key={resource.name + idx}
            resource={resource}
            translations={resource?.mimeType
              && t(`mimeTypes.${resource?.mimeType}`) !== `mimeTypes.${resource?.mimeType}` ? {
              [resource?.mimeType]: t(`mimeTypes.${resource?.mimeType}`)
            } : undefined}
            onSelect={() => onSelect(resource.uri)}
          />
        ))}
      </div>
    </Modal>
  );
};
