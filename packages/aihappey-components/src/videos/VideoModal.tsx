import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { VideoContent } from "./VideoGrid";

export interface VideoModalProps {
  open: boolean;
  video: VideoContent;
  onClose: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onAddToPrompt?: () => void;
}

export const VideoModal = ({
  open,
  video,
  onClose,
  onDownload,
  onDelete,
  onAddToPrompt,
}: VideoModalProps) => {
  const { Modal, Button } = useTheme();
  const { t } = useTranslation();

  const src = /^(data:|blob:|https?:\/\/)/i.test(video.data)
    ? video.data
    : `data:${video.mimeType};base64,${video.data}`;

  return (
    <Modal
      show={open}
      onHide={onClose}
      title={t("video")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <video
          src={src}
          controls
          playsInline
          style={{ width: "100%" }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {onAddToPrompt && (
            <Button variant="subtle" icon="add" onClick={onAddToPrompt}>
              {t("addToPrompt")}
            </Button>
          )}
          {onDelete && (
            <Button variant="subtle" icon="delete" onClick={onDelete}>
            </Button>
          )}
          {onDownload && (
            <Button variant="subtle" icon="download" onClick={onDownload}>
              {t("download")}
            </Button>
          )}

          <Button variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
