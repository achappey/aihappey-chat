import { useEffect, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

type ToolDenyConfirmModalProps = {
    open: boolean;
    size?: "small" | "medium" | "large";
    onConfirm: (reason?: string) => void;
    onCancel: () => void;
};

export const ToolDenyConfirmModal = ({
    open,
    size = "small",
    onConfirm,
    onCancel,
}: ToolDenyConfirmModalProps) => {
    const { Modal, Button, TextArea } = useTheme();
    const [reason, setReason] = useState("");
    const { t } = useTranslation();

    useEffect(() => {
        if (open) setReason("");
    }, [open]);

    return (
        <Modal
            show={open}
            size={size}
            title={t("toolDeny")}
            onHide={onCancel}
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        variant="primary"
                        onClick={() => onConfirm(reason.trim() || undefined)}
                    >
                        {t("deny")}
                    </Button>

                    <Button variant="subtle" onClick={onCancel}>
                        {t("cancel")}
                    </Button>
                </div>
            }
        >
            <TextArea
                label={t("reason")}
                value={reason}
                rows={3}
                onChange={(v) => setReason(v)}
            />
        </Modal>
    );
};
