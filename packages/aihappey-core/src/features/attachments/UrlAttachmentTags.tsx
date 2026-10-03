import { useTheme } from "aihappey-components";
import { urlFilename } from "./urlAttachment";

type Props = {
  attachments: { url: string; filename?: string }[];
  onRemove: (url: string) => void;
};

/** Shared labels, size and removal affordance for chat and media URL attachments. */
export const UrlAttachmentTags = ({ attachments, onRemove }: Props) => {
  const { Tags } = useTheme();
  return <Tags size="small" items={attachments.map(part => ({
    key: part.url,
    icon: "attachment",
    label: part.filename ?? urlFilename(part.url) ?? part.url,
  }))} onRemove={onRemove} />;
};
