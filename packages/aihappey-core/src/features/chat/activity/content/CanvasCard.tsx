import { useEffect, useState } from "react";
import { OpenLinkButton, useTheme } from "aihappey-components";

import { Markdown } from "../../../../ui/markdown/Markdown";
import { useTranslation } from "aihappey-i18n";
import { IconToken } from "aihappey-types";
import { copyMarkdownToClipboard } from "../../files/file";

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

export const CanvasCard = ({ uri, versions }: { uri: string; versions: any[] }) => {
  const { Card, Button, Menu } = useTheme();
  const { t } = useTranslation();
  // newest first (we already sorted DESC), default show latest
  const [current, setCurrent] = useState(versions[0]);
  useEffect(() => {
    if (!versions?.length) return;
    setCurrent(versions[0]); // newest
  }, [versions]);

  const actions = versions.map((v, i) => ({
    key: v._msgId + ":" + v._partIndex,
    icon: v._ts == current?._ts ? "check" as IconToken : undefined,
    label: formatShort(v._ts), // 👈 short date label (never "Invalid Date")
    onClick: () => setCurrent(v),
  }));

  return (
    <>
      <Card
        title={getFileName(uri)}
        description={formatShort(current?._ts)}
        headerActions={<Menu items={actions} />}
        actions={<>
          <Button
            icon="copyClipboard"
            size="small"
            variant="transparent"
            onClick={async () => await copyMarkdownToClipboard(current.text)}
          />
          <OpenLinkButton
            size="small"
            url={uri}
            variant="transparent"
          />
        </>
        }
      >
        <Markdown text={current.text} />
      </Card >
    </>
  );
};
