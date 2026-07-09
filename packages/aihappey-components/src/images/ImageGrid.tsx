import type { ImageContent } from "@modelcontextprotocol/sdk/types";
import { CostBadge } from "../badges";
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
  onImageClick?: (src: ImageContent, index: number) => void;
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
  const { Image, Button, Skeleton, Badge } = useTheme();

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
        const cost = item._meta?.cost;
        const gatewayCost = typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;

        return (
          <div key={idx} style={cellStyle}>
            <Image
              src={src}
              fit={fit}
              shape={shape}
              shadow={shadow}
              style={{ cursor: onImageClick ? "pointer" : undefined }}
              onClick={() => onImageClick?.(item, idx)}
            />

            {onImageDownload && <Button
              icon="download"
              variant="primary"
              shape="square"
              style={{
                position: "absolute",
                bottom: "0.5rem",
                right: "0.5rem",
              }}
              onClick={() => onImageDownload(item)}
            />}

            {item._meta?.model != undefined && <div
              style={{
                position: "absolute",
                top: "0.5rem",
                left: "0.5rem",
              }}
            ><Badge
              icon="brain"
            >{item._meta?.model as string}</Badge></div>}

            {gatewayCost !== undefined && <div
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
              }}
            >
              <CostBadge cost={gatewayCost} size="small" />
            </div>}

          </div>
        );
      })}

    </div>
  );
};
