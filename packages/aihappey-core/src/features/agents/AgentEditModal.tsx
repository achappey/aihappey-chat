import { useEffect, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { type Agent } from "aihappey-types";
import { useAppStore } from "aihappey-state";
import { hasValidAgentEditorModels } from "./agentEditorModels";
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
    const [draft, setDraft] = useState<Agent>(agent);
    const [busy, setBusy] = useState(false);
    const models = useAppStore(s => s.models);

    const isValid = draft?.name
        && draft?.description
        && hasValidAgentEditorModels(draft, models)
        && draft?.instructions;

    useEffect(() => {
        setDraft(agent)
    }, [open, agent])

    useEffect(() => {
        if (!open) {
            setBusy(false);
        }
    }, [open])

    if (!open) return null;

    return (
        <Modal
            show={open}
            onHide={onClose}
            modalType="alert"
            actions={<>
                <CancelButton onClick={onClose} />
                <Button disabled={!isValid || busy}
                    onClick={() => isValid && !busy && onSave(draft)}>{t("save")}</Button>
            </>}
            title={isEditing ? t('agentEdit.edit') : t('agentEdit.create')}>
            <AgentForm agent={draft}
                onChange={setDraft}
                onBusyChange={setBusy}
                isEditing={isEditing} />
        </Modal>
    );
};
