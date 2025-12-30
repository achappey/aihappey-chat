import { useTheme } from "../theme/ThemeContext";

type SettingsActionButtonsProps = {
    onDownload?: () => void;
    onRestoreDefaults?: () => void;
    onClose?: () => void;

    translations?: {
        download?: string;
        restoreDefaults?: string;
        close?: string;
    };
};

export const SettingsActionButtons = ({
    onDownload,
    onRestoreDefaults,
    onClose,
    translations,
}: SettingsActionButtonsProps) => {
    const { Button } = useTheme();

    return (
        <>
            {onDownload && (
                <Button
                    variant="informative"
                    icon="download"
                    onClick={onDownload}
                    title={translations?.download ?? "download"}
                />
            )}

            {onRestoreDefaults && (
                <Button
                    variant="subtle"
                    onClick={onRestoreDefaults}
                >
                    {translations?.restoreDefaults ?? "restoreDefaults"}
                </Button>
            )}

            {onClose && (
                <Button variant="secondary" onClick={onClose}>
                    {translations?.close ?? "close"}
                </Button>
            )}
        </>
    );
};
