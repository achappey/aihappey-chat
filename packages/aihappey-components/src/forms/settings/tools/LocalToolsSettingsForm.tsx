import { useMemo } from "react";
import { useTheme } from "../../../theme/ThemeContext";

export type PluginToggleItem = {
  id: string;      // plugin id, e.g. "local-files"
  label: string;   // UI label
  description?: string;
};

export type LocalToolsSettingsFormProps = {
  value: string[]; // enabled plugin ids
  onChange: (next: string[]) => void;

  formTitle?: string;
  columns?: number;

  /**
   * The toggles to show (order = display order).
   */
  items?: PluginToggleItem[];
};

export const LocalToolsSettingsForm = ({
  value,
  onChange,
  formTitle,
  columns = 2,
  items,
}: LocalToolsSettingsFormProps) => {
  const { Card, Switch } = useTheme();

  const enabled = value ?? [];

  const list = useMemo(() => items ?? [], [items]);

  const toggle = (id: string) => {
    const has = enabled.includes(id);
    const next = has ? enabled.filter(x => x !== id) : [...enabled, id];
    onChange(next);
  };

  return (
    <Card size={"small"} title={formTitle}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          alignItems: "center",
        }}
      >
        {list.map((item) => {
          const checked = enabled.includes(item.id);
          return (
            <div key={item.id}>
              <Switch
                size="small"
                id={item.id}
                label={item.label}
                checked={checked}
                onChange={() => toggle(item.id)}
              />
              {item.description ? (
                <div style={{ marginTop: 4, marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
                  {item.description}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
