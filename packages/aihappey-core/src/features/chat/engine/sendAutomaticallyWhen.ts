export function sendAutomaticallyWhen(options?: { messages?: any[] }): boolean {
    const messages = (options?.messages ?? []) as any[];
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return false;

    const parts = (lastMessage.parts?.filter((a: any) => !a.type.startsWith("data-")) ?? []) as any[];
    if (parts.length === 0) return false;

    const lastPart = parts[parts.length - 1];

    // HARD STOP: eindigt assistant in text → nooit auto-submit (voorkomt loops)
    if (lastPart?.type === "text") return false;

    // Blokkeer zolang er approvals openstaan
    if (parts.some(p => p?.type?.startsWith("tool-") && p.state === "approval-requested"))
        return false;

    // Alleen submitten als laatste part een ready tool-part is
    return (
        typeof lastPart?.type === "string" &&
        lastPart.type.startsWith("tool-") &&
        (lastPart.state === "output-available" ||
            lastPart.state === "approval-responded") &&
        !lastPart.providerExecuted
    );
}
