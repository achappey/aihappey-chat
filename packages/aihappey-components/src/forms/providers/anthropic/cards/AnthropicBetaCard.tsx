import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const BETA_OPTIONS = [
    "message-batches-2024-09-24",
    "computer-use-2025-01-24",
    "pdfs-2024-09-25",
    "token-efficient-tools-2025-02-19",
    "output-128k-2025-02-19",
    "files-api-2025-04-14",
    "mcp-client-2025-04-04",
    "mcp-client-2025-11-20",
    "dev-full-thinking-2025-05-14",
    "interleaved-thinking-2025-05-14",
    "code-execution-2025-05-22",
    "context-management-2025-06-27",
    "model-context-window-exceeded-2025-08-26",
    "fine-grained-tool-streaming-2025-05-14",
    "skills-2025-10-02",
    "fast-mode-2026-02-01",
    "output-300k-2026-03-24",
    "mid-conversation-tool-changes-2026-07-01",
    "managed-agents-2026-04-01",
    "task-budgets-2026-03-13",
    "server-side-fallback-2026-07-01",
    "advisor-tool-2026-03-01",
    "cache-diagnosis-2026-04-07"
];

const parseAnthropicBeta = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return Array.from(
            new Set(
                value
                    .filter((item): item is string => typeof item === "string")
                    .map((item) => item.trim())
                    .filter(Boolean)
            )
        );
    }

    if (typeof value === "string") {
        return Array.from(
            new Set(
                value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
            )
        );
    }

    return [];
};

const SORTED_BETA_OPTIONS = [...BETA_OPTIONS].sort((a, b) =>
    a.localeCompare(b)
);

export const AnthropicBetaCard = ({
    config,
    headers,
    updateConfig,
    updateHeaders,
}: {
    config: any;
    headers?: Record<string, string>;
    updateConfig: (val: any) => void;
    updateHeaders?: (val: Record<string, string> | undefined) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const enabled = parseAnthropicBeta(headers?.["anthropic-beta"] ?? config?.["anthropic-beta"]);

    const toggleOption = (option: string, isOn: boolean) => {
        const next = isOn
            ? Array.from(new Set([...enabled, option]))
            : enabled.filter((item: string) => item !== option);
        const nextHeaders = { ...(headers ?? {}) };
        const serialized = next.join(",");

        if (serialized) {
            nextHeaders["anthropic-beta"] = serialized;
        } else {
            delete nextHeaders["anthropic-beta"];
        }

        if (updateHeaders) {
            updateHeaders(Object.keys(nextHeaders).length ? nextHeaders : undefined);
            return;
        }

        updateConfig({
            ...config,
            "anthropic-beta": serialized || undefined,
        });
    };

    return (
        <theme.Card size="small" title={t("providers:anthropic.betaHeader")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
                {SORTED_BETA_OPTIONS.map((option) => (
                    <div key={option}>
                        <theme.Switch
                            id={option}
                            label={option}
                            size="small"
                            checked={enabled.includes(option)}
                            onChange={(val: boolean) => toggleOption(option, val)}
                        />
                    </div>
                ))}
            </div>
        </theme.Card>
    );
};
