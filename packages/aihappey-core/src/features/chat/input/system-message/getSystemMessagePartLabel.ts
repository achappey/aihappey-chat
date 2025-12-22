/**
 * Returns a human-readable label for a system message part.
 * - Tries to parse part.text as JSON and inspects its structure.
 * - Returns a label based on known keys, or a fallback.
 */
export function getSystemMessagePartLabel(chatAppName: string, t: any,
    part: { text: string }, index: number): string {
    let parsed: any;
    try {
        parsed = JSON.parse(part.text);
    } catch {
        // Not JSON, treat as plain text
        if (part.text && part.text.length > 0) return t('userContext');
        return `Part ${index + 1}`;
    }

    if (parsed && typeof parsed === "object") {

        if (parsed.modelContextProtocolServer) {
            return parsed.modelContextProtocolServer?.name;
            /*
            const pathname = new URL(parsed.modelContextProtocolServer.mcpServerUrl).pathname;
            const lastSegment = pathname.split("/").filter(Boolean).pop();

            return `${lastSegment}`*/
        };

        if (parsed.chatBotInstructions) return chatAppName;
        if (parsed.systemInformation) return t('systemContext');
        if (parsed.username || parsed.name || parsed.id) return parsed.name;
    }

    return `Part ${index + 1}`;
}