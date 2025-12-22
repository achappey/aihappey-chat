import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

type McpClientCapabilitiesCardProps = {
    capabilities?: Record<string, any>;
    onChange: (key: "sampling" | "elicitation", value: any) => void;
};

export const McpClientCapabilitiesCard = ({
    capabilities,
    onChange,
}: McpClientCapabilitiesCardProps) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const toggle = (key: "sampling" | "elicitation") => {
        const current = capabilities?.[key];
        onChange(key, current != null ? undefined : {});
    };

    return (
        <theme.Card size="small" title={t("agents.mcpClientCapabilities")}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                }}
            >
                <theme.Switch
                    id="sampling"
                    label={t("sampling")}
                    checked={capabilities?.sampling}
                    onChange={() => toggle("sampling")}
                />

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
