import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

import { EmbeddedResourceContent } from "./EmbeddedResourceContent";

interface EmbeddedResourceViewProps {
  block: {
    type: "resource";
    resource: {
      uri?: string;
      mimeType?: string;
      text?: string;
      blob?: string; // base64 data without prefix
    };
  };
}

export const EmbeddedResourceView = ({ block }: EmbeddedResourceViewProps) => {
  const { Card, Button } = useTheme();
  const { t } = useTranslation();
  const { resource } = block;
  const { uri, blob, mimeType, text } = resource;

  let buttonLabel = t("open");
  if (uri) {
    try {
      buttonLabel = new URL(uri).hostname.replace(/^www\./, "");
    } catch { }
  }

  // Build optional download button for blobs
  const downloadButton =
    blob && !text ? (
      <Button
        size="small"
        variant="transparent"
        icon="download"
        onClick={() => {
          const filename = uri?.split("/").pop() || "download.bin";
          const downloadUrl = `data:${mimeType || "application/octet-stream"
            };base64,${blob}`;
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = filename;
          a.click();
        }}
      >
      </Button>
    ) : null;

  // Build optional open link button
  const openButton = uri ? (
    <Button
      size="small"
      icon="openLink"
      variant="transparent"
      onClick={() => window.open(uri, "_blank")}
    >
      {buttonLabel}
    </Button>
  ) : null;

  return (
    <Card
      title={
        text
          ? t("mcp.embeddedTextResource")
          : t("mcp.embeddedBlobResource")
      }
      size="small"
      children={<EmbeddedResourceContent resource={resource} />}
      actions={
        <>
          {downloadButton}
          {openButton}
        </>
      }
    />
  );
};
