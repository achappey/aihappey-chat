import {
  Skeleton as FluentSkeleton,
  SkeletonItem,
} from "@fluentui/react-components";

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  animation?: "pulse" | "wave";
  className?: string;
   style?: React.CSSProperties;
};

/**
 * Themed Skeleton placeholder for Fluent UI.
 * Uses Fluent's Skeleton component.
 */
export const Skeleton = ({
  width,
  height,
  animation = "pulse",
  className,
  style,
}: SkeletonProps) => (
  <FluentSkeleton
    animation={animation}
    style={{
      width,
      maxWidth: "100%",
      ...style
    }}
    className={className}
  >
    <SkeletonItem size={height as any} />
  </FluentSkeleton>
);
