
import { useTranslation } from "aihappey-i18n";
import { ImageCard, useTheme } from "aihappey-components";
import { ImageContent } from "@modelcontextprotocol/sdk/types";

export interface ImageModalProps {
    open: boolean;
    image: ImageContent
    onClose: () => void;
    onDownload: () => void;
    onDelete?: () => void;
    onAddToPrompt?: () => void;
}

export const ImageModal = ({
    open,
    onClose,
    onDownload,
    onDelete,
    onAddToPrompt,
    image,
}: ImageModalProps) => {
    const { t } = useTranslation();
    const { Modal, Button } = useTheme();

    return (
        <Modal show={open}
            size="large"
            actions={
                <>
                    {onDelete && <Button variant="ghost"
                        icon="delete"
                        onClick={onDelete}>
                    </Button>}
                    <Button variant="ghost"
                        icon="download"
                        onClick={onDownload}>
                        {t("download")}
                    </Button>
                    {onAddToPrompt && <Button variant="primary"
                        icon="aiImage"
                        onClick={onAddToPrompt}>
                        {t("variation")}
                    </Button>}
                    <Button variant="secondary"
                        onClick={onClose}>
                        {t("close")}
                    </Button>
                </>
            }
            onHide={onClose}
            title={t("image")}>
            <ImageCard image={image} fit="contain" />
        </Modal>
    );
};

