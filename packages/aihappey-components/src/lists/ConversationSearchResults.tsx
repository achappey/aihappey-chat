import { format } from "timeago.js";
import { ConversationCard } from "../cards/ConversationCard";
import { useTheme } from "../theme/ThemeContext";

export type ConversationSearchResultItem = {
  conversationId: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  lastMessageTimestamp?: string;
  conversationUrl?: string;
};

export type ConversationSearchResultsProps = {
  items: ConversationSearchResultItem[];
  onSelect: (conversationId: string) => void;
  onOpenInNewTab?: (conversationId: string) => void;
  emptyText?: string;
  locale?: string;
};

export const ConversationSearchResults = ({
  items,
  onSelect,
  onOpenInNewTab,
  locale,
  emptyText,
}: ConversationSearchResultsProps) => {
  if (!items?.length) {
    return (
      <div style={{ opacity: 0.7, fontStyle: "italic", padding: 8 }}>
        {emptyText ?? "No results"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((i) => (
        <ConversationCard
          key={i.conversationId + ":" + i.snippet}
          title={i.title}
          subtitle={i.subtitle}
          snippet={i.snippet}
          headerActions={
            i.lastMessageTimestamp ? (
              <span
                style={{
                  opacity: 0.7,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
                title={i.lastMessageTimestamp}
              >
                {format(i.lastMessageTimestamp, locale)}
              </span>
            ) : undefined
          }
          actions={
            <ResultActions
              conversationUrl={i.conversationUrl}
              onOpen={() => onSelect(i.conversationId)}
              onOpenInNewTab={
                onOpenInNewTab ? () => onOpenInNewTab(i.conversationId) : undefined
              }
            />
          }
        />
      ))}
    </div>
  );
};

const ResultActions = ({
  conversationUrl,
  onOpen,
  onOpenInNewTab,
}: {
  conversationUrl?: string;
  onOpen: () => void;
  onOpenInNewTab?: () => void;
}) => {
  const { Button } = useTheme();

  const canOpenNewTab = !!conversationUrl;

  return (
    <>
      <Button
        icon="chat"
        size="small"
        variant="transparent"
        title="Open conversation"
        onClick={onOpen}
      />
      <Button
        icon="openLink"
        size="small"
        variant="transparent"
        title={
          canOpenNewTab ? "Open in new tab" : "Open in new tab (unavailable)"
        }
        disabled={!canOpenNewTab}
        onClick={() => {
          if (!conversationUrl) return;
          // Prefer parent handler so caller can keep modal open / track analytics
          if (onOpenInNewTab) return onOpenInNewTab();
          window.open(conversationUrl, "_blank");
        }}
      />
    </>
  );
};
