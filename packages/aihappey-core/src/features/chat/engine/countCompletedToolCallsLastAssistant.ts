export function countCompletedToolCallsLastAssistant(
    messages: any[] | undefined
): number {
    if (!Array.isArray(messages) || messages.length === 0) return 0;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return 0;

    const parts = Array.isArray(lastMsg.parts) ? lastMsg.parts : [];
    if (parts.length === 0) return 0;

    return parts.filter((p: any) => {
        const type = String(p?.type ?? "");
        if (!type.startsWith("tool-")) return false;

        const state = String(p?.state ?? "");
        return (
            state === "output-available" ||
            state === "output-error" ||
            state === "approval-responded"
        );
    }).length;
}