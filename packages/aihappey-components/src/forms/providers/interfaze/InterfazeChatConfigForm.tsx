import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORTS = ["low", "medium", "high"] as const;
const DEFAULT_REASONING_EFFORT = "medium";

export const INTERFAZE_HEADERS = [
  "x-show-additional-info",
  "x-interfaze-zdr",
  "x-interfaze-bypass-cache",
  "x-interfaze-bypass-moa",
] as const;

const omitKey = (value: Record<string, any> | undefined, key: string) => {
  const { [key]: _omitted, ...rest } = value ?? {};
  return rest;
};

const cleanHeaders = (headers: Record<string, string> | undefined) => {
  const nextHeaders = Object.fromEntries(
    Object.entries(headers ?? {}).filter(
      ([key, value]) => key.trim().length > 0 && String(value ?? "").trim().length > 0,
    ),
  );

  return Object.keys(nextHeaders).length ? nextHeaders : undefined;
};

const headerEnabled = (headers: Record<string, string> | undefined, header: string) =>
  Object.entries(headers ?? {}).some(
    ([key, value]) => key.toLowerCase() === header && String(value).toLowerCase() === "true",
  );

export const updateInterfazeBooleanHeader = (
  headers: Record<string, string> | undefined,
  header: (typeof INTERFAZE_HEADERS)[number],
  enabled: boolean,
) => {
  const nextHeaders = Object.fromEntries(
    Object.entries(headers ?? {}).filter(([key]) => key.toLowerCase() !== header),
  );

  if (enabled) nextHeaders[header] = "true";
  return cleanHeaders(nextHeaders);
};

export const InterfazeChatConfigForm = ({
  config,
  headers,
  updateConfig,
  updateHeaders,
}: {
  config: any;
  headers?: Record<string, string>;
  updateConfig: (value: any) => void;
  updateHeaders?: (value: Record<string, string> | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const reasoningOn = config?.reasoning_effort !== undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:interfaze.reasoning.title")}
        headerActions={
          <theme.Switch
            id="interfaze-reasoning"
            checked={reasoningOn}
            onChange={(enabled: boolean) =>
              updateConfig(
                enabled
                  ? { ...(config ?? {}), reasoning_effort: DEFAULT_REASONING_EFFORT }
                  : omitKey(config, "reasoning_effort"),
              )
            }
          />
        }
      >
        <theme.Select
          label={t("providers:interfaze.reasoning.effort")}
          disabled={!reasoningOn}
          values={[config?.reasoning_effort ?? DEFAULT_REASONING_EFFORT]}
          valueTitle={t(
            `providers:interfaze.reasoning.efforts.${config?.reasoning_effort ?? DEFAULT_REASONING_EFFORT}`,
          )}
          onChange={(reasoningEffort: string) =>
            updateConfig({ ...(config ?? {}), reasoning_effort: reasoningEffort })
          }
        >
          {REASONING_EFFORTS.map((effort) => (
            <option key={effort} value={effort}>
              {t(`providers:interfaze.reasoning.efforts.${effort}`)}
            </option>
          ))}
        </theme.Select>
      </theme.Card>

      <theme.Card size="small" title={t("providers:interfaze.other.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INTERFAZE_HEADERS.map((header) => (
            <theme.Switch
              key={header}
              id={`interfaze-${header}`}
              label={t(`providers:interfaze.other.headers.${header}`)}
              checked={headerEnabled(headers, header)}
              onChange={(enabled: boolean) =>
                updateHeaders?.(updateInterfazeBooleanHeader(headers, header, enabled))
              }
            />
          ))}
        </div>
      </theme.Card>
    </div>
  );
};
