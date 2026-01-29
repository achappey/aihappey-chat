import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { JsonRenderCanvasPanel } from "./JsonRenderCanvasPanel";

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
  const { t } = useTranslation();
  const [current, setCurrent] = useState(versions[0]);

  useEffect(() => {
    if (!versions?.length) return;
    setCurrent(versions[0]);
  }, [versions]);

  const parsed = useMemo(() => parseTree(current?.text), [current?.text]);

  return (
    <JsonRenderCanvasPanel
      title={getFileName(uri)}
      description={formatShort(current?._ts)}
      tree={parsed.tree}
      output={current?.output}
      versions={(versions ?? []).map((v) => ({
        label: formatShort(v._ts),
        isActive: v._ts === current?._ts,
        onSelect: () => setCurrent(v),
      }))}
    />
  );
};
