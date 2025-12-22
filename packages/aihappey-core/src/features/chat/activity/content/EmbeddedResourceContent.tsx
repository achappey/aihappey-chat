import { useTheme } from "aihappey-components";


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
  const { Image, JsonViewer, Button } = useTheme();

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
      return <audio src={src} controls style={{ width: "100%" }} />;
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
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
        {text}
      </pre>
    );
  }

  // Base64 blob (binary)
  if (blob && !text) {
    //  return <span>No displayable content</span>;
    return <></>;

    /* const filename = uri?.split("/").pop() || "download.bin";
     const downloadUrl = `data:${mimeType || "application/octet-stream"};base64,${blob}`;
     return (
       <Button
         onClick={() => {
           const a = document.createElement("a");
           a.href = downloadUrl;
           a.download = filename;
           a.click();
         }}
       >
         Download file
       </Button>
     );*/
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
