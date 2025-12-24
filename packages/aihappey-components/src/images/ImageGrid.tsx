import type { ImageContent } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";

type ImageGridProps = {
  items: ImageContent[];
  columns?: number;
  gap?: number | string;
  fit?: "contain" | "cover";
  shape?: "square" | "rounded" | "circular";
  shadow?: boolean;
  style?: React.CSSProperties;
};

export const ImageGrid = ({
  items,
  columns,
  gap,
  fit,
  shape,
  shadow,
  style,
}: ImageGridProps) => {
  const { Image, Button } = useTheme();
  const colCount = columns && columns > 0 ? columns : undefined;
  const gridTemplate =
    colCount != null
      ? `repeat(${colCount}, 1fr)`
      : "repeat(auto-fill, minmax(200px, 1fr))";
  const gridGap = gap ?? "1rem";
  // 1) Robust downloader (works for data URLs, raw base64, svg, webp, etc.)
  const handleDownload = async (item: ImageContent, index: number) => {
    try {
      // Normalize to a data URL we can fetch()
      const href = item.data.startsWith("data:")
        ? item.data
        : `data:${item.mimeType};base64,${item.data}`;

      // Turn into a Blob reliably (no atob(), no giant href clicks)
      const res = await fetch(href);
      const blob = await res.blob();

      // Pick a sane extension from mime
      const ext =
        ({
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/webp": "webp",
          "image/gif": "gif",
          "image/svg+xml": "svg",
          "image/bmp": "bmp",
          "image/avif": "avif",
        } as Record<string, string>)[item.mimeType] || "bin";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image_${index}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Give the browser a moment to start the download before revoking
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error("Download failed:", e);
      // Fallback: try opening the data directly
      try {
        const fallback = item.data.startsWith("data:")
          ? item.data
          : `data:${item.mimeType};base64,${item.data}`;
        window.open(fallback, "_blank");
      } catch { }
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: gridTemplate,
        gap: gridGap,
        ...style,
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={
              item.data?.startsWith("data:")
                ? item.data
                : `data:${item.mimeType};base64,${item.data}`
            }
            fit={fit}
            shape={shape}
            shadow={shadow}
          />
          <Button
            icon="download"
            variant="primary"
            style={{
              position: "absolute",
              bottom: "0.5rem",
              right: "0.5rem",
            }}
            onClick={() => handleDownload(item, idx)}
          />
        </div>
      ))}
    </div>
  );
};
