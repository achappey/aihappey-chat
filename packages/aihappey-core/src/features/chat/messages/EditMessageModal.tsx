import type { UIMessage, UIMessagePart } from "aihappey-ai";
import { useTheme, UIMessagePartEditCard } from "aihappey-components";
import { useConversations, useRemoveMessage } from "aihappey-conversations";
import { useTranslation } from "aihappey-i18n";
import { useCallback, useEffect, useMemo, useState } from "react";

export type EditMessageModalProps = {
  open: boolean;
  onClose: () => void;

  conversationId: string;
  message: UIMessage;

  /** Optional: keep the live in-memory chat list in sync. */
  onLocalMessageUpdated?: (next: UIMessage | undefined) => void;
};

export const EditMessageModal = ({
  open,
  onClose,
  conversationId,
  message,
  onLocalMessageUpdated,
}: EditMessageModalProps) => {
  const { Modal, Button } = useTheme();
  const { updateMessage, refresh } = useConversations();
  const { t } = useTranslation();
  const removeMessage = useRemoveMessage();

  // Keep a local copy so the modal re-renders immediately after each deletion
  // (and so multiple sequential deletions work).
  const [localMessage, setLocalMessage] = useState<UIMessage>(message);

  useEffect(() => {
    if (!open) return;
    setLocalMessage(message);
  }, [message, open]);

  const parts = useMemo(
    () => ((localMessage?.parts ?? []) as UIMessagePart<any, any>[]).filter(Boolean),
    [localMessage]
  );

  const deletePartAt = useCallback(
    async (index: number) => {
      const nextParts = parts.filter((_, i) => i !== index);
      if (nextParts.length === 0) {
        await removeMessage(conversationId, localMessage.id);
        onLocalMessageUpdated?.(undefined);
        onClose();
        refresh();
        return;
      }

      const nextMessage: UIMessage = {
        ...localMessage,
        parts: nextParts,
      };

      await updateMessage(conversationId, localMessage.id, { parts: nextParts });

      setLocalMessage(nextMessage);
      onLocalMessageUpdated?.(nextMessage);
      refresh();
    },
    [conversationId, localMessage, onClose, onLocalMessageUpdated, parts, refresh, removeMessage, updateMessage]
  );

  return (
    <Modal
      show={open}
      size="large"
      title={t('editMessage')}
      onHide={onClose}
      actions={
        <Button variant="secondary"
          onClick={onClose}>
          {t("close")}
        </Button>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {parts.map((p, idx) => (
          <UIMessagePartEditCard
            key={`${localMessage.id}:${idx}:${p.type}`}
            part={p}
            onDelete={() => void deletePartAt(idx)}
          />
        ))}
      </div>
    </Modal>
  );
};

