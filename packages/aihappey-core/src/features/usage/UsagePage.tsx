import { useMemo } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { buildUsageAnalytics } from "./usageAnalytics";
import { UsageAnalysisTabs } from "./UsageAnalysisTabs";

export const UsagePage = () => {
  const { Text } = useTheme();
  const { t } = useTranslation();
  const conversations = useConversations();
  const models = useAppStore((s) => s.models) ?? [];

  const analytics = useMemo(
    () => buildUsageAnalytics({
      conversations: conversations.items ?? [],
      models,
      providers: PROVIDERS,
    }),
    [conversations.items, models]
  );

  return (
    <div style={{ background: "transparent" }}>
      <div
        style={{
          width: 980,
          maxWidth: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingLeft: 8,
          paddingRight: 8,
          boxSizing: "border-box",
        }}
      >
        <OverviewPageHeader title={t("ai.usage.title")} />

        <Text as="p" align="center" style={{ maxWidth: 820 }}>
          {t("ai.usage.description", {
            conversations: analytics.conversations,
            messages: analytics.messages,
            parts: analytics.parts,
          })}
        </Text>

        <UsageAnalysisTabs analytics={analytics} t={t} />
      </div>
    </div>
  );
};

