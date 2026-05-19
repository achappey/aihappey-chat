import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type OpenHandsChatConfig = {
    selected_repository?: string;
};

const optionalString = (value: string) => {
    const trimmed = String(value ?? "").trim();
    return trimmed ? trimmed : undefined;
};

export const OpenHandsChatConfigForm = ({
    config,
    updateConfig,
}: {
    config: OpenHandsChatConfig;
    updateConfig: (val: OpenHandsChatConfig) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card size="small" title="OpenHands">
            <div>
                <theme.Input
                    id="openhands-selected-repository"
                    label={t("repository") ?? "Repository"}
                    placeholder="owner/repo"
                    value={config?.selected_repository ?? ""}
                    onChange={(e: any) =>
                        updateConfig({
                            selected_repository: optionalString(e?.target?.value),
                        })
                    }
                />
            </div>
        </theme.Card>
    );
};

