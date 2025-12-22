import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { ToolInvocationsActivity } from "../content/ToolInvocationsActivity";
import { ProgressNotificationsActivity } from "../tabs/ProgressNotificationsActivity";
import { SamplingActivity } from "../tabs/SamplingActivity";
import { UIMessage } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import { CanvasActivity } from "../tabs/CanvasActivity";
import { DataActivity } from "../content/DataActivity";
import { LoggingNotificationsActivity } from "../tabs/LoggingNotificationsActivity";
import { useIsDesktop } from "../../../../shell/responsive/useIsDesktop";

/**
 * Returns a flat array of all tool invocation activities from the current message stream.
 * Each entry includes the message id, role, and the toolInvocation payload.
 */
const useToolInvocations = (messages?: UIMessage[]) => {
  return (
    messages?.flatMap((m: any) =>
      (m.parts || [])
        .filter((p: any) => p.type.startsWith("tool-") && p.type != "tool-call")
        .map((p: any, idx: number) => ({
          msgId: m.id,
          role: m.role,
          metadata: m.metadata,           // 👈 carries metadata.timestamp
          partIndex: idx,                 // 👈 order within the message
          ...p,
        }))
    ) ?? []
  );
};

const parseIso = (ts?: string) => {
  if (!ts) return 0;
  const safe = ts.replace(/(\.\d{3})\d+Z$/, "$1Z"); // trim to ms
  const d = new Date(safe);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const SimpleActivityDrawer = (props: { messages?: UIMessage[] }) => {
  const { Drawer, Tabs, Tab, Button } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const { messages } = props;
  const showActivities = useAppStore((s) => s.showActivities);
  const setActivities = useAppStore((s) => s.setActivities);
  const activitiesSize = useAppStore((s) => s.activitiesSize);
  const toggleActivities = useAppStore((s) => s.toggleActivities);
  const chatMode = useAppStore((s) => s.chatMode);
  const setActivitiesSize = useAppStore((s) => s.setActivitiesSize);
  const toolInvocations = useToolInvocations(messages);
  const [activeTab, setActiveTab] = useState("toolInvocations");

  // 1) flatten resources + attach msg timestamp + ids
  const flatResources =
    toolInvocations?.flatMap((z: any) =>
      z?.output?.content
        ?.filter(
          (a: any) => a.type === "resource" && a.resource?.mimeType === "text/markdown"
        )
        .map((entry: any) => ({
          ...entry.resource,                 // { uri, text, mimeType, ... }
          _msgId: z.msgId,                   // for de-dupe per message turn
          _partIndex: z.partIndex,           // last wins within message
          _ts: z?.metadata?.timestamp ?? "", // 👈 timestamp lives here
        }))
    ) ?? [];

  const dataCards =
    messages?.flatMap((z) =>
      z?.parts
        ?.filter(
          (a) => a.type.startsWith("data-")
        )
    ) ?? [];
  // 2) group by URI
  const groupedByUri = new Map<string, any[]>();
  for (const r of flatResources) {
    if (!r?.uri) continue;
    const list = groupedByUri.get(r.uri) ?? [];
    list.push(r);
    groupedByUri.set(r.uri, list);
  }

  // 3) per-URI: de-dupe by message (keep last part), then sort DESC by timestamp
  const canvasGroups = Array.from(groupedByUri.entries()).map(([uri, list]) => {
    // per message keep the highest partIndex (the last read in that turn)
    const byMsg = new Map<string, any>();
    for (const r of list) {
      const prev = byMsg.get(r._msgId);
      if (!prev || r._partIndex > prev._partIndex) byMsg.set(r._msgId, r);
    }

    const versions = Array.from(byMsg.values()).sort(
      (a, b) => parseIso(b._ts) - parseIso(a._ts) // DESC
    );

    return { uri, versions };
  });

  const baseTabs = [
    {
      key: "toolInvocations",
      label: t("mcp.tools"),
      component: ToolInvocationsActivity,
      getProps: () => ({ invocations: toolInvocations }),
    },
    {
      key: "canvas",
      label: t("canvas"),
      component: CanvasActivity,
      getProps: () => ({ groups: canvasGroups }),
    },
    {
      key: "dataParts",
      label: t("dataParts"),
      component: DataActivity,
      getProps: () => ({ dataCards }),
    },
    {
      key: "mcpSampling",
      label: t("sampling"),
      component: SamplingActivity,
    },
    {
      key: "mcpProgress",
      label: t("progress"),
      component: ProgressNotificationsActivity,
    },
    {
      key: "mcpLogging",
      label: t("log"),
      component: LoggingNotificationsActivity,
    },
  ];

  const tabOrder =
    chatMode === "agent"
      ? baseTabs.filter((t) =>
        ["toolInvocations", "dataParts"].includes(t.key)
      )
      : baseTabs;

  if (!showActivities) {
    return undefined;
  }

  return (
    <Drawer
      open={showActivities}
      title={t("activities")}
      overlay={!isDesktop}
      headerNavigation={<div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Button
          icon="panelExpand"
          variant="transparent"
          disabled={activitiesSize === "full"}
          onClick={() =>
            setActivitiesSize(
              activitiesSize === "medium" ? "large" : "full"
            )
          }
        />

        <Button
          icon="panelContract"
          variant="transparent"
          disabled={activitiesSize === "medium"}
          onClick={() =>
            setActivitiesSize(
              activitiesSize === "large" ? "medium" : "large"
            )
          }
        />
      </div>}
      size={isDesktop ? (activitiesSize as any) : "small"}
      onClose={() => setActivities(false)}
    >
      <Tabs activeKey={activeTab}
        onSelect={setActiveTab}>
        {tabOrder.map((tab) => (
          <Tab key={tab.key}
            eventKey={tab.key}
            title={tab.label}>
            {activeTab === tab.key ? (
              <tab.component {...(tab.getProps ? tab.getProps() : {})} />
            ) : null}
          </Tab>
        ))}
      </Tabs>
    </Drawer>
  );
};
