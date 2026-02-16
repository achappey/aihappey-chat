import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "aihappey-types";
import { ToolApprovalButtons, ToolContent, ToolDenyConfirmModal, useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ContentBlockView } from "../chat/activity/content/ContentBlockView";
import { StructuredOutputView } from "../chat/activity/content/StructuredOutputView";
import { getToolName } from "./useTools";

type ApprovalToolPart = {
    type: string;
    toolCallId: string;
    state?: string;
    approval?: { id: string };
    input?: any;
    output?: any;
    errorText?: string;
    providerExecuted?: boolean
};

function findPendingApproval(messages: UIMessage[]) {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return undefined;

    const parts = (lastAssistant.parts ?? []) as any[];

    const approvalPart = [...parts]
        .reverse()
        .find(
            (p) =>
                typeof p?.type === "string" &&
                p.type.startsWith("tool-") &&
                p.state === "approval-requested" &&
                p.approval?.id
        );

    if (approvalPart) {
        return { tool: approvalPart as ApprovalToolPart, approvalId: approvalPart.approval.id };
    }

    if (
        parts.some(
            (p) =>
                typeof p?.type === "string" &&
                p.type.startsWith("tool-") &&
                p.state === "input-available" &&
                !p.providerExecuted
        )
    ) {
        return undefined;
    }

    return undefined;
}

function shouldAutoApprove(
    tool: ApprovalToolPart,
    approveAll: boolean,
    allowedToolList: string[]
) {
    if (approveAll) return true;

    const toolName = getToolName(tool.type);
    return allowedToolList.includes(toolName);
}

