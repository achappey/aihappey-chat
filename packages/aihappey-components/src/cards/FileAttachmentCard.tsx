import { FileUIPart } from "aihappey-ai";
import mime from 'mime'; // <-- default import
import { useTheme } from "../theme/ThemeContext";
import { OpenLinkButton } from "../buttons";

interface FileAttachmentCardProps {
  file: FileUIPart;
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

export const FileAttachmentCard = ({ file }: FileAttachmentCardProps) => {
  const { Card, Button, Image } = useTheme();
  const { mediaType, url } = file

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

      link.download = `${yymmdd}-attachment-${ticks}.${fileExt || 'bin'}`;
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
      title={mediaType}
      description={base64SizeInKB(url!).toFixed(2) + ' KB'}
      size={"small"}
      actions={
        <>
          {url && (
            <Button
              icon="download"
              size="small"
              variant="subtle"
              onClick={handleDownload}
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
