import { useEffect, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { Agent } from "aihappey-types";
import { AgentForm } from "./AgentForm";
import { CancelButton } from "../../ui/buttons/CancelButton";

export interface AgentEditModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (agent: Agent) => void;
    agent: Agent;
    isEditing: boolean;
}

export const AgentEditModal = ({ open, onClose, agent, isEditing, onSave }: AgentEditModalProps) => {
    const { Modal, Button } = useTheme();
    const { t } = useTranslation();
    const [draft, setDraft] = useState<Agent | undefined>(undefined);

    const isValid = draft?.name
        && draft?.description
        && draft?.model?.id
        && draft?.instructions;

    useEffect(() => {
        if (!open)
            setDraft(undefined)
        else
            setDraft(agent)
    }, [open, agent])

    if (!open) return null;

    return (
        <Modal
            show={open}
            onHide={onClose}
            modalType="alert"
            actions={<>
                <CancelButton onClick={onClose} />
                <Button disabled={!isValid}
                    onClick={() => draft && onSave(draft)}>{t("save")}</Button>
            </>}
            title={isEditing ? t('agentEdit.edit') : t('agentEdit.create')}>
            {draft && <AgentForm agent={draft}
                onChange={setDraft}
                isEditing={isEditing} />}
        </Modal>
    );
};
