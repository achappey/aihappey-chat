import { getToolName } from "../../tools/useTools";

export function shouldForceToolChoiceNone(
    messages: any[] | undefined,
    stopTools: string[] | undefined
): boolean {
    if (!Array.isArray(messages) || messages.length === 0) return false;
    if (!Array.isArray(stopTools) || stopTools.length === 0) return false;

    const lastMsg = messages[messages.length - 1];
    // IMPORTANT: only on the “auto submit” step (your sendAutomaticallyWhen already does this)
    if (!lastMsg || lastMsg.role !== "assistant") return false;

    const parts = Array.isArray(lastMsg.parts) ? lastMsg.parts : [];
    if (parts.length === 0) return false;

    const stopSet = new Set(stopTools.map((s) => String(s).toLowerCase().trim()));

    return parts.some((p: any) => {
        const type = String(p?.type ?? "");
        if (!type.startsWith("tool-")) return false;

        const name =
            String(p?.toolName ?? getToolName(type) ?? type.replace(/^tool-/, "")).toLowerCase();

        if (!stopSet.has(name)) return false;

        const state = String(p?.state ?? "");
        const completed =
            state === "output-available" ||
            state === "output-error" ||
            state === "approval-responded";

        return completed;
    });
}
