import { useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { ToolInvocationsActivity } from "../content/ToolInvocationsActivity";
import { UIMessage } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import { CanvasActivity } from "../tabs/CanvasActivity";
import { DataActivity } from "../content/DataActivity";
import { useIsDesktop } from "../../../../shell/responsive/useIsDesktop";

/**
 * Returns a flat array of all tool invocation activities from the current message stream.
 * Each entry includes the message id, role, and the toolInvocation payload.
 */
const readStringByKeys = (value: any, keys: string[], depth = 3): string | undefined => {
  if (!value || depth < 0 || typeof value !== "object") return undefined;

  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = readStringByKeys(item, keys, depth - 1);
      if (found) return found;
    }
    return undefined;
  }

  for (const item of Object.values(value)) {
    const found = readStringByKeys(item, keys, depth - 1);
    if (found) return found;
  }

  return undefined;
};

const getProviderIdFromModelId = (modelId?: string) => {
  const trimmed = String(modelId ?? "").trim();
  if (!trimmed) return undefined;

  const idx = trimmed.indexOf("/");
  return (idx > 0 ? trimmed.slice(0, idx) : trimmed).toLowerCase();
};

const getFinishPartModelId = (message: any) => {
  const finishPart = (message?.parts ?? []).find((p: any) =>
    typeof p?.type === "string" && p.type.toLowerCase().includes("finish")
  );

  return readStringByKeys(finishPart, ["model", "modelId", "selectedModel"])
    ?? (typeof finishPart?.model?.id === "string" ? finishPart.model.id : undefined);
};

const getAssistantRunProviderId = (message: any, currentRunModel?: string) => {
  const modelId = getFinishPartModelId(message)
    ?? readStringByKeys(message?.metadata, ["model", "modelId", "selectedModel"])
    ?? currentRunModel;

  return getProviderIdFromModelId(modelId);
};

const useToolInvocations = (messages?: UIMessage[], currentModel?: string) => {
  const lastAssistantIndex = messages?.findLastIndex((m: any) => m.role === "assistant") ?? -1;

  return (
    messages?.flatMap((m: any, messageIndex: number) => {
      const isCurrentAssistantRun = m.role === "assistant" && messageIndex === lastAssistantIndex;
      const providerId = getAssistantRunProviderId(
        m,
        isCurrentAssistantRun ? currentModel : undefined
      );

      return (m.parts || [])
        .filter((p: any) => p.type?.startsWith("tool-") && p.type != "tool-call")
        .map((p: any, idx: number) => ({
          ...p,
          msgId: m.id,
          role: m.role,
          metadata: m.metadata,           // 👈 carries metadata.timestamp
          partIndex: idx,                 // 👈 order within the message
          providerId: p.providerId ?? providerId,
        }));
    }
    ) ?? []
  );
};

const parseIso = (ts?: string) => {
  if (!ts) return 0;
  const safe = ts.replace(/(\.\d{3})\d+Z$/, "$1Z"); // trim to ms
  const d = new Date(safe);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const getToolName = (toolInvocation: any) =>
  String(toolInvocation?.toolName ?? toolInvocation?.type ?? "")
    .replace(/^tool-/, "");

const normalizeLocalCanvasPath = (path?: string) => {
  const trimmed = String(path ?? "").replace(/\\/g, "/").trim();
  if (!trimmed) return undefined;

  const withRoot = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withRoot.toLowerCase().endsWith(".md") ? withRoot : `${withRoot}.md`;
};

const localCanvasUri = (path?: string) => {
  const normalized = normalizeLocalCanvasPath(path);
  return normalized ? `localcanvas://${normalized}` : undefined;
};

const parseToolInput = (input: any) => {
  if (typeof input !== "string") return input ?? {};

  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
};

const getToolTextOutput = (toolInvocation: any) => {
  const textItem = toArray(toolInvocation?.output?.content).find(
    (item: any) => item?.type === "text" && typeof item?.text === "string"
  );

  return textItem?.text;
};

const insertLocalCanvasText = (previous: string, line: any, insertText: string) => {
  const lines = previous.split("\n");
  const index = Math.max(1, Number(line ?? 1));

  if (index > lines.length + 1) lines.push(insertText);
  else lines.splice(index - 1, 0, insertText);

  return lines.join("\n");
};

const getLocalCanvasText = (
  toolName: string,
  input: any,
  toolInvocation: any,
  previousText?: string
) => {
  switch (toolName) {
    case "local_canvas_read":
      return getToolTextOutput(toolInvocation);
    case "local_canvas_create":
      return String(input?.file_text ?? "");
    case "local_canvas_insert": {
      const insertText = String(input?.insert_text ?? "");
      return previousText !== undefined
        ? insertLocalCanvasText(previousText, input?.insert_line, insertText)
        : insertText;
    }
    case "local_canvas_replace": {
      const newText = String(input?.new_str ?? "");
      return previousText !== undefined
        ? previousText.replace(String(input?.old_str ?? ""), newText)
        : newText;
    }
    default:
      return undefined;
  }
};

const extractLocalCanvasResources = (toolInvocations: any[]) => {
  const latestTextByUri = new Map<string, string>();

  return toolInvocations.flatMap((z: any) => {
    const toolName = getToolName(z);
    if (!toolName.startsWith("local_canvas_")) return [];

    const input = parseToolInput(z?.input);
    const uri = localCanvasUri(input?.path);
    if (!uri) return [];

    const text = getLocalCanvasText(toolName, input, z, latestTextByUri.get(uri));
    if (text === undefined) return [];

    latestTextByUri.set(uri, text);

    return [{
      uri,
      mimeType: "text/markdown",
      text,
      _msgId: z.msgId,
      _partIndex: z.partIndex,
      _ts: z?.metadata?.timestamp ?? "",
    }];
  });
};

export const toArray = (val: any) =>
  Array.isArray(val) ? val : val ? [val] : [];

export const ActivityDrawer = (props: { messages?: UIMessage[], uiTree: any; uiOutput?: any; currentModel?: string }) => {
  const { Drawer, Tabs, Tab, Button } = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const { messages, uiTree, uiOutput, currentModel } = props;
  const showActivities = useAppStore((s) => s.showActivities);
  const setActivities = useAppStore((s) => s.setActivities);
  const activitiesSize = useAppStore((s) => s.activitiesSize);
  const setActivitiesSize = useAppStore((s) => s.setActivitiesSize);
  const toolInvocations = useToolInvocations(messages, currentModel);
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

  const localCanvasResources = extractLocalCanvasResources(toolInvocations);

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
  for (const r of [...flatResources, ...localCanvasResources]) {
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
    }  
  ];

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
        {baseTabs.map((tab) => (
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
