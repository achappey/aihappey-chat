import { useEffect, useRef, useState } from "react";
import { OpenLinkButton, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { IconToken } from "aihappey-types";
import { copyMarkdownToClipboard } from "../../files/file";
import { useDarkMode } from "usehooks-ts";

function getFileName(uri: string): string {
  try {
    const path = new URL(uri).pathname;
    const file = path.substring(path.lastIndexOf("/") + 1);
    return file.replace(/\.[^/.]+$/, "");
  } catch {
    const file = (uri.split("/").pop() || uri).trim();
    return file.replace(/\.[^/.]+$/, "");
  }
}

function formatShort(ts?: string) {
  if (!ts) return "-";
  const safe = ts.replace(/(\.\d{3})\d+Z$/, "$1Z");
  const d = new Date(safe);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const HtmlCanvasCard = ({
  uri,
  versions,
}: {
  uri: string;
  versions: any[];
}) => {
  const { Card, Button, Menu } = useTheme();
  const { t } = useTranslation();

  const [current, setCurrent] = useState(versions[0]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    if (versions?.length) setCurrent(versions[0]);
  }, [versions]);

  // Auto-resize iframe to its content
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resize = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        iframe.style.height = doc.body.scrollHeight + "px";
      } catch {
        // sandboxed / cross-origin → ignore
      }
    };

    iframe.addEventListener("load", resize);
    return () => iframe.removeEventListener("load", resize);
  }, [current]);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };


  const actions = versions.map((v) => ({
    key: v._msgId + ":" + v._partIndex,
    icon: v._ts === current?._ts ? ("check" as IconToken) : undefined,
    label: formatShort(v._ts),
    onClick: () => setCurrent(v),
  }));

  return (
    <Card
      title={getFileName(uri)}
      description={formatShort(current?._ts)}
      headerActions={<Menu items={actions} />}
      actions={
        <>
          <Button
            icon="print"
            size="small"
            variant="transparent"
            onClick={handlePrint}
          />

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
      <iframe
        ref={iframeRef}
        title={getFileName(uri)}
        srcDoc={current.text ?? ""}
        style={{
          width: "100%",
          height: 400,
          border: "none",
          background: isDarkMode ? "white" : "transparent",
        }}
        sandbox="allow-same-origin allow-scripts allow-modals"
      />
    </Card>
  );
};
