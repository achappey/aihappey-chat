import type { DocsHomeCard } from "../navigation/types";
import { useDocsTheme } from "../theme/useDocsTheme";
import { DocsLink } from "../layout/DocsLink";

export type DocsCardGridProps = {
  cards: DocsHomeCard[];
};

export const DocsCardGrid = ({ cards }: DocsCardGridProps) => {
  const { Card, Button } = useDocsTheme();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 20,
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          title={card.title}
          description={card.description}
          actions={
            <DocsLink href={card.href}>
              <Button type="button" variant="secondary">Open</Button>
            </DocsLink>
          }
          style={{ minHeight: 260 }}
        >
          <div style={{ display: "grid", gap: 16 }}>
            {card.icon ? <div style={{ fontSize: 28 }}>{card.icon}</div> : null}
            <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78 }}>{card.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

