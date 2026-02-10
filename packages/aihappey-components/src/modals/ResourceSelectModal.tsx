import { useTranslation } from "aihappey-i18n";
import type { Resource, ResourceTemplate } from "aihappey-mcp";
import { useTheme } from "../theme/ThemeContext";
import { ResourceCard, ResourceTemplateCard } from "../cards";

export type ResourceSelectModalProps = {
  resources?: Resource[];
  resourceTemplates?: ResourceTemplate[];
  open: boolean;
  onSelect: (uri: string) => void;
  onSelectTemplate?: (uriTemplate: string) => void;
  onHide: () => void;
};

type SelectItem =
  | { type: "resource"; data: Resource; label: string }
  | { type: "template"; data: ResourceTemplate; label: string };

export const ResourceSelectModal = ({
  resources,
  resourceTemplates,
  onSelect,
  onSelectTemplate,
  open,
  onHide,
}: ResourceSelectModalProps) => {
  const { Modal, Button } = useTheme();
  const { t } = useTranslation();

  const items: SelectItem[] = [
    ...(resources ?? []).map((r) => ({
      type: "resource" as const,
      data: r,
      label: r.title ?? r.name,
    })),
    ...(resourceTemplates ?? []).map((t) => ({
      type: "template" as const,
      data: t,
      label: t.title ?? t.name,
    })),
  ].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );

  return (
    <Modal
      show={open}
      onHide={onHide}
      actions={
        <Button variant="secondary" onClick={onHide}>
          {t("close")}
        </Button>
      }
      title={t("mcp.resources")}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {items.map((item, idx) =>
          item.type === "resource" ? (
            <ResourceCard
              key={item.data.name + idx}
              resource={item.data}
              onSelect={() => onSelect(item.data.uri)}
            />
          ) : (
            <ResourceTemplateCard
              key={item.data.name + idx}
              resourceTemplate={item.data}
              onSelect={() =>
                onSelectTemplate?.(item.data.uriTemplate)
              }
            />
          )
        )}
      </div>
    </Modal>
  );
};
