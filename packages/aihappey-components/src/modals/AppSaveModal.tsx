import { useEffect, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type AppSaveModalValues = {
  name: string;
  includeData: boolean;
};

export type AppSaveModalProps = {
  open: boolean;
  size?: "small" | "medium" | "large";
  defaultName?: string;
  defaultIncludeData?: boolean;
  onSave: (values: AppSaveModalValues) => void | Promise<void>;
  onCancel: () => void;
};

export const AppSaveModal = ({
  open,
  size = "small",
  defaultName,
  defaultIncludeData = false,
  onSave,
  onCancel,
}: AppSaveModalProps) => {
  const { Modal, Button, Input, Switch } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [includeData, setIncludeData] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(defaultName ?? "");
    setIncludeData(!!defaultIncludeData);
  }, [open, defaultName, defaultIncludeData]);

  const trimmedName = name.trim();
  const disableSave = !trimmedName.length;

  return (
    <Modal
      show={open}
      size={size}
      title={t("Save app")}
      onHide={onCancel}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="primary"
            disabled={disableSave}
            onClick={() => onSave({ name: trimmedName, includeData })}
          >
            {t("save")}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input
          label={t("name")}
          value={name}
          onChange={(e: any) => setName(e?.target?.value ?? e ?? "")}
        />
        <Switch
          id="app-save-include-data"
          label={t("Include data")}
          checked={includeData}
          onChange={(next: any) => setIncludeData(!!(next?.target ? next.target.checked : next))}
        />
      </div>
    </Modal>
  );
};
