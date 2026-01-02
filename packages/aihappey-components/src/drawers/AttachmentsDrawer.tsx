import { useTranslation } from "aihappey-i18n";
import { FileUIPart } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";
import { FileAttachmentCard } from "../cards";

interface AttachmentsDrawerProps {
  open: boolean;
  attachments: FileUIPart[];
  onClose: () => void;
  size?: "medium" | "small"
}

export const AttachmentsDrawer = ({
  open,
  attachments,
  size,
  onClose,
}: AttachmentsDrawerProps) => {
  const { Drawer } = useTheme();
  const { t } = useTranslation();

  return (
    <Drawer open={open}
      overlay
      size={size}
      onClose={onClose}
      title={t('attachments')}>
      {attachments.map((s, i) => (
        <FileAttachmentCard key={i} file={s} />
      ))}

    </Drawer>
  );
};
