import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const APP_ATTRIBUTION_HEADERS = {
  referer: "HTTP-Referer",
  title: "X-Title",
} as const;

const DEFAULT_APP_TITLE = "AIHappey";

const normalizeOptionalString = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : undefined;
};

const getBrowserOrigin = () => {
  if (typeof window === "undefined") return undefined;
  return window.location?.origin || undefined;
};

const getAttributionHeaders = (appTitle?: string) => ({
  [APP_ATTRIBUTION_HEADERS.referer]: getBrowserOrigin(),
  [APP_ATTRIBUTION_HEADERS.title]: normalizeOptionalString(appTitle) ?? DEFAULT_APP_TITLE,
});

const removeAttributionHeaders = (headers: Record<string, any> | undefined) => {
  const nextHeaders = { ...(headers ?? {}) };
  delete nextHeaders[APP_ATTRIBUTION_HEADERS.referer];
  delete nextHeaders[APP_ATTRIBUTION_HEADERS.title];
  return Object.keys(nextHeaders).length ? nextHeaders : undefined;
};

const removeConfigHeaders = (config: any) => {
  const { headers: _headers, ...bodyConfig } = config ?? {};
  return bodyConfig;
};

export const RequestyChatConfigForm = ({
  config,
  headers,
  updateConfig,
  updateHeaders,
  appTitle,
}: {
  config: any;
  headers?: Record<string, string>;
  updateConfig: (val: any) => void;
  updateHeaders?: (val: Record<string, string> | undefined) => void;
  appTitle?: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const autoCacheEnabled = config?.requesty?.auto_cache !== false;
  const appAttributionHeaders = getAttributionHeaders(appTitle);
  const appAttributionOn =
    !!headers?.[APP_ATTRIBUTION_HEADERS.referer] &&
    !!headers?.[APP_ATTRIBUTION_HEADERS.title];

  const updateAutoCache = (enabled: boolean) => {
    updateConfig(removeConfigHeaders({
      ...(config ?? {}),
      requesty: {
        ...(config?.requesty ?? {}),
        auto_cache: enabled,
      },
    }));
  };

  const updateAppAttribution = (enabled: boolean) => {
    updateHeaders?.(
      enabled
        ? {
          ...(headers ?? {}),
          ...appAttributionHeaders,
        }
        : removeAttributionHeaders(headers)
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:requesty.appAttribution") ?? "App attribution"}
        headerActions={
          <theme.Switch
            id="requestyAppAttribution"
            checked={appAttributionOn}
            onChange={updateAppAttribution}
          />
        }
      >
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:requesty.autoCache") ?? "Auto caching"}
        headerActions={
          <theme.Switch
            id="requestyAutoCache"
            checked={autoCacheEnabled}
            onChange={updateAutoCache}
          />
        }
      >
      </theme.Card>
    </div>
  );
};
