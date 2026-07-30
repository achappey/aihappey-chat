import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

type ClientCapabilitiesFormProps = {
    capabilities?: Record<string, any>;
    onChange: (key: "elicitation", value: any) => void;
};

export const ClientCapabilitiesForm = ({
    capabilities,
    onChange,
}: ClientCapabilitiesFormProps) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const toggle = (key:"elicitation") => {
        const current = capabilities?.[key];
        onChange(key, current != null ? undefined : {});
    };

    return (
        <theme.Card size="small"
            title={t("agents.mcpClientCapabilities")}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                }}
            >
                <theme.Switch
                    id="elicitation"
                    label={t("elicit")}
                    checked={capabilities?.elicitation}
                    onChange={() => toggle("elicitation")}
                />
            </div>
        </theme.Card>
    );
};
