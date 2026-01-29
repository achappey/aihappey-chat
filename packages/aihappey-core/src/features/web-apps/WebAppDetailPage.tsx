import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { ActionProvider, DataProvider, VisibilityProvider } from "@json-render/react";
import { ErrorBoundary } from "react-error-boundary";
import { useParams, useNavigate } from "react-router";
import { useJsonRenderApps } from "aihappey-json-render-apps";
import { useTheme } from "aihappey-components";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useCombinedComponentRegistry } from "../json-render/ComponentRegistry";
import { Renderer } from "../json-render/Renderer";

export const WebAppDetailPage = () => {
  const { t } = useTranslation();
  const { Tabs, Tab, JsonViewer, Button, Paragraph } = useTheme();
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const apps = useJsonRenderApps();
  const [activeTab, setActiveTab] = useState("preview");
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const { registry, actionHandlers } = useCombinedComponentRegistry("app");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!appId) return;
      setLoading(true);
      setError(undefined);
      try {
        const item = await apps.read(appId);
        if (!cancelled) setApp(item);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [appId, apps]);

  const tree = useMemo(() => {
    // Stored as object already, but be defensive.
    const raw = (app as any)?.uiTree;
    if (!raw) return undefined;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    }
    return raw;
  }, [app]);

  const title = app?.name ?? t("webApps");

  return (
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
        {loading ? (
          <Paragraph style={{ textAlign: "center" }}>{t("loading")}</Paragraph>
        ) : error ? (
          <Paragraph style={{ textAlign: "center" }}>{error}</Paragraph>
        ) : !app ? (
          <Paragraph style={{ textAlign: "center" }}>{t("notFound")}</Paragraph>
        ) : (
          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            <Tab eventKey="preview" title={title}>
              <div style={{ width: "100%", paddingTop: 12 }}>
                {!tree ? (
                  <div style={{ color: "#888", textAlign: "center" }}>{t("noResults")}</div>
                ) : (
                  <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
                    <DataProvider initialData={app?.data ?? {}}>
                      <VisibilityProvider>
                        <ActionProvider handlers={actionHandlers}>
                          <Renderer tree={tree} registry={registry} />
                        </ActionProvider>
                      </VisibilityProvider>
                    </DataProvider>
                  </ErrorBoundary>
                )}
              </div>
            </Tab>
            <Tab eventKey="structure" title={t("structure")}>
              <div style={{ width: "100%", paddingTop: 12 }}>
                <JsonViewer value={tree ?? {}} />
              </div>
            </Tab>
            <Tab eventKey="data" title={t("data")}>
              <div style={{ width: "100%", paddingTop: 12 }}>
                <JsonViewer value={app?.data ?? {}} />
              </div>
            </Tab>
          </Tabs>
        )}
      </div>
    </div>
  );
};

