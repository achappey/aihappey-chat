import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORT_OPTIONS = ["", "none", "minimal", "low", "medium", "high", "xhigh"] as const;
const REASONING_SUMMARY_OPTIONS = ["", "auto", "detailed", "concise"] as const;

const parseOptionalInteger = (value: unknown) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return undefined;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const pruneEmptyObject = <T extends Record<string, any>>(value: T) => {
    const entries = Object.entries(value).filter(([, item]) => {
        if (item === undefined || item === null || item === "") return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item).length > 0;
        return true;
    });

    return entries.length ? Object.fromEntries(entries) : undefined;
};

const optionItems = (values: readonly string[], notSetLabel: string) =>
    values.map((value) => ({ value, label: value || notSetLabel }));

const selectLabel = (value: string | undefined, notSetLabel: string) => value || notSetLabel;

const compactStack = { display: "flex", flexDirection: "column", gap: 12 } as const;
const twoColumnGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 0,
    width: "100%",
    alignItems: "end",
} as const;

const tk = (t: (key: string, options?: any) => string, key: string, fallback: string) =>
    t(`providers:blackbox.${key}`) ?? fallback;

export const BlackboxChatConfigForm = ({
    config,
    updateConfig,
}: {
    config: any;
    updateConfig: (val: any) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const tr = (key: string, fallback: string) => tk(t, key, fallback);
    const notSetLabel = tr("notSet", "Not set");
    const reasoning = config?.reasoning ?? {};

    const updateReasoning = (patch: Record<string, any>) => {
        const nextReasoning = pruneEmptyObject({
            ...reasoning,
            ...patch,
        });

        updateConfig({
            ...(config ?? {}),
            reasoning: nextReasoning,
        });
    };

    const updateZdr = (enabled: boolean) => {
        const provider = pruneEmptyObject({
            ...(config?.provider ?? {}),
            zdr: enabled ? true : undefined,
        });

        updateConfig({
            ...(config ?? {}),
            provider,
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card
                size="small"
                title={tr("zdr", "Zero Data Retention")}
                headerActions={
                    <theme.Switch
                        id="blackboxZdr"
                        checked={!!config?.provider?.zdr}
                        onChange={updateZdr}
                    />
                }
            >
            </theme.Card>

            <theme.Card size="small" title={tr("reasoning", "Reasoning")}>
                <div style={compactStack}>
                    <div style={twoColumnGrid}>
                        <theme.Select
                            label={tr("effort", "Effort")}
                            values={[reasoning?.effort ?? ""]}
                            valueTitle={selectLabel(reasoning?.effort, notSetLabel)}
                            options={optionItems(REASONING_EFFORT_OPTIONS, notSetLabel)}
                            onChange={(value: string) =>
                                updateReasoning({
                                    effort: value || undefined,
                                })
                            }
                        >
                            {REASONING_EFFORT_OPTIONS.map((value) => (
                                <option key={value || "unset"} value={value}>{t(value) || notSetLabel}</option>
                            ))}
                        </theme.Select>

                        <theme.Select
                            label={tr("summary", "Summary")}
                            values={[reasoning?.summary ?? ""]}
                            valueTitle={selectLabel(reasoning?.summary, notSetLabel)}
                            options={optionItems(REASONING_SUMMARY_OPTIONS, notSetLabel)}
                            onChange={(value: string) =>
                                updateReasoning({
                                    summary: value || undefined,
                                })
                            }
                        >
                            {REASONING_SUMMARY_OPTIONS.map((value) => (
                                <option key={value || "unset"} value={value}>{t(value) || notSetLabel}</option>
                            ))}
                        </theme.Select>
                    </div>

                    <theme.Input
                        label={tr("maxTokens", "Max reasoning tokens")}
                        type="number"
                        min={0}
                        step={1}
                        value={reasoning?.max_tokens ?? ""}
                        onChange={(e: any) =>
                            updateReasoning({
                                max_tokens: parseOptionalInteger(e.target.value),
                            })
                        }
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <theme.Switch
                            id="blackboxReasoningEnabled"
                            label={tr("enabled", "Enable reasoning defaults")}
                            checked={!!reasoning?.enabled}
                            onChange={(enabled) =>
                                updateReasoning({
                                    enabled: enabled ? true : undefined,
                                })
                            }
                        />
                        <theme.Switch
                            id="blackboxReasoningExclude"
                            label={tr("exclude", "Exclude reasoning from response")}
                            checked={!!reasoning?.exclude}
                            onChange={(enabled) =>
                                updateReasoning({
                                    exclude: enabled ? true : undefined,
                                })
                            }
                        />
                    </div>
                </div>
            </theme.Card>
        </div>
    );
};

