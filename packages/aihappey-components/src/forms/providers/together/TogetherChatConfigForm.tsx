import { useTheme } from "../../../theme/ThemeContext";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export type TogetherChatConfigFormTranslations = {
    reasoning?: string;
    reasoningEffort?: string;
    low?: string;
    medium?: string;
    high?: string;
};

export const TogetherChatConfigForm = ({
    config,
    updateConfig,
    translations,
}: {
    config: any;
    updateConfig: (val: any) => void;
    translations?: TogetherChatConfigFormTranslations;
}) => {
    const theme = useTheme();

    const options = EFFORTS.map((v) => ({
        value: v,
        label: (translations as any)?.[v] ?? v,
    }));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card
                size="small"
                title={translations?.reasoning ?? "reasoning"}
            >
                <div>
                    <theme.Select
                        label={translations?.reasoningEffort ?? "reasoningEffort"}
                        values={[config?.reasoning_effort ?? ""]}
                        valueTitle={
                            options.find((o) => o.value === config?.reasoning_effort)?.label
                        }
                        options={options}
                        onChange={(val: string) =>
                            updateConfig({ ...config, reasoning_effort: val as Effort })
                        }
                    >
                        {options.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>
        </div>
    );
};
