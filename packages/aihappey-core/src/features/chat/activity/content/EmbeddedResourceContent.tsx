import { useTheme } from "aihappey-components";
import { Markdown } from "../../../../ui/markdown/Markdown";

interface EmbeddedResourceContentProps {
  resource: {
    uri?: string;
    mimeType?: string;
    text?: string;
    blob?: string; // base64 string, no data: prefix
  };
}

export const EmbeddedResourceContent: React.FC<EmbeddedResourceContentProps> = ({
  resource,
}) => {
  const { mimeType, uri, text, blob } = resource;
  const { Image, JsonViewer, AudioPlayer } = useTheme();

  if (!mimeType && !uri && !text && !blob) return <div>No content</div>;

  // Images
  if (mimeType?.startsWith("image/")) {
    const src = uri || (blob ? `data:${mimeType};base64,${blob}` : undefined);
    if (src) return <Image fit="contain" src={src} />;
  }

  // Audio
  if (mimeType?.startsWith("audio/")) {
    const src = uri || (blob ? `data:${mimeType};base64,${blob}` : undefined);
    if (src)
      return <AudioPlayer src={src} />;
  }

  // Video
  if (mimeType?.startsWith("video/")) {
    const src = uri || (blob ? `data:${mimeType};base64,${blob}` : undefined);
    if (src)
      return (
        <video src={src} controls style={{ maxWidth: "100%", borderRadius: 8 }} />
      );
  }

  // JSON
  if (mimeType === "application/json") {
    const content = text
      ? JSON.parse(text)
      : blob
        ? JSON.parse(atob(blob))
        : {};
    return <JsonViewer value={content} />;
  }

  // Plain text
  if (mimeType?.startsWith("text/") && text) {
    return (
      <Markdown text={text} />
    );
  }

  // Base64 blob (binary)
  if (blob && !text) {
    return <></>;
  }

  // Fallback link
  if (uri)
    return (
      <a href={uri} target="_blank" rel="noopener noreferrer">
        Open resource ({mimeType || "unknown type"})
      </a>
    );

  return <span>No displayable content</span>;
};
