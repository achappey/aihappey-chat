import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "aihappey-types";
import { ToolContent, useTheme, ViewButton } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ToolCallResultModal } from "../chat/activity/content/ToolCallResultModal";

type ApprovalToolPart = {
    type: string;
    toolCallId: string;
    state?: string;
    approval?: { id: string };
    input?: any;
    output?: any;
    errorText?: string;
};

function findPendingApproval(messages: UIMessage[]) {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return undefined;

    const parts = (lastAssistant.parts ?? []) as any[];

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

    for (let pi = parts.length - 1; pi >= 0; pi--) {
        const p = parts[pi] as ApprovalToolPart;

        if (
            typeof p?.type === "string" &&
            p.type.startsWith("tool-") &&
            p.state === "approval-requested" &&
            p.approval?.id
        ) {
            return { tool: p, approvalId: p.approval.id };
        }
    }

    return undefined;
}

function shouldAutoApprove(
    tool: ApprovalToolPart,
    approveAll: boolean,
    allowedToolList: string[]
) {
    if (approveAll) return true;

    const toolName = tool.type.replace("tool-", "");
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
    const { Modal, Button, TextArea, SplitButton } = useTheme();
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

    // ✅ View Output modal state
    const [showOutput, setShowOutput] = useState(false);

    // ✅ Deny-with-reason modal state
    const [showDenyReason, setShowDenyReason] = useState(false);
    const [denyReason, setDenyReason] = useState("");

    // Reset small UI state when switching to a new approval id
    useEffect(() => {
        setShowOutput(false);
        setShowDenyReason(false);
        setDenyReason("");
    }, [active?.approvalId]);

    // 🔁 AUTO APPROVAL (with reason)
    useEffect(() => {
        if (!active || !autoApprove) return;
        if (lastAutoApprovedId.current === active.approvalId) return;

        lastAutoApprovedId.current = active.approvalId;

        addToolApprovalResponse({
            id: active.approvalId,
            approved: true,
            reason: approveAll ? "YOLO" : "allowList",
        });
    }, [active, autoApprove, approveAll, addToolApprovalResponse]);

    const showModal = (!!active && !autoApprove);
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

        // Continue flow immediately
        /* addToolApprovalResponse({
           id: active.approvalId,
           approved: false,
         });
     */
        // Optional: ask for reason AFTER decline
        setShowDenyReason(true);
    };

    const submitDenyReason = () => {
        if (!active?.approvalId) return;

        const r = (denyReason ?? "").trim();
        /*  if (!r) {
            setShowDenyReason(false);
            return;
          }*/

        addToolApprovalResponse({
            id: active.approvalId,
            approved: false,
            reason: r,
        });

        // Send a *second* response carrying the reason (safe if backend treats as metadata / last-write-wins)
        /*  addToolApprovalResponse({
            id: active.approvalId,
            approved: false,
            reason: r,
          });*/

        setShowDenyReason(false);
    };

    const closeDenyReason = () => {
        // user skipped reason; just close and continue

        setShowDenyReason(false);
        /* addToolApprovalResponse({
             id: active.approvalId,
             approved: false,
         });*/
    };

    const allowThisTool = () => {
        if (!active?.approvalId) return;

        addToolApprovalResponse({
            id: active.approvalId,
            approved: true,
            reason: "allowTool",
        });

        // voeg tool toe aan allowlist
        const toolName = active?.tool?.type?.replace("tool-", "");
        if (toolName) {
            addAllowedTool(toolName)
        }
    };

    const allowAllToolsYolo = () => {
        if (!active?.approvalId) return;

        addToolApprovalResponse({
            id: active.approvalId,
            approved: true,
            reason: "YOLO",
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
                    <div style={{ display: "flex", gap: 8 }}>
                        <ViewButton variant="subtle"
                            onClick={() => setShowOutput(true)}
                            disabled={!active?.tool?.output} />

                        <SplitButton
                            label={t("automatic")}
                            variant="secondary"
                            onClick={allowThisTool}
                            menuItems={[
                                {
                                    key: "allow-this-tool",
                                    label: t('thisTool', { toolName: toolTitle ?? toolName }),
                                    onClick: allowThisTool,
                                },
                                {
                                    key: "allow-all-tools",
                                    icon: 'warning',
                                    label: t('allTools') + " (YOLO)",
                                    onClick: allowAllToolsYolo,
                                },
                            ]}
                        />


                        <Button variant="primary" onClick={respondAllow}>
                            {t("allow")}
                        </Button>

                        <Button variant="informative" onClick={respondDeny}>
                            {t("deny")}
                        </Button>
                    </div>
                }
            >
                <ToolContent invocation={active.tool as any} />
            </Modal>

            {/* NEW: OUTPUT MODAL (reuse existing component) */}
            <ToolCallResultModal
                open={showOutput}
                onClose={() => setShowOutput(false)}
                result={active?.tool?.output}
            />

            {/* NEW: OPTIONAL REASON MODAL AFTER DENY */}
            <Modal
                show={showDenyReason}
                onHide={closeDenyReason}
                title={t("toolDeny")}
                actions={
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="primary"
                            disabled={!denyReason || denyReason.length == 0}
                            onClick={submitDenyReason}>
                            {t("deny")}
                        </Button>
                        <Button variant="subtle" onClick={closeDenyReason}>
                            {t("cancel")}
                        </Button>
                    </div>
                }
            >
                <TextArea
                    value={denyReason}
                    required
                    label={t("reason")}
                    // keep your existing behavior if your TextArea gives value directly
                    onChange={(e: any) => setDenyReason(e)}
                    rows={3}
                />
            </Modal>
        </>
    );
}
