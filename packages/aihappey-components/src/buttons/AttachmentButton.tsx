import { useRef } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { IconToken } from "aihappey-types";

type AttachmentButtonProps = {
    disabled?: boolean;
    icon?: IconToken
    onFilesSelected: (files: File[]) => void;
};

export const AttachmentButton = ({
    disabled,
    icon = "attachment",
    onFilesSelected,
}: AttachmentButtonProps) => {
    const { Button } = useTheme();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <Button
                type="button"
                icon={icon}
                variant="transparent"
                size="large"
                title={t("attachments")}
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
            />
            <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                    if (!e.target.files) return;
                    onFilesSelected(Array.from(e.target.files));
                    e.target.value = "";
                }}
            />
        </>
    );
};
