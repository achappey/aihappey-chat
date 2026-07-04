import { useMemo, useState } from "react";

import { useAppStore } from "aihappey-state";
import { ToolCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useLocalTools } from "aihappey-tools";

import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useOnToolCall } from "./toolcalls/useOnToolCall";
import { useChatContext } from "../chat/context/ChatContext";
import {
  buildLocalToolItems,
  buildModelContextToolSections,
  buildPluginToolItems,
  normalizeCatalogText,
  type ToolListItem,
} from "./toolCatalogItems";

export const ToolsPage = () => {
  const { SearchBox, Text, Tabs, Tab, Header } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const activePlugins = useAppStore(s => s.activePlugins);
  const callTool = useAppStore((a) => a.callTool);
  const config = useChatContext()

  const api = config?.config.baseUrl + config?.config.endpoints.chat;
  const toolUse = useOnToolCall({
    api,
    getAccessToken: config?.config?.getAccessToken,
    conversationId: undefined,
    headers: config?.config.headers,
    customFetch: config?.config.fetch,
    callTool,
    send: undefined
  });

  const enabledLocalTools = useAppStore(s => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore(
    s => (s as any).setEnabledLocalTools as (names: string[]) => void
  );
  const mcpServerContent = useAppStore(s => s.mcpServerContent);

  const localTools = useLocalTools();

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const pluginToolItems = useMemo<ToolListItem[]>(() => {
    return buildPluginToolItems({ activePlugins, collator, t });
  }, [activePlugins, collator, t]);

  const localToolItems = useMemo<ToolListItem[]>(() => {
    return buildLocalToolItems({ localTools: localTools.items ?? [], enabledLocalTools, collator, t });
  }, [collator, enabledLocalTools, localTools.items, t]);

  const modelContextToolItemsByServer = useMemo(() => {
    return buildModelContextToolSections({ mcpServerContent, collator });
  }, [collator, mcpServerContent]);

  const modelContextToolItemsFlat = useMemo(
    () => modelContextToolItemsByServer.flatMap(s => s.tools),
    [modelContextToolItemsByServer]
  );

  const allItems = useMemo<ToolListItem[]>(
    () => [...pluginToolItems, ...localToolItems, ...modelContextToolItemsFlat],
    [localToolItems, modelContextToolItemsFlat, pluginToolItems]
  );

  const q = normalizeCatalogText(search);

  const filterItems = useMemo(() => {
    const matches = (i: ToolListItem) => {
      if (!q) return true;
      const hay = normalizeCatalogText(
        `${i.name} ${i.title ?? ""} ${i.description ?? ""} ${i.source} ${i.sourceDetail ?? ""}`
      );
      return hay.includes(q);
    };

    const sortByLabel = (a: ToolListItem, b: ToolListItem) =>
      collator.compare(a.title ?? a.name, b.title ?? b.name);

    return {
      // ALL tab should be ordered alphabetically by display label (title fallback name), regardless of source.
      all: allItems.filter(matches).slice().sort(sortByLabel),
      plugin: pluginToolItems.filter(matches),
      local: localToolItems.filter(matches),
      modelContext: modelContextToolItemsByServer
        .map(s => ({ ...s, tools: s.tools.filter(matches) }))
        .filter(s => s.tools.length > 0 || !q),
    };
  }, [allItems, collator, localToolItems, modelContextToolItemsByServer, pluginToolItems, q]);

  const renderGrid = (items: ToolListItem[]) => {
    if (items.length === 0) {
      return <div style={{ color: "#888", textAlign: "center" }}>{t("noResults")}</div>;
    }

    const enabledSet = new Set(Array.isArray(enabledLocalTools) ? enabledLocalTools : []);
    const toggleLocalTool = (id: string, checked: boolean) => {
      const current = Array.isArray(enabledLocalTools) ? enabledLocalTools : [];
      const next = checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter(x => x !== id);
      setEnabledLocalTools(next);
    };

    // NOTE: When working in-repo without rebuilding, newly added props on ToolCard
    // may not exist in the published `aihappey-components` .d.ts yet.
    const ToolCardAny = ToolCard as any;

    return (
      <div
        style={{
          display: "grid",
         gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
          width: "100%",
          maxWidth: 700,
          marginBottom: 24,
          justifyItems: "center",
        }}
      >
        {items.map(item => (
          <div key={item.key} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
            <ToolCardAny
              id={item.key}
              name={item.name}
              title={item.title}
              description={item.description}
              inputSchema={item.inputSchema}
              executeSource={item.source === "local" ? item.executeSource : undefined}
              source={item.source}
              sourceDetail={item.sourceDetail}
              enabled={item.enabled}
              annotations={item.annotations}
              onExecute={async (toolName: string, args: any) => {
                // Uses existing tool runtime; result is returned and will be stored by ToolCard.
                return await toolUse.onToolCall({
                  toolCall: {
                    toolName: toolName,
                    input: args
                  }
                });
              }}
              toggleChecked={
                item.source === "local"
                  ? enabledSet.has(item.name)
                  : item.source === "plugin"
                    ? !!item.enabled
                    : undefined
              }
              onToggle={
                item.source === "local"
                  ? (checked: boolean) => toggleLocalTool(item.name, checked)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div style={{ background: "transparent" }}>
        <div
          style={{
            width: 700,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <OverviewPageHeader title={t("tools")} />

           <Text as="p" align={"center" }>{t("toolsPage.description")}</Text>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ width: 360, maxWidth: "100%" }}>
              <SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
            </div>
          </div>

          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            <Tab eventKey="all" icon="cardList" title={`${t("all")} (${filterItems.all.length})`}>
              <div style={{ paddingTop: 12 }}>{renderGrid(filterItems.all)}</div>
            </Tab>

            <Tab
              eventKey="plugin"
              icon="connector"
              title={`${t("pluginTools")} (${filterItems.plugin.length})`}
            >
              <div style={{ paddingTop: 12 }}>{renderGrid(filterItems.plugin)}</div>
            </Tab>

            <Tab eventKey="local"
              icon="tool"
              disabled={filterItems.local.length == 0}
              title={`${t("customTools")} (${filterItems.local.length})`}>
              <div style={{ paddingTop: 12 }}>{renderGrid(filterItems.local)}</div>
            </Tab>

            <Tab
              eventKey="modelContext"
              icon="mcpServer"
              disabled={filterItems.modelContext.length == 0}
              title={`${t("mcpPage.title")} (${modelContextToolItemsFlat.length})`}
            >
              <div style={{ paddingTop: 12, width: "100%", maxWidth: 700 }}>
                {filterItems.modelContext.length === 0 ? (
                  <div style={{ color: "#888", textAlign: "center" }}>{t("noResults")}</div>
                ) : (
                  filterItems.modelContext.map(section => (
                    <div key={section.serverKey} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                        <Header style={{ margin: 0 }}>{section.serverTitle}</Header>
                        <span style={{ color: "#888", fontSize: 12 }}>({section.tools.length})</span>
                      </div>
                      {renderGrid(section.tools)}
                    </div>
                  ))
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
};

