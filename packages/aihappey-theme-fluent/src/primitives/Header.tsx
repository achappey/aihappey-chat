import { Text } from "@fluentui/react-components";

/**
 * Fluent Header component for typography (h1-h6)
 * Pure function component, no React import.
 */
const Header = ({
  level = 1,
  className,
  children,
  style
}: {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties
}) => (
  <Text
    as={`h${level}` as const}
    size={
      level === 1
        ? 900
        : level === 2
        ? 800
        : level === 3
        ? 700
        : level === 4
        ? 600
        : level === 5
        ? 500
        : 100
    }
    style={style}
    className={className}
    weight="semibold"
  >
    {children}
  </Text>
);

export { Header };
