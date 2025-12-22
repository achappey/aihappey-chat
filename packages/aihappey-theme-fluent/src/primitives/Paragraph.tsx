import { Text } from "@fluentui/react-components";

/**
 * Fluent Paragraph component for body text
 * Pure function component, no React import.
 */
const Paragraph = ({
  className,
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <Text as="p" block className={className} style={style}>
    {children}
  </Text>
);

export { Paragraph };
