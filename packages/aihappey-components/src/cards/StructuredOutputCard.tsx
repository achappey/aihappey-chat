import { useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";
import { ViewButton } from "../buttons/ViewButton";

export type StructuredOutputCardItem = {
  id: string;
  name: string;
  json_schema: string;
};

export type StructuredOutputCardProps = {
  item: StructuredOutputCardItem;
  onEdit?: () => void;
};

export const StructuredOutputCard = ({ item, onEdit }: StructuredOutputCardProps) => {
  const { Card, Modal, Button, JsonViewer } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const parsedSchema = useMemo(() => {
    try {
      return JSON.parse(item.json_schema);
    } catch {
      return item.json_schema;
    }
  }, [item.json_schema]);

  return (
    <>
      <Card
        title={item.name}
        size="small"
        actions={<>
          <ViewButton
            size="small"
            variant="transparent"
            onClick={() => setOpen(true)}
          />
          {onEdit ? (
            <Button
              icon="edit"
              title={t("edit")}
              size="small"
              variant="transparent"
              onClick={onEdit}
            />
          ) : null}
        </>}
      >
        <LimitedTextField text={item.json_schema} />
      </Card>

      <Modal
        show={open}
        onHide={() => setOpen(false)}
        title={item.name}
        actions={<Button onClick={() => setOpen(false)}>{t("close")}</Button>}
      >
        <JsonViewer value={parsedSchema} />
      </Modal>
    </>
  );
};
