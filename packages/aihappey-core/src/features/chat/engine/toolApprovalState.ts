import type { UIMessage } from "aihappey-types";

export const isAgentToolPart = (part: any) =>
    typeof part?.type === "string" && (part.type.startsWith("tool-") || part.type === "dynamic-tool");

export const approvalToolName = (part: any): string =>
    part?.toolName ?? (part?.type?.startsWith("tool-") ? part.type.slice(5) : "");

/** Only the current user turn participates; cancelled history must never reopen approval UI. */
export function activeAssistantMessages(messages: UIMessage[]) {
    let start = messages.length - 1;
    while (start >= 0 && messages[start].role !== "user") start--;
    return messages.slice(start + 1).filter(message => message.role === "assistant"
        && !message.metadata?.interrupted && !message.metadata?.cancelled);
}

export function pendingToolApprovals(messages: UIMessage[]) {
    const byId = new Map<string, { message: UIMessage; tool: any; approvalId: string }>();
    const answered = new Set<string>();
    for (const message of activeAssistantMessages(messages)) {
        for (const tool of message.parts ?? []) {
            if (!isAgentToolPart(tool) || !tool.approval?.id) continue;
            if (typeof tool.approval.approved === "boolean") answered.add(tool.approval.id);
            else if (tool.state === "approval-requested") byId.set(tool.approval.id, { message, tool, approvalId: tool.approval.id });
        }
    }
    return [...byId.values()].filter(entry => !answered.has(entry.approvalId));
}

/** Retain interrupted results in UI history, not in a later inference request without consent. */
export function agentRequestMessages(messages: UIMessage[]) {
    return messages.map(message => !(message.metadata?.interrupted || message.metadata?.cancelled) ? message : {
        ...message,
        parts: message.parts.filter(part => !isAgentToolPart(part)
            || typeof part.approval?.approved === "boolean"
            || (part.providerExecuted && !part.approval)),
    }).filter(message => message.parts.length > 0);
}
