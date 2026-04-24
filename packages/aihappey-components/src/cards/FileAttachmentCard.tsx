import { FileUIPart } from "aihappey-ai";
import mime from 'mime'; // <-- default import
import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "../buttons";
import { useTranslation } from "aihappey-i18n";

interface FileAttachmentCardProps {
  file: FileUIPart;
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

export const FileAttachmentCard = ({ file, onAddToFiles }: FileAttachmentCardProps) => {
  const { Card, Button, Image } = useTheme();
  const { t } = useTranslation();
  const { mediaType, url, providerMetadata } = file

  const filename = tryGetFilename(providerMetadata);

  // helper to download
  const handleDownload = () => {
    try {
      // remove possible data URL prefix (data:...;base64,)
      if (!url) return;

      // Remove "data:...;base64," if present
      const base64Data = url.split(',').pop() ?? url;

      const byteChars = atob(base64Data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], { type: mediaType || 'application/octet-stream' });
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
      description={base64SizeInKB(url!).toFixed(2) + ' KB'}
      size={"small"}
      actions={
        <>
          {url && (
            <Button
              icon="download"
              size="small"
              title={t('download')}
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
            && url.startsWith("http")
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
      {mediaType?.startsWith("image/") && <Image fit="contain" src={url} />}
    </Card>
  );
};
