import { useTheme } from "../theme/ThemeContext";

export type FilterDrawerPanelOption = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
  disabled?: boolean;
  hint?: string;
};

export type FilterDrawerPanelSection = {
  id: string;
  label: string;
  allOption: FilterDrawerPanelOption;
  items: FilterDrawerPanelOption[];
};

export type FilterDrawerPanelProps = {
  title?: string;
  sections: FilterDrawerPanelSection[];
  emptyText?: string;
};

const formatOptionLabel = (option: FilterDrawerPanelOption) => {
  if (typeof option.count === "number") {
    return `${option.label} (${option.count})`;
  }

  return option.label;
};

export const FilterDrawerPanel = ({
  title,
  sections,
  emptyText,
}: FilterDrawerPanelProps) => {
  const { Card, Switch, Text } = useTheme();

  return (
    <Card size="small" title={title}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {sections.length === 0 && !!emptyText ? (
          <Text as="p">{emptyText}</Text>
        ) : null}

        {sections.map((section) => {
          const sectionOptions = [section.allOption, ...section.items];

          return (
            <div
              key={section.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Text as="p" style={{ margin: 0, fontWeight: 700 }}>
                {section.label}
              </Text>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {sectionOptions.map((option) => (
                  <Switch
                    key={`${section.id}-${option.id}`}
                    id={`${section.id}-${option.id}`}
                    label={formatOptionLabel(option)}
                    hint={option.hint}
                    size="small"
                    checked={option.checked}
                    disabled={option.disabled}
                    onChange={option.onChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

