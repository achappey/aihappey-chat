import { useState } from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { Agent } from "aihappey-types";
import { AgentChecks, hasAgentChecks } from "./AgentChecks";

export interface AgentModalProps {
    open: boolean;
    onClose: () => void;
    agent: Agent;
}

export const AgentModal = ({ open, onClose, agent }: AgentModalProps) => {
    const { Modal, Button, Tabs, Tab, Card } = useTheme();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState("0");
    if (!open) return null;

    return (
        <Modal
            show={open}
            onHide={onClose}
            actions={<Button onClick={onClose}>{t("close")}</Button>}
            title={agent.name}
        >
            <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
                {/* GENERAL */}
                <Tab eventKey="0" title={t("general")}>
                    <div style={{ padding: 8 }}>
                        {agent?.description ? (
                            <p style={{ marginTop: 0 }}>{agent.description}</p>
                        ) : null}

                        <Card
                            title={agent?.model?.id}
                            size="small"
                        >
                            <div style={{ fontSize: 12, color: "#888" }}>{agent?.model?.id}</div>
                        </Card>
                    </div>
                </Tab>
                {hasAgentChecks(agent.evaluations) ? (
                    <Tab eventKey="checks" title={t("agentChecks.title") ?? "Checks"}>
                        <AgentChecks value={agent.evaluations} readOnly />
                    </Tab>
                ) : null}
            </Tabs>
        </Modal>
    );
};
