import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme, ConversationSearchResults } from "aihappey-components";
import { useConversations } from "aihappey-conversations";
import { searchLocalConversationsText } from "../tools/toolcalls/useLocalConversationsToolCall";

export type ConversationSearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
};

export const ConversationSearchModal = ({
  open,
  onClose,
  onSelectConversation,
}: ConversationSearchModalProps) => {
  const { Modal, Button, SearchBox, Spinner } = useTheme();
  const { t, i18n } = useTranslation();
  const conversations = useConversations();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<
    { conversationId: string; snippet?: string; messageIndex: number }[]
  >([]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setHits([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const handle = window.setTimeout(async () => {
      try {
        const payload = await searchLocalConversationsText(conversations, q, 50);
        if (cancelled) return;
        setHits(
          (payload.results ?? []).map((r) => ({
            conversationId: r.conversationId,
            snippet: r.snippet,
            messageIndex: r.messageIndex,
          }))
        );
      } catch (e) {
        if (cancelled) return;
        setHits([]);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query, conversations]);

  const getLastMessageTimestamp = (conv: any): string | undefined => {
    // Timestamp is stored on the message metadata (ISO string).
    // Walk backwards to find the most recent timestamp.
    const msgs = conv?.messages ?? [];
    for (let idx = msgs.length - 1; idx >= 0; idx--) {
      const ts = (msgs[idx]?.metadata as any)?.timestamp;
      if (typeof ts === "string" && ts.trim()) {
        return ts;
      }
    }
    return undefined;
  };

  const getLastTextSnippet = (conv: any): string | undefined => {
    const msgs = conv?.messages ?? [];
    for (let msgIdx = msgs.length - 1; msgIdx >= 0; msgIdx--) {
      const parts = msgs[msgIdx]?.parts ?? [];
      for (let partIdx = parts.length - 1; partIdx >= 0; partIdx--) {
        const p = parts[partIdx];
        if (p?.type === "text" && typeof p?.text === "string" && p.text.trim()) {
          return p.text;
        }
      }
    }
    return undefined;
  };

  // Group first match per conversation (simple UX).
  const resultItems = useMemo(() => {
    const firstByConversation = new Map<
      string,
      { snippet?: string; messageIndex: number }
    >();
    for (const h of hits) {
      if (!firstByConversation.has(h.conversationId)) {
        firstByConversation.set(h.conversationId, {
          snippet: h.snippet,
          messageIndex: h.messageIndex,
        });
      }
    }

    return Array.from(firstByConversation.entries()).map(([conversationId, v]) => {
      const conv = (conversations.items ?? []).find((c) => c.id === conversationId);
      const title = conv?.metadata?.name ?? t("newChat");
      const messageCount = conv?.messages?.length ?? 0;

      const lastMessageTimestamp = getLastMessageTimestamp(conv);

      return {
        conversationId,
        title,
        subtitle: `${messageCount} ${t("messages")}`,
        snippet: v.snippet,
        lastMessageTimestamp,
        conversationUrl: `/${conversationId}`,
      };
    });
  }, [hits, conversations.items, t]);

  const recentItems = useMemo(() => {
    const items = (conversations.items ?? []).map((conv) => {
      const title = conv?.metadata?.name ?? t("newChat");
      const messageCount = conv?.messages?.length ?? 0;
      const lastMessageTimestamp = getLastMessageTimestamp(conv);
      const snippet = getLastTextSnippet(conv);

      return {
        conversationId: conv.id,
        title,
        subtitle: `${messageCount} ${t("messages").toLocaleLowerCase()}`,
        snippet,
        lastMessageTimestamp,
        conversationUrl: `/${conv.id}`,
      };
    });

    // Sort by last message timestamp desc, but keep stable ordering as fallback.
    const withIndex = items.map((i, idx) => ({ i, idx }));
    withIndex.sort((a, b) => {
      const at = a.i.lastMessageTimestamp;
      const bt = b.i.lastMessageTimestamp;
      if (at && bt) return bt.localeCompare(at);
      if (bt) return 1;
      if (at) return -1;
      return a.idx - b.idx;
    });

    return withIndex.map((x) => x.i).slice(0, 6);
  }, [conversations.items, t]);

  const close = () => {
    onClose();
  };

  return (
    <Modal
      show={open}
      onHide={close}
      title={t("search")}
      actions={
        <Button type="button" variant="secondary" onClick={close}>
          {t("close")}
        </Button>
      }
    >
      <div style={{
        display: "flex", flexDirection: "column",
        width: "100%",
        gap: 12
      }}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t("conversationSearchPlaceholder")}
          autoFocus
        />

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <Spinner size="small" />
          </div>
        )}

        {error && <div style={{ color: "#c00", padding: 8 }}>{error}</div>}

        <ConversationSearchResults
          items={query.trim() ? resultItems : recentItems}
          emptyText={query.trim() ? t('noResults') : ""}
          locale={i18n.language}
          onSelect={(conversationId) => {
            onSelectConversation(conversationId);
            close();
          }}
          onOpenInNewTab={(conversationId) => {
            // Keep the modal open (per UX request)
            window.open(`/${conversationId}`, "_blank");
          }}
        />
      </div>
    </Modal>
  );
};

export default ConversationSearchModal;
