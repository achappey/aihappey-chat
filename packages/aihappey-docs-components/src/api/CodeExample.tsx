import { useState } from "react";
import type { DocsCodeExample } from "../navigation/types";
import { useDocsTheme } from "../theme/useDocsTheme";

export type CodeExampleProps = {
  examples: DocsCodeExample[];
};

export const CodeExample = ({ examples }: CodeExampleProps) => {
  const [activeId, setActiveId] = useState(examples[0]?.id);
  const { Button, Card } = useDocsTheme();
  const active = examples.find((example) => example.id === activeId) ?? examples[0];

  if (!active) return null;

  return (
    <Card title={active.label} description={active.language}>
      <div style={{ display: "grid", gap: 12 }}>
        {examples.length > 1 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {examples.map((example) => (
              <Button
                key={example.id}
                type="button"
                variant={example.id === active.id ? "primary" : "secondary"}
                size="small"
                onClick={() => setActiveId(example.id)}
              >
                {example.label}
              </Button>
            ))}
          </div>
        ) : null}
        <pre
          style={{
            margin: 0,
            padding: 16,
            overflow: "auto",
            borderRadius: 14,
            background: "rgba(127,127,127,0.12)",
            lineHeight: 1.6,
          }}
        >
          <code>{active.code}</code>
        </pre>
      </div>
    </Card>
  );
};

