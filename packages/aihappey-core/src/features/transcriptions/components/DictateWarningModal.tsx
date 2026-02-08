import { useEffect, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

export type DictateWarningModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
};

export const DictateWarningModal = ({
  open,
  onClose,
  onConfirm,
}: DictateWarningModalProps) => {
  const { Modal, Button, Switch } = useTheme();
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) setDontShowAgain(false);
  }, [open]);

  return (
    <Modal
      show={open}
      onHide={onClose}
      title={t("transcriptionDictateWarningTitle")}
      actions={(
        <>
          <Button variant="informative" onClick={onClose}>{t("cancel")}</Button>
          <Button variant="primary" onClick={() => onConfirm(dontShowAgain)}>
            {t("transcriptionDictateWarningContinue")}
          </Button>
        </>
      )}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>{t("transcriptionDictateWarningMessage")}</div>
        <Switch
          id="transcription-dictate-warning-dont-show-again"
          checked={dontShowAgain}
          label={t("transcriptionDictateWarningDontShowAgain")}
          onChange={() => setDontShowAgain((v) => !v)}
        />
      </div>
    </Modal>
  );
};

