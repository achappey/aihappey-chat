import React from "react";
import { useTheme } from "../theme/ThemeContext";

export type ProviderKeyItem = {
  id: string;
  name: string;
  header: string;
  iconSrc?: string;
};

export interface ProviderKeysFormProps {
  items: ProviderKeyItem[];
  values: Record<string, string | undefined>;
  onChange: (header: string, value: string) => void;
  onRemove: (header: string) => void;
  title?: string;
  apiKeyLabel?: string;
}

export const ProviderKeysForm: React.FC<ProviderKeysFormProps> = ({
  items,
  values,
  onChange,
  onRemove,
  title,
  apiKeyLabel = "API key",
}) => {
  const theme = useTheme();

  return (
    <theme.Card size="small" title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {items.map((item) => {
          const value = values[item.header] ?? "";

          return (
            <div
              key={item.header}
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              {item.iconSrc ? (
                <theme.Image width={24} src={item.iconSrc} />
              ) : null}

              <div style={{ width: 120, fontWeight: 600 }}>
                {item.name}
              </div>

              <theme.Input
                value={value}
                style={{ flexGrow: 1 }}
                placeholder={`${item.name} ${apiKeyLabel}...`}
                onChange={(e: any) =>
                  onChange(item.header, e.target.value)
                }
              />

              <theme.Button
                icon="delete"
                variant="danger"
                size="small"
                disabled={!value}
                onClick={() => onRemove(item.header)}
              />
            </div>
          );
        })}
      </div>
    </theme.Card>
  );
};
