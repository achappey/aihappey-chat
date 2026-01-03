import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export const TogetherChatConfigForm = ({
    config,
    updateConfig,
}: {
    config: any;
    updateConfig: (val: any) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const options = EFFORTS.map((v) => ({
        value: v,
        label: t(v),
    }));

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 18
        }}>
            <theme.Card size="small" title={t("reasoning")}>
                <div>
                    <theme.Select
                        label={t("reasoningEffort", {
                            reasoningEffort: t(config?.reasoning_effort ?? "none")
                        })}
                        values={[config?.reasoning_effort ?? ""]}
                        valueTitle={
                            options.find((o) => o.value === config?.reasoning_effort)?.label
                        }
                        options={options}
                        onChange={(val: string) =>
                            updateConfig({
                                ...config,
                                reasoning_effort: val as Effort,
                            })
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
