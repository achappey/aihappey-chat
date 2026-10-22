import { useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useConversations } from "aihappey-conversations";
import type { Conversation } from "aihappey-types";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { buildUsageAnalytics } from "./usageAnalytics";
import { UsageAnalysisTabs } from "./UsageAnalysisTabs";

export const UsagePage = () => {
  const { Text, ProgressBar, Alert } = useTheme();
  const { t } = useTranslation();
  const conversations = useConversations();
  const providers = useProviderRegistry();
  const [fullConversations, setFullConversations] = useState<Conversation[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    setProgress(0);
    void conversations.loadAll({
      signal: controller.signal,
      concurrency: 4,
      onProgress: (loaded, total) => setProgress(total ? Math.round(loaded / total * 100) : 100),
    }).then((items) => {
      if (controller.signal.aborted) return;
      setFullConversations(items);
      setProgress(100);
    }).catch((cause) => {
      if (!controller.signal.aborted) {
        console.error("Failed to load usage conversations", cause);
        setError(t("ai.usage.loadFailed") ?? "Conversation usage data could not be loaded.");
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [conversations, t]);

  const analytics = useMemo(
    () => buildUsageAnalytics({ conversations: fullConversations, providers }),
    [fullConversations, providers]
  );

  return (
    <div style={{ background: "transparent" }}>
      <div style={{ width: 1140, maxWidth: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", paddingLeft: 12, paddingRight: 12, paddingBottom: 32, boxSizing: "border-box" }}>
        <OverviewPageHeader title={t("ai.usage.title")} />
        {loading ? (
          <div style={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", gap: 12 }}>
            <Text as="p" align="center">{t("ai.usage.loading") ?? "Loading conversation usage data…"}</Text>
            <ProgressBar value={progress} />
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <>
            <Text as="p" align="center" style={{ marginTop: 0, marginBottom: 20 }}>
              {t("ai.usage.subtitle", { conversations: analytics.conversations, messages: analytics.messages })}
            </Text>
            <UsageAnalysisTabs analytics={analytics} t={t} />
          </>
        )}
      </div>
    </div>
  );
};
