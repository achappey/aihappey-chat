import { useTranslation } from "aihappey-i18n";
import { useIsDesktop } from "../../../shell/responsive/useIsDesktop";
import { FileAttachmentCard, useTheme } from "aihappey-components";
import { FileUIPart } from "aihappey-ai";

interface AttachmentsDrawerProps {
  open: boolean;
  attachments: FileUIPart[];
  onClose: () => void;
}

export const AttachmentsDrawer = ({
  open,
  attachments,
  onClose,
}: AttachmentsDrawerProps) => {
  const { Drawer } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  return (
    <Drawer open={open} overlay
      size={isDesktop ? "medium" : "small"}
      onClose={onClose}
      title={t('attachments')}>
      {attachments.map((s, i) => (
        <FileAttachmentCard key={i} file={s} />
      ))}

    </Drawer>
  );
};
