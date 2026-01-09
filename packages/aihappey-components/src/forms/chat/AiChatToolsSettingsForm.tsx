import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

export type AiChatToolSettings = {
    stopTools?: string[]
    maxToolCalls?: number
    /** Stored as `none | required`, while `undefined` means `auto`. */
    toolChoice?: string
};

type AiChatToolsSettingsFormProps = {
    value: AiChatToolSettings
    onChange: (settings: AiChatToolSettings) => void

    /** Names of currently attached tools (dropdown options for `stopTools`). */
    availableTools?: string[]
    formTitle?: string
};

export const AiChatToolsSettingsForm = ({
    value,
    onChange,
    availableTools = [],
    formTitle,
}: AiChatToolsSettingsFormProps) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const canRequireTools = (settings: AiChatToolSettings) =>
        (settings?.maxToolCalls ?? 0) > 0 || (settings?.stopTools?.length ?? 0) > 0;

    const normalizeToolChoice = (settings: AiChatToolSettings): AiChatToolSettings => {
        // If toolChoice is `required`, ensure the constraints that make it valid exist.
        const choice = settings?.toolChoice ?? "auto";
        if (choice === "required" && !canRequireTools(settings)) {
            // downgrade to auto (stored as `undefined`)
            return { ...settings, toolChoice: undefined };
        }
        return settings;
    };

    // Render-safe derived state (do not let invalid persisted values break the UI).
    const safeValue = normalizeToolChoice(value);
    const toolChoiceValue = safeValue?.toolChoice ?? "auto";
    const stopTools = safeValue?.stopTools ?? [];
    const requiredEnabled = canRequireTools(safeValue);

    return (
        <theme.Card size="small" title={formTitle ?? (t("tools") ?? "Tools")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <theme.Select
                    label={t("toolChoice") ?? "toolChoice"}
                    values={[toolChoiceValue]}
                    valueTitle={t(toolChoiceValue)}
                    onChange={(choice: string) => {
                        // enforce: required only when stopTools OR maxToolCalls is set
                        const nextChoice = choice === "required" && !canRequireTools(safeValue)
                            ? "auto"
                            : choice;
                        onChange(
                            normalizeToolChoice({
                                ...safeValue,
                                toolChoice: nextChoice === "auto" ? undefined : nextChoice,
                            })
                        );
                    }}
                >
                    <option value="none">{t("none")}</option>
                    <option value="auto">{t("auto")}</option>
                    {requiredEnabled && <option value="required">{t("required")}</option>}
                </theme.Select>
                <theme.Input
                    type="number"
                    min={1}
                    step={1}
                    label={t("maxToolCalls") ?? "maxToolCalls"}
                    placeholder={t("optional") ?? "optional"}
                    value={safeValue?.maxToolCalls ?? ""}
                    onChange={(e: any) => {
                        const raw = String(e?.target?.value ?? "");
                        const parsed = raw.trim() ? parseInt(raw, 10) : NaN;
                        const maxToolCalls = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
                        onChange(
                            normalizeToolChoice({
                                ...safeValue,
                                maxToolCalls,
                            })
                        );
                    }}
                />

                <theme.Select
                    label={t("stopTools") ?? "stopTools"}
                    values={stopTools}
                    multiselect={true}
                    valueTitle={stopTools.length ? stopTools.join(", ") : undefined}
                    onChange={(toolName: string) => {
                        const prev = safeValue?.stopTools ?? [];
                        const next = prev.includes(toolName)
                            ? prev.filter((t) => t !== toolName)
                            : [...prev, toolName];
                        onChange(
                            normalizeToolChoice({
                                ...safeValue,
                                stopTools: next,
                            })
                        );
                    }}
                >
                    {availableTools.map((toolName) => (
                        <option key={toolName} value={toolName}>
                            {toolName}
                        </option>
                    ))}
                </theme.Select>


            </div>
        </theme.Card>
    );
};

