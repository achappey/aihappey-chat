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
  shimmers?: number;
  onImageClick?: (src: ImageContent) => void;
  onImageDownload?: (src: ImageContent) => void;
};

export const ImageGrid = ({
  items,
  columns,
  gap,
  fit,
  shape,
  onImageClick,
  onImageDownload,
  shadow,
  shimmers,
  style,
}: ImageGridProps) => {
  const { Image, Button, Skeleton } = useTheme();

  const colCount = columns && columns > 0 ? columns : undefined;
  const gridTemplate =
    colCount != null
      ? `repeat(${colCount}, 1fr)`
      : "repeat(auto-fill, minmax(200px, 1fr))";
  const gridGap = gap ?? "1rem";

  const shimmerCount = shimmers && shimmers > 0 ? shimmers : 0;

  const cellStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
      {Array.from({ length: shimmerCount }).map((_, i) => (
        <div key={`shimmer-${i}`} style={cellStyle}>
          <Skeleton style={{ width: "100%", height: "100%" }} />
        </div>
      ))}

      {items.map((item, idx) => {
        const src = item.data.startsWith("data:")
          ? item.data
          : `data:${item.mimeType};base64,${item.data}`;

        return (
          <div key={idx} style={cellStyle}>
            <Image
              src={src}
              fit={fit}
              shape={shape}
              shadow={shadow}
              style={{ cursor: onImageClick ? "pointer" : undefined }}
              onClick={() => onImageClick?.(item)}
            />

            <Button
              icon="download"
              variant="primary"
              style={{
                position: "absolute",
                bottom: "0.5rem",
                right: "0.5rem",
              }}
              onClick={() => onImageDownload?.(item)}
            />
          </div>
        );
      })}

    </div>
  );
};
