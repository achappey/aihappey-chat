import { useEffect, useId, useMemo, useState } from "react";
import type { UIMessage } from "aihappey-ai";
import type { StoredFile } from "aihappey-files";
import { FileAttachmentCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { FileDetailModal } from "../../../files/FileDetailModal";
import { collectActivityAttachments, type ActivityAttachment } from "../attachments";

export const AttachmentsActivity = ({ messages }: { messages?: UIMessage[] }) => {
  const { ToggleButton } = useTheme();
  const { t } = useTranslation();
  const id = useId();
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");
  const attachments = useMemo(() => collectActivityAttachments(messages), [messages]);
  const conversation = messages?.[0]?.id;
  const [selected, setSelected] = useState<{ conversation?: string; file: ActivityAttachment }>();
  const [preview, setPreview] = useState<StoredFile>();
  const [error, setError] = useState(false);
  const current = selected?.conversation === conversation
    && attachments[activeTab].some(file => file.url === selected?.file.url && file.mediaType === selected?.file.mediaType)
    ? selected?.file : undefined;

  useEffect(() => {
    setPreview(undefined);
    setError(false);
    if (!current) return;
    let cancelled = false;
    fetch(current.url)
      .then(response => {
        if (!response.ok) throw new Error("Attachment preview failed");
        return response.blob();
      })
      .then(data => {
        if (!cancelled) setPreview({
          id: "attachment-preview",
          name: current.filename || t("attachments"),
          createdAt: 0,
          data,
        });
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [current, selected, t]);

  return (
    <div style={{ padding: 8, display: "flex", gap: 12, minWidth: 0 }}>
      <div role="tablist" aria-label={t("attachments")} aria-orientation="vertical"
        style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        {(["input", "output"] as const).map((key, index) => (
          <ToggleButton key={key} id={`${id}-${key}`} role="tab"
            icon={key === "input" ? "attachment" : "toolResult"}
            size="small" variant="subtle" checked={activeTab === key}
            title={t(key)} aria-label={t(key)} aria-selected={activeTab === key}
            aria-controls={`${id}-panel`} tabIndex={activeTab === key ? 0 : -1}
            onClick={() => setActiveTab(key)}
            onKeyDown={event => {
              if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "input" : event.key === "End" ? "output"
                : index === 0 ? "output" : "input";
              setActiveTab(next);
              document.getElementById(`${id}-${next}`)?.focus();
            }} />
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${activeTab}`} tabIndex={0}
        style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {attachments[activeTab].length === 0
          ? <div role="status">{t("activityAttachmentsEmpty", { defaultValue: "No attachments." })}</div>
          : attachments[activeTab].map((file, index) => (
            <FileAttachmentCard key={index} file={file} size={file.size}
              onPreview={() => setSelected({ conversation, file })} />
          ))}
        {error && current && <div role="alert">
          {t("activityAttachmentPreviewError", { defaultValue: "Unable to preview this attachment. You can still download it." })}
        </div>}
      </div>
      <FileDetailModal open={!!current && !error} file={current ? preview : undefined}
        loading={!!current && !preview} fileName={current?.filename}
        onClose={() => setSelected(undefined)} />
    </div>
  );
};
