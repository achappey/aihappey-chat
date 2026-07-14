import type { ReactNode } from "react";
import { useDocsTheme } from "../theme/useDocsTheme";

export type ApiSectionProps = {
  title: string;
  children: ReactNode;
};

export const ApiSection = ({ title, children }: ApiSectionProps) => {
  const { Header } = useDocsTheme();

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <Header level={2}>{title}</Header>
      <div style={{ lineHeight: 1.75 }}>{children}</div>
    </section>
  );
};

