import type { UIMessage } from "aihappey-types";
import { sendAutomaticallyWhen } from "./sendAutomaticallyWhen";
import { activeAssistantMessages, isAgentToolPart, pendingToolApprovals } from "./toolApprovalState";

const readyParts = (messages: UIMessage[]) => activeAssistantMessages(messages).flatMap(message =>
    message.parts.filter(part => isAgentToolPart(part) && part.preliminary !== true && (
        part.state === "approval-responded" || (!part.providerExecuted && ["output-available", "output-error"].includes(part.state))
    )).map(part => ({ message, part, key: JSON.stringify([
        [...messages].reverse().find(item => item.role === "user")?.id,
        ...(typeof part.approval?.approved === "boolean"
            ? [part.toolCallId, part.approval.id, part.approval.approved, part.approval.reason]
            : [part.toolCallId, part.state]),
    ]) })));

/** Shared SDK auto-continuation policy for Agent Chat and voice-enabled custom agents.
 * This tracks submitted batches, not approval decisions: those remain solely in SDK messages.
 */
export function createAgentChatContinuation() {
    const submitted = new Set<string>();
    return {
        submitted(messages: UIMessage[]) { for (const entry of readyParts(messages)) submitted.add(entry.key); },
        shouldSend({ messages = [] }: { messages?: UIMessage[] }) {
            if (pendingToolApprovals(messages).length) return false;
            const active = activeAssistantMessages(messages);
            if (active.some(message => message.parts.some(part => isAgentToolPart(part) && !part.providerExecuted
                && ["input-streaming", "input-available"].includes(part.state)))) return false;
            const fresh = readyParts(messages).filter(entry => !submitted.has(entry.key));
            if (!fresh.length) return false;
            // An earlier streamed message can request approval even if a later message has text.
            // Ordinary tool-only continuation retains the existing final-text hard stop.
            if (!fresh.some(entry => entry.part.state === "approval-responded") && !sendAutomaticallyWhen({ messages })) return false;
            for (const entry of fresh) submitted.add(entry.key);
            return true;
        },
    };
}
