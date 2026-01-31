import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const BETA_OPTIONS = [
    "code-execution-2025-08-25",
    "files-api-2025-04-14",
    "output-128k-2025-02-19",
    "interleaved-thinking-2025-05-14",
    "web-fetch-2025-09-10",
    "context-management-2025-06-27",
    "fine-grained-tool-streaming-2025-05-14",
    "mcp-client-2025-04-04",
    "skills-2025-10-02",
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
