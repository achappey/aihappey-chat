import { useRef, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps } from "aihappey-types";
import { UrlAttachmentModal } from "./UrlAttachmentModal";
import type { UrlAttachment } from "./urlAttachment";

type Props = {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  onAddUrl: (part: UrlAttachment) => void;
};

export const MediaAttachmentMenu = ({ disabled, onFilesSelected, onAddUrl }: Props) => {
  const { Button, Menu } = useTheme();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const items: MenuItemProps[] = [
    {
      key: "select-file",
      label: t("attachments"),
      icon: "attachment",
      disabled,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      key: "add-url",
      label: t("urlAttachment.title"),
      icon: "attachment",
      disabled,
      onClick: () => setUrlModalOpen(true),
    },
  ];

  return <>
    <Menu align="left" direction="top" size="medium" items={items}
      trigger={<Button type="button" icon="add" size="large" variant="transparent"
        title={t("add")} disabled={disabled} />} />
    <input ref={fileInputRef} type="file" multiple hidden disabled={disabled}
      onChange={(e) => {
        if (!e.target.files) return;
        onFilesSelected(Array.from(e.target.files));
        e.target.value = "";
      }} />
    <UrlAttachmentModal mode="url" open={urlModalOpen} onHide={() => setUrlModalOpen(false)}
      onAdd={onAddUrl} />
  </>;
};
