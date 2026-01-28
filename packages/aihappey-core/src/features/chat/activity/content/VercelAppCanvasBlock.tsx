import { useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ActionProvider, DataProvider, VisibilityProvider } from "@json-render/react";
import { ErrorBoundary } from "react-error-boundary";
import { Renderer } from "../../../json-render/Renderer";
import { componentRegistry } from "../../../json-render/ComponentRegistry";
import { IconToken } from "aihappey-types";

function getFileName(uri: string): string {
  try {
    const path = new URL(uri).pathname;
    const file = path.substring(path.lastIndexOf("/") + 1);
    return file.replace(/\.[^/.]+$/, ""); // strip extension
  } catch {
    const file = (uri.split("/").pop() || uri).trim();
    return file.replace(/\.[^/.]+$/, "");
  }
}

function formatShort(ts?: string) {
  if (!ts) return "-";
  const safe = ts.replace(/(\.\d{3})\d+Z$/, "$1Z");
  const d = new Date(safe);
  if (isNaN(d.getTime())) return ts; // fallback raw
  return d.toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function parseTree(text?: string) {
  if (!text) return { tree: undefined, error: "Missing UI tree JSON." };
  try {
    return { tree: JSON.parse(text), error: undefined };
  } catch (e) {
    return { tree: undefined, error: e instanceof Error ? e.message : String(e) };
  }
}

export const VercelAppCanvasBlock = ({ uri, versions }: { uri: string; versions: any[] }) => {
  const { Card, Menu } = useTheme();
  const { t } = useTranslation();
 // const activeData = useAppStore(s => s.activeData);
  const [current, setCurrent] = useState(versions[0]);

  useEffect(() => {
    if (!versions?.length) return;
    setCurrent(versions[0]);
  }, [versions]);

  const actions = versions.map((v) => ({
    key: v._msgId + ":" + v._partIndex,
    icon: v._ts == current?._ts ? "check" as IconToken : undefined,
    label: formatShort(v._ts),
    onClick: () => setCurrent(v),
  }));

  const parsed = useMemo(() => parseTree(current?.text), [current?.text]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Card
        title={getFileName(uri)}
        description={formatShort(current?._ts)}
        headerActions={<Menu items={actions} />}
      >
        <div />
      </Card>
      {parsed.error ? (
        <div style={{ padding: 8 }}>
          {t("Something went wrong")}: {parsed.error}
        </div>
      ) : (
        <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
          <DataProvider initialData={current?.output ?? {}}>
            <VisibilityProvider>
              <ActionProvider>
                <Renderer tree={parsed.tree} registry={componentRegistry} />
              </ActionProvider>
            </VisibilityProvider>
          </DataProvider>
        </ErrorBoundary>
      )}
    </div>
  );
};
