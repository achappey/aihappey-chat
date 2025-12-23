import { useMemo } from "react";
import { useTheme } from "../theme/ThemeContext";

export type LocalToolsSettings = {
  localConversationTools?: boolean;
  localSettingsTools?: boolean;
  localAgentTools?: boolean;
  localMcpTools?: boolean;
};

export type LocalToolsSettingsFormProps = {
  value: LocalToolsSettings;
  onChange: (value: LocalToolsSettings) => void;

  translations?: any;
  formTitle?: string;

  columns?: number;
  size?: string;

  /**
   * Optional: override order/ids/labels.
   */
  items?: Array<{
    key: keyof LocalToolsSettings;
    id: string;
    label: string;
  }>;
};

export const LocalToolsSettingsForm = ({
  value,
  onChange,
  translations,
  formTitle,
  columns = 2,
  items,
}: LocalToolsSettingsFormProps) => {
  const { Card, Switch } = useTheme();

  const defaultItems = useMemo(
    () =>
      [
        {
          key: "localConversationTools",
          id: "localConversations",
          label: translations?.localConversations ?? "localConversations",
        },
        {
          key: "localSettingsTools",
          id: "localSettings",
          label: translations?.localSettings ?? "localSettings",
        },
        {
          key: "localAgentTools",
          id: "localAgents",
          label: translations?.localAgents ?? "localAgents",
        },
        {
          key: "localMcpTools",
          id: "localMcps",
          label: translations?.localMcps ?? "localMcps",
        },
      ] as Array<{ key: keyof LocalToolsSettings; id: string; label: string }>,
    [translations]
  );

  const list = items ?? defaultItems;

  const set = (key: keyof LocalToolsSettings, next: boolean) =>
    onChange({
      ...(value ?? {}),
      [key]: next,
    });

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
          const checked = (value?.[item.key] ?? false) as boolean;
          return (
            <Switch
              key={String(item.key)}
              id={item.id}
              label={item.label}
              checked={checked}
              onChange={() => set(item.key, !checked)}
            />
          );
        })}
      </div>
    </Card>
  );
};
