import { useTheme } from "../theme/ThemeContext";
import { TranscriptionResponse } from "aihappey-ai";
import { LimitedTextField } from "../fields";
import React, { useState } from "react";
import { ViewButton } from "../buttons";
import { TranscriptionDetailsModal } from "../modals";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps } from "aihappey-types";

interface TranscriptionCardProps {
    transcription: TranscriptionResponse
    filename: string
    file: Blob
    onDelete?: () => void
}

export const TranscriptionCard = ({ transcription, file, filename, onDelete }: TranscriptionCardProps) => {
    const { Card, Menu } = useTheme();
    const { t } = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);

    const menuItems: MenuItemProps[] = [
        {
            key: "delete",
            label: t("delete"),
            onClick: onDelete,
        },
    ];

    const headerActions = onDelete ? <Menu items={menuItems} /> : undefined;

    const actions = (
        <ViewButton
            title={t("viewTranscription")}
            variant="transparent"
            size="small"
            onClick={() => setDetailsOpen(true)}
        />
    );

    return (
        <>
            <Card title={filename}
                size="small"
                actions={actions}
                headerActions={headerActions}>
                <LimitedTextField text={transcription.text} />
            </Card>

            <TranscriptionDetailsModal
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                transcription={transcription}
                audio={file}
                audioFilename={filename}
            />
        </>
    );
};