export function ToolApprovalModalHost({
    messages,
    tools,
    status,
    addToolApprovalResponse,
}: {
    messages: UIMessage[];
    status?: string
    tools: { name: string; annotations?: { title?: string } }[];
    addToolApprovalResponse: (x: {
        id: string;
        approved: boolean;
        reason?: string;
    }) => void;
}) {
    const { Modal, Tabs, Tab } = useTheme();
    const { t } = useTranslation();

    const approveAll = useAppStore((a) => a.approveAll);
    const allowedToolList = useAppStore((a) => a.allowedToolList);
    const addAllowedTool = useAppStore((a) => a.addAllowedTool);
    const toggleApproveAll = useAppStore((a) => a.toggleApproveAll);

    const active = useMemo(() => findPendingApproval(messages), [messages]);

    const toolName = active?.tool?.type?.replace("tool-", "");
    const toolTitle =
        toolName ? tools.find((x) => x.name === toolName)?.annotations?.title : undefined;

    const autoApprove =
        !!active && shouldAutoApprove(active.tool, approveAll, allowedToolList);

    const lastAutoApprovedId = useRef<string | null>(null);

    const hasOutput = active?.tool?.output !== undefined && active?.tool?.output !== null;
    const outputResult = hasOutput ? active?.tool?.output : undefined;
    const outputContentArr = Array.isArray(outputResult?.content) ? outputResult.content : [];

    const defaultMainTab = hasOutput ? "output" : "input";
    const defaultOutputTab = outputResult?.structuredContent ? "structuredContent" : "0";

    const [activeTab, setActiveTab] = useState<string>(defaultMainTab);
    const [activeOutputTab, setActiveOutputTab] = useState<string>(defaultOutputTab);

    // ✅ Deny-with-reason modal state
    const [showDenyReason, setShowDenyReason] = useState(false);

    // Reset small UI state when switching to a new approval id
    useEffect(() => {
        setActiveTab(defaultMainTab);
        setActiveOutputTab(defaultOutputTab);
        setShowDenyReason(false);
    }, [active?.approvalId, defaultMainTab, defaultOutputTab]);

    // 🔁 AUTO APPROVAL (with reason)
    useEffect(() => {
        if (!active || !autoApprove) return;
        if (lastAutoApprovedId.current === active.approvalId) return;

        lastAutoApprovedId.current = active.approvalId;

        addToolApprovalResponse({
            id: active.approvalId,
            approved: true,
            reason: approveAll ? "BRRR" : toolName,
        });
    }, [active, autoApprove, approveAll, addToolApprovalResponse]);

    const showModal = (!!active && !autoApprove);
  //  if (!showModal) return null;
    if (!showModal || status == "streaming") return null;

    const respondAllow = () => {
        if (!active?.approvalId) return;
        addToolApprovalResponse({
            id: active.approvalId,
            approved: true,
        });
    };

    // Deny flow: first deny (no reason), then optionally ask for reason in a second modal
    const respondDeny = () => {
        if (!active?.approvalId) return;

        setShowDenyReason(true);
    };


    const allowThisTool = () => {
        if (!active?.approvalId) return;

        addToolApprovalResponse({
            id: active.approvalId,
            approved: true,
            reason: toolName,
        });

        // voeg tool toe aan allowlist
        if (toolName) {
            addAllowedTool(toolName)
        }
    };

    const allowAllToolsYolo = () => {
        if (!active?.approvalId) return;

        addToolApprovalResponse({
            id: active.approvalId,
            approved: true,
            reason: "BRRR",
        });

        // zet approveAll aan
        toggleApproveAll();
    };

    return (
        <>
            {/* MAIN APPROVAL MODAL */}
            <Modal
                show
                onHide={() => { }}
                title={t("toolApproval")}
                actions={
                    <ToolApprovalButtons
                        toolName={toolName}
                        toolTitle={toolTitle}
                        onAllow={respondAllow}
                        onDeny={respondDeny}
                        onAllowThisTool={allowThisTool}
                        onAllowAllTools={allowAllToolsYolo}
                    />
                }
            >
                <Tabs activeKey={activeTab} onSelect={setActiveTab}>
                    <Tab eventKey="input" title={t("input")}>
                        <div style={{ paddingTop: 12 }}>
                            <ToolContent invocation={active.tool} />
                        </div>
                    </Tab>

                    <Tab eventKey="output" title={t("output")} disabled={!hasOutput}>
                        <div style={{ paddingTop: 12 }}>
                            {hasOutput ? (
                                <>
                                    {outputResult?.structuredContent && outputContentArr.length === 0 ? (
                                        <StructuredOutputView result={outputResult} />
                                    ) : null}

                                    {outputContentArr.length > 0 ? (
                                        <Tabs activeKey={activeOutputTab} onSelect={(k: string) => setActiveOutputTab(k)}>
                                            {outputResult?.structuredContent ? (
                                                <Tab eventKey={"structuredContent"} title={t("mcp.structuredContent")}>
                                                    <StructuredOutputView result={outputResult} />
                                                </Tab>
                                            ) : null}

                                            {outputContentArr.map((block: any, i: number) => (
                                                <Tab
                                                    key={String(i)}
                                                    eventKey={String(i)}
                                                    title={t(`mcp.${block.type}`)}
                                                >
                                                    <div style={{ padding: 8 }}>
                                                        <ContentBlockView block={block} />
                                                    </div>
                                                </Tab>
                                            ))}
                                        </Tabs>
                                    ) : null}

                                    {!outputResult?.structuredContent && outputContentArr.length === 0 ? (
                                        <div style={{ color: "#888" }}>{t("noResults")}</div>
                                    ) : null}
                                </>
                            ) : (
                                <div style={{ color: "#888" }}>{t("noResults")}</div>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </Modal>

            <ToolDenyConfirmModal
                open={showDenyReason}
                size="small"
                onConfirm={(reason) => {
                    addToolApprovalResponse({
                        id: active.approvalId,
                        approved: false,
                        reason,
                    });
                    setShowDenyReason(false);
                }}
                onCancel={() => setShowDenyReason(false)}
            />
        </>
    );
}
