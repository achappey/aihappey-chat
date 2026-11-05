export type ToolApprovalDecision = {
    id: string;
    approved: boolean;
    reason?: string;
    signature?: string;
    isAutomatic?: boolean;
};

/** The SDK retains approval fields, but its response API does not accept metadata.
 * Attach it before calling that API so automatic continuation and persistence see it.
 * Never replace the gateway signature with caller-supplied data.
 */
export function withToolApprovalMetadata<T extends { parts: any[] }>(messages: T[], decision: ToolApprovalDecision): T[] {
    return messages.map(message => ({ ...message, parts: message.parts.map(part =>
        part.state === "approval-requested" && part.approval?.id === decision.id
            ? { ...part, approval: { ...part.approval, isAutomatic: decision.isAutomatic === true } }
            : part),
    }));
}

/** Turn/conversation-local overlay for the SDK's separate in-flight stream snapshot.
 * Reconcile at presentation, persistence and transport boundaries, so decisions may
 * still be made while streaming without losing metadata on subsequent chunks.
 */
export function createToolApprovalMetadata() {
    const entries = new Map<string, { isAutomatic: boolean; signature?: string }>();
    const key = (message: { id: string }, part: any) => JSON.stringify([message.id, part.toolCallId, part.approval?.id]);
    return {
        remember(messages: { id: string; parts: any[] }[], decision: ToolApprovalDecision) {
            for (const message of messages) for (const part of message.parts) {
                if (part.state !== "approval-requested" || part.approval?.id !== decision.id) continue;
                entries.set(key(message, part), { isAutomatic: decision.isAutomatic === true, signature: part.approval.signature });
            }
        },
        apply<T extends { id: string; parts: any[] }>(messages: T[]): T[] {
            if (!entries.size) return messages;
            let changed = false;
            const next = messages.map(message => {
                let messageChanged = false;
                const parts = message.parts.map(part => {
                    const metadata = part.approval && entries.get(key(message, part));
                    if (!metadata || part.approval.isAutomatic === metadata.isAutomatic && part.approval.signature === metadata.signature) return part;
                    changed = messageChanged = true;
                    return { ...part, approval: { ...part.approval, ...metadata } };
                });
                return messageChanged ? { ...message, parts } : message;
            });
            return changed ? next : messages;
        },
    };
}
