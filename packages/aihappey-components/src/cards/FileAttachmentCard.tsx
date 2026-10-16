import { FileUIPart } from "aihappey-ai";
import mime from 'mime'; // <-- default import
import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "../buttons";
import { useTranslation } from "aihappey-i18n";
import { MimeTypeBadge, SizeBadge } from "../badges";

interface FileAttachmentCardProps {
  file: FileUIPart;
  size?: number;
  onPreview?: () => void;
  /** Optional action: persist this attachment into the app-wide Files runtime. */
  onAddToFiles?: (file: FileUIPart) => void | Promise<void>;
}

function base64SizeInKB(base64: string): number {
  // Remove data URI prefix if present
  const clean = base64.split(',').pop() ?? base64;

  // Calculate padding characters
  const padding = (clean.match(/=*$/)?.[0].length) ?? 0;

  // Calculate size in bytes
  const bytes = (clean.length * 3) / 4 - padding;

  // Return size in kilobytes
  return bytes / 1024;
}

function tryGetFilename(providerMetadata: Record<string, any> | undefined): string | undefined {
  if (!providerMetadata) return undefined;

  for (const provider of Object.values(providerMetadata)) {
    if (!provider || typeof provider !== "object") continue;

    const filename = provider["filename"];
    if (filename && typeof filename === "string") {
      return filename;
    }
  }

  return undefined;
}

export const FileAttachmentCard = ({ file, size, onPreview, onAddToFiles }: FileAttachmentCardProps) => {
  const { Card, Button, Image } = useTheme();
  const { t } = useTranslation();
  const { mediaType, url, providerMetadata } = file

  const remote = /^https?:\/\//i.test(url ?? "");
  const inline = url?.startsWith("data:") || url?.startsWith("blob:");
  const rawBase64 = !!url && !/^[A-Za-z][A-Za-z\d+.-]*:/.test(url);
  const canDownload = remote || inline || rawBase64;
  const previewUrl = rawBase64 ? `data:${mediaType};base64,${url}` : url;
  const bytes = size ?? (rawBase64 || /^data:[^,]*;base64,/i.test(url ?? "")
    ? base64SizeInKB(url) * 1024
    : undefined);
  const filename = file.filename ?? tryGetFilename(providerMetadata) ?? (remote ? (() => {
    try {
      const parsed = new URL(url);
      return decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "") || parsed.hostname;
    } catch { return undefined; }
  })() : undefined);

  // helper to download
  const handleDownload = async () => {
    try {
      if (!url || !canDownload) return;
      if (remote) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename ?? "";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
        return;
      }
      const response = await fetch(previewUrl);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fileExt = mime.getExtension(mediaType!) ?? 'bin';
      const link = document.createElement('a');
      link.href = blobUrl;
      const now = new Date();
      const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');

      // .NET-like ticks = 100-nanosecond intervals since 0001-01-01
      // We'll compute it similar to C# ticks
      const ticks = BigInt(now.getTime()) * 10000n + 621355968000000000n;

      link.download = filename ?? `${yymmdd}-attachment-${ticks}.${fileExt || 'bin'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <Card
      title={filename ?? t(`mimeTypes:${mediaType}`)}
      description={<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {mediaType && <MimeTypeBadge mimeType={mediaType} />}
        <SizeBadge bytes={bytes} />
      </div>}
      size={"small"}
      actions={
        <>
          {inline && onPreview && (
            <Button icon="preview" size="small" title={t("view")} aria-label={t("view")}
              variant="subtle" onClick={onPreview} />
          )}
          {canDownload && (
            <Button
              icon="download"
              size="small"
              title={t('download')}
              aria-label={t('download')}
              variant="subtle"
              onClick={handleDownload}
            ></Button>
          )}
          {url && onAddToFiles && (
            <Button
              icon="add"
              size="small"
              variant="subtle"
              title={t('addToFiles')}
              onClick={() => onAddToFiles(file)}
            ></Button>
          )}
          {url
            && remote
            && (
              <OpenLinkButton
                size="small"
                url={url}
                variant="subtle"
              />
            )}
        </>
      }
    >
      {mediaType?.startsWith("image/") && canDownload && <Image fit="contain" src={previewUrl} />}
    </Card>
  );
};
