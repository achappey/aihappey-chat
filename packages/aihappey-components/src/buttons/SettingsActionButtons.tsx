import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type SettingsActionButtonsProps = {
    onDownload?: () => void;
    onRestoreDefaults?: () => void;
    onClose?: () => void;

};

export const SettingsActionButtons = ({
    onDownload,
    onRestoreDefaults,
    onClose,
}: SettingsActionButtonsProps) => {
    const { Button } = useTheme();
    const { t } = useTranslation();

    return (
        <>
            {onDownload && (
                <Button
                    variant="informative"
                    icon="download"
                    onClick={onDownload}
                    title={t("download")}
                />
            )}

            {onRestoreDefaults && (
                <Button
                    variant="subtle"
                    onClick={onRestoreDefaults}
                >
                    {t("resetDefaults")}
                </Button>
            )}

            {onClose && (
                <Button variant="secondary" onClick={onClose}>
                    {t("close")}
                </Button>
            )}
        </>
    );
};
