import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const BETA_OPTIONS = [
    "message-batches-2024-09-24",
    "prompt-caching-2024-07-31",
    "computer-use-2024-10-22",
    "computer-use-2025-01-24",
    "pdfs-2024-09-25",
    "token-counting-2024-11-01",
    "token-efficient-tools-2025-02-19",
    "output-128k-2025-02-19",
    "files-api-2025-04-14",
    "mcp-client-2025-04-04",
    "mcp-client-2025-11-20",
    "dev-full-thinking-2025-05-14",
    "interleaved-thinking-2025-05-14",
    "code-execution-2025-05-22",
    "extended-cache-ttl-2025-04-11",
    "context-1m-2025-08-07",
    "context-management-2025-06-27",
    "model-context-window-exceeded-2025-08-26",
    "skills-2025-10-02",
    "fast-mode-2026-02-01",
    "output-300k-2026-03-24",
    "advisor-tool-2026-03-01"
];

export const AnthropicBetaCard = ({
    config,
    updateConfig,
}: {
    config: any;
    updateConfig: (val: any) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const enabled = config?.["anthropic-beta"] ?? [];

    const toggleOption = (option: string, isOn: boolean) => {
        const next = isOn
            ? Array.from(new Set([...enabled, option]))
            : enabled.filter((item: string) => item !== option);

        updateConfig({
            ...config,
            "anthropic-beta": next,
        });
    };

    return (
        <theme.Card size="small" title={t("providers:anthropic.betaHeader")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
                {BETA_OPTIONS.map((option) => (
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
