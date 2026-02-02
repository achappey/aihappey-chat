import { useTheme } from "../theme/ThemeContext";

export type VideoContent = {
  type: "base64";
  data: string;
  mimeType: string;
  _meta?: Record<string, any>;
};

type VideoGridProps = {
  items: VideoContent[];
  columns?: number;
  gap?: number | string;
  shape?: "square" | "rounded" | "circular";
  shadow?: boolean;
  style?: React.CSSProperties;
  shimmers?: number;
  onVideoClick?: (src: VideoContent, index: number) => void;
  onVideoDownload?: (src: VideoContent) => void;
};

export const VideoGrid = ({
  items,
  columns,
  gap,
  shape,
  onVideoClick,
  onVideoDownload,
  shadow,
  shimmers,
  style,
}: VideoGridProps) => {
  const { Button, Skeleton, Badge } = useTheme();

  const colCount = columns && columns > 0 ? columns : undefined;
  const gridTemplate =
    colCount != null
      ? `repeat(${colCount}, 1fr)`
      : "repeat(auto-fill, minmax(240px, 1fr))";
  const gridGap = gap ?? "1rem";

  const shimmerCount = shimmers && shimmers > 0 ? shimmers : 0;

  const cellStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "16 / 9",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: shape === "rounded" ? 12 : shape === "circular" ? 999 : 0,
    boxShadow: shadow ? "0 6px 18px rgba(0,0,0,0.12)" : undefined,
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
            <video
              src={src}
              muted
              playsInline
              controls
              preload="metadata"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                cursor: onVideoClick ? "pointer" : undefined,
              }}
              onClick={() => onVideoClick?.(item, idx)}
            />

            {onVideoDownload && (
              <Button
                icon="download"
                variant="primary"
                shape="square"
                style={{
                  position: "absolute",
                  bottom: "0.5rem",
                  right: "0.5rem",
                }}
                onClick={() => onVideoDownload(item)}
              />
            )}

            {item._meta?.model != null && (
              <div
                style={{
                  position: "absolute",
                  top: "0.5rem",
                  left: "0.5rem",
                }}
              >
                <Badge icon="brain">{item._meta?.model as string}</Badge>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
