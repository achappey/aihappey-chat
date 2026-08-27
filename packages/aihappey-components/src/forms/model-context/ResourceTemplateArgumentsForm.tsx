import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

export type ResourceTemplateArgumentsFormProps = {
  argumentNames: string[];
  values: Record<string, string>;
  completions: Record<string, string[]>;
  pending?: boolean;
  error?: string | null;
  onChange: (name: string, value: string) => void;
  onFilter?: (name: string, value: string) => Promise<void> | void;
  onSubmit?: () => void;
};

export const ResourceTemplateArgumentsForm = ({
  argumentNames,
  values,
  completions,
  pending,
  error,
  onChange,
  onFilter,
  onSubmit,
}: ResourceTemplateArgumentsFormProps) => {
  const { Input, Alert, Select } = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ minWidth: 320, maxHeight: 400, overflowY: "auto" }}>
      {(argumentNames ?? []).length === 0 && (
        <Alert variant="info">{t("mcp.resourceTemplateNoArguments")}</Alert>
      )}

      {(argumentNames ?? []).map((name) => (
        <div key={name} style={{ marginBottom: 12, marginRight: 12 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!pending) onSubmit?.();
            }}
          >
            {completions[name] ? (
              <Select
                value={values[name] ?? ""}
                freeform
                label={name}
                onFilter={(query: string) => onFilter?.(name, query)}
                onChange={(v: string) => onChange(name, v)}
                disabled={pending}
              >
                {completions[name].map((opt: string, i: number) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={values[name] ?? ""}
                label={name}
                onChange={(e: any) => onChange(name, e.target.value)}
                disabled={pending}
              />
            )}
          </form>
        </div>
      ))}

      {error && (
        <div style={{ marginTop: 4 }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
    </div>
  );
};

