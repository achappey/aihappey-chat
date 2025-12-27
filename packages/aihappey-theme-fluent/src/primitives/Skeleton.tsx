import { Skeleton as FluentSkeleton, SkeletonItem } from "@fluentui/react-components";

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  animation?: "pulse" | "wave";
  className?: string;
  style?: React.CSSProperties;
};

const cssSize = (v?: number | string) => (typeof v === "number" ? `${v}px` : v);

export const Skeleton = ({
  width,
  height,
  animation = "pulse",
  className,
  style,
}: SkeletonProps) => {
  const w = cssSize(width);
  const h = cssSize(height);

  return (
    <FluentSkeleton
      animation={animation}
      className={className}
      style={{
        width: w,
        height: h, // <- important if parent doesn't constrain height
        maxWidth: "100%",
        ...style,
      }}
    >
      <SkeletonItem
        style={{
          width: "100%",
          height: h ?? "100%",
        }}
      />
    </FluentSkeleton>
  );
};
