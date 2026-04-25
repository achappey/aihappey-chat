import { useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { ToolInvocationsActivity } from "../content/ToolInvocationsActivity";
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

export const toArray = (val: any) =>
  Array.isArray(val) ? val : val ? [val] : [];

export const ActivityDrawer = (props: { messages?: UIMessage[], uiTree: any; uiOutput?: any }) => {
  const { Drawer, Tabs, Tab, Button } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const { messages, uiTree, uiOutput } = props;
  const showActivities = useAppStore((s) => s.showActivities);
  const setActivities = useAppStore((s) => s.setActivities);
  const activitiesSize = useAppStore((s) => s.activitiesSize);
  const chatMode = useAppStore((s) => s.chatMode);
  const setActivitiesSize = useAppStore((s) => s.setActivitiesSize);
  const toolInvocations = useToolInvocations(messages);
  const [activeTab, setActiveTab] = useState("toolInvocations");

  const extractResources = (
    toolInvocations: any[],
    mimeType: string,
    extraMapper?: (entry: any, z: any, all: any[]) => any
  ) => {
    return toolInvocations?.flatMap((z: any) => {
      const items = toArray(z?.output?.content);

      return items
        .filter(
          (a: any) =>
            a?.type === "resource" &&
            a?.resource?.mimeType === mimeType
        )
        .map((entry: any) => ({
          ...entry.resource,
          _msgId: z.msgId,
          _partIndex: z.partIndex,
          _ts: z?.metadata?.timestamp ?? "",
          ...(extraMapper ? extraMapper(entry, z, toolInvocations) : {}),
        }));
    }) ?? [];
  };

  const flatResources = extractResources(
    toolInvocations,
    "text/markdown"
  );

  const htmlFlatResources = extractResources(
    toolInvocations,
    "text/html"
  );

  const flatVercelResources = extractResources(
    toolInvocations,
    "application/vnd.vercel-app+json",
    (entry, z, all) => ({
      output: all.find(
        (a) => a.toolCallId == z?.output?._meta?.toolCallId
      )?.output,
    })
  );

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

  const vercelGroupedByUri = new Map<string, any[]>();
  for (const r of flatVercelResources) {
    if (!r?.uri) continue;
    const list = vercelGroupedByUri.get(r.uri) ?? [];
    list.push(r);
    vercelGroupedByUri.set(r.uri, list);
  }

  const htmlGroupedByUri = new Map<string, any[]>();
  for (const r of htmlFlatResources) {
    if (!r?.uri) continue;
    const list = htmlGroupedByUri.get(r.uri) ?? [];
    list.push(r);
    htmlGroupedByUri.set(r.uri, list);
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


  // 3) per-URI: de-dupe by message (keep last part), then sort DESC by timestamp
  const htmlCanvasGroups = Array.from(htmlGroupedByUri.entries()).map(([uri, list]) => {
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


  const vercelGroups = Array.from(vercelGroupedByUri.entries()).map(([uri, list]) => {
    const byMsg = new Map<string, any>();
    for (const r of list) {
      const prev = byMsg.get(r._msgId);
      if (!prev || r._partIndex > prev._partIndex) byMsg.set(r._msgId, r);
    }

    const versions = Array.from(byMsg.values()).sort(
      (a, b) => parseIso(b._ts) - parseIso(a._ts)
    );

    return { uri, versions };
  });

  const baseTabs = [
    {
      key: "toolInvocations",
      label: t("tools"),
      component: ToolInvocationsActivity,
      getProps: () => ({ invocations: toolInvocations }),
    },
    {
      key: "canvas",
      label: t("canvas"),
      component: CanvasActivity,
      getProps: () => ({ groups: canvasGroups, htmlGroups: htmlCanvasGroups, vercelGroups, uiTree, uiOutput }),
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
      onClose={() => setActivities(false)}>
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
