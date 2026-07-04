import type { ReactNode } from "react";

export const ContextSearchGrid = ({
  children,
  empty,
}: {
  children: ReactNode;
  empty?: boolean;
}) => {
  if (empty) {
    return <div style={styles.empty}>{"No results"}</div>;
  }

  return <div style={styles.grid}>{children}</div>;
};

export const contextTabTitle = (title: string, count: number) => `${title} (${count})`;

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    width: "100%",
    marginTop: 12,
  },
  empty: {
    color: "#888",
    textAlign: "center",
    padding: 16,
  },
};

