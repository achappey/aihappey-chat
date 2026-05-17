import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const ANTHROPIC_ALLOWED_CALLERS = [
  "direct",
  "code_execution_20250825",
  "code_execution_20260120",
] as const;

export const ANTHROPIC_CACHE_CONTROL_TTLS = ["5m", "1h"] as const;

export const createAnthropicCacheControl = (ttl?: string) => ({
  type: "ephemeral",
  ttl,
});

export const parseAnthropicNumberInput = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseAnthropicStringList = (value: string) =>
  (() => {
    const nextValues = String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return nextValues.length ? nextValues : null;
  })();

export const formatAnthropicStringList = (value: string[] | null | undefined) =>
  Array.isArray(value) && value.length ? value.join(", ") : "";

const formatJsonValue = (value: any) =>
  value === undefined ? "" : JSON.stringify(value, null, 2);

const tryParseJsonValue = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { ok: true as const, value: undefined };

  try {
    return { ok: true as const, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false as const, value: undefined };
  }
};

type AnthropicJsonTextAreaProps = {
  label: string;
  value: any;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  onChange: (value: any) => void;
};

export const AnthropicJsonTextArea = ({
  label,
  value,
  disabled,
  placeholder,
  rows = 5,
  onChange,
}: AnthropicJsonTextAreaProps) => {
  const theme = useTheme();
  const serializedValue = useMemo(() => formatJsonValue(value), [value]);
  const [draft, setDraft] = useState(serializedValue);

  useEffect(() => {
    setDraft(serializedValue);
  }, [serializedValue]);

  return (
    <theme.TextArea
      label={label}
      readOnly={disabled}
      rows={rows}
      placeholder={placeholder}
      value={draft}
      onChange={(nextValue: string) => {
        setDraft(nextValue);

        const parsed = tryParseJsonValue(nextValue);
        if (parsed.ok) {
          onChange(parsed.value);
        }
      }}
    />
  );
};

type AnthropicSharedToolFieldsProps = {
  idPrefix: string;
  disabled?: boolean;
  tool: any;
  versions: string[];
  onVersionChange: (value: string) => void;
  onChange: (value: any) => void;
};

export const AnthropicSharedToolFields = ({
  idPrefix,
  disabled,
  tool,
  versions,
  onVersionChange,
  onChange,
}: AnthropicSharedToolFieldsProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const selectedType = tool?.type ?? versions[0] ?? "";
  const allowedCallers = Array.isArray(tool?.allowed_callers)
    ? tool.allowed_callers
    : [];

  return (
    <>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          width: "100%",
        }}
      >
        <theme.Select
          label={t("providers:anthropic.version")}
          disabled={disabled}
          values={[selectedType]}
          valueTitle={selectedType}
          onChange={onVersionChange}
        >
          {versions.map((value) => (
            <option key={`${idPrefix}-type-${value}`} value={value}>
              {value}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:anthropic.allowedCallers")}
          disabled={disabled}
          multiselect
          values={allowedCallers}
          valueTitle={
            allowedCallers.length
              ? allowedCallers.join(", ")
              : t("providers:anthropic.none")
          }
          onChange={(value: string) => {
            const nextValues = allowedCallers.includes(value)
              ? allowedCallers.filter((item: string) => item !== value)
              : [...allowedCallers, value];

            onChange({
              ...tool,
              allowed_callers: nextValues.length ? nextValues : undefined,
            });
          }}
        >
          {ANTHROPIC_ALLOWED_CALLERS.map((value) => (
            <option key={`${idPrefix}-allowed-caller-${value}`} value={value}>
              {value}
            </option>
          ))}
        </theme.Select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          width: "100%",
          alignItems: "start",
        }}
      >
        <theme.Switch
          id={`${idPrefix}-cache-control-enabled`}
          label={t("providers:anthropic.cacheControl")}
          size="small"
          disabled={disabled}
          checked={!!tool?.cache_control}
          onChange={(checked: boolean) =>
            onChange({
              ...tool,
              cache_control: checked
                ? createAnthropicCacheControl(tool?.cache_control?.ttl)
                : undefined,
            })
          }
        />

        <theme.Switch
          id={`${idPrefix}-defer-loading`}
          label={t("providers:anthropic.deferLoading")}
          size="small"
          disabled={disabled}
          checked={!!tool?.defer_loading}
          onChange={(checked: boolean) =>
            onChange({
              ...tool,
              defer_loading: checked || undefined,
            })
          }
        />

        <theme.Switch
          id={`${idPrefix}-strict`}
          label={t("providers:anthropic.strictValidation")}
          size="small"
          disabled={disabled}
          checked={!!tool?.strict}
          onChange={(checked: boolean) =>
            onChange({
              ...tool,
              strict: checked || undefined,
            })
          }
        />
      </div>

      {tool?.cache_control ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px", minWidth: 220 }}>
            <theme.Select
              label={t("providers:anthropic.cacheControlType")}
              disabled={disabled}
              values={[tool?.cache_control?.type ?? "ephemeral"]}
              valueTitle={t("providers:anthropic.ephemeral")}
              onChange={() =>
                onChange({
                  ...tool,
                  cache_control: createAnthropicCacheControl(tool?.cache_control?.ttl),
                })
              }
            >
              <option value="ephemeral">{t("providers:anthropic.ephemeral")}</option>
            </theme.Select>
          </div>

          <div style={{ flex: "1 1 220px", minWidth: 220 }}>
            <theme.Select
              label={t("providers:anthropic.cacheDuration")}
              disabled={disabled}
              values={[tool?.cache_control?.ttl ?? ""]}
              valueTitle={tool?.cache_control?.ttl ?? t("providers:anthropic.defaultOption")}
              onChange={(value: string) =>
                onChange({
                  ...tool,
                  cache_control: {
                    type: "ephemeral",
                    ttl: value || undefined,
                  },
                })
              }
            >
              <option value="">{t("providers:anthropic.defaultOption")}</option>
              {ANTHROPIC_CACHE_CONTROL_TTLS.map((value) => (
                <option key={`${idPrefix}-cache-ttl-${value}`} value={value}>
                  {value}
                </option>
              ))}
            </theme.Select>
          </div>
        </div>
      ) : null}
    </>
  );
};
