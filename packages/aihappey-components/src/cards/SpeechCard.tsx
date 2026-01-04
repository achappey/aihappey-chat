import { useTheme } from "../theme/ThemeContext";
import { SpeechResponse, TranscriptionResponse } from "aihappey-ai";
import { LimitedTextField } from "../fields";
import { AudioCard } from "./AudioCard";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps } from "aihappey-types";

interface SpeechCardProps {
    speech: SpeechResponse
    onDelete?: () => void
}

export const SpeechCard = ({ speech, onDelete }: SpeechCardProps) => {
    const { Card, Menu } = useTheme();
    const { t } = useTranslation();

    const menuItems: MenuItemProps[] = [
        {
            key: "delete",
            label: t("delete"),
            onClick: onDelete,
        },
    ];

    const headerActions = onDelete ? <Menu items={menuItems} /> : undefined;

    return (
        <Card title={""} headerActions={headerActions}>
            <audio controls style={{ width: "100%", height: 50 }}>
                <source src={speech.audio} />
                Your browser does not support the audio element.
            </audio>
        </Card>

    );
};
