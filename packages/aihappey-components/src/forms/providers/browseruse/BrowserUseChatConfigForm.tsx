import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const PROXY_COUNTRY_CODES = [
  "ad", "ae", "af", "ag", "ai", "al", "am", "an", "ao", "aq", "ar", "as", "at", "au", "aw", "az",
  "ba", "bb", "bd", "be", "bf", "bg", "bh", "bi", "bj", "bl", "bm", "bn", "bo", "bq", "br", "bs",
  "bt", "bv", "bw", "by", "bz", "ca", "cc", "cd", "cf", "cg", "ch", "ck", "cl", "cm", "co", "cr",
  "cs", "cu", "cv", "cw", "cx", "cy", "cz", "de", "dj", "dk", "dm", "do", "dz", "ec", "ee", "eg",
  "eh", "er", "es", "et", "fi", "fj", "fk", "fm", "fo", "fr", "ga", "gd", "ge", "gf", "gg", "gh",
  "gi", "gl", "gm", "gn", "gp", "gq", "gr", "gs", "gt", "gu", "gw", "gy", "hk", "hm", "hn", "hr",
  "ht", "hu", "id", "ie", "il", "im", "in", "iq", "ir", "is", "it", "je", "jm", "jo", "jp", "ke",
  "kg", "kh", "ki", "km", "kn", "kp", "kr", "kw", "ky", "kz", "la", "lb", "lc", "li", "lk", "lr",
  "ls", "lt", "lu", "lv", "ly", "ma", "mc", "md", "me", "mf", "mg", "mh", "mk", "ml", "mm", "mn",
  "mo", "mp", "mq", "mr", "ms", "mt", "mu", "mv", "mw", "mx", "my", "mz", "na", "nc", "ne", "nf",
  "ng", "ni", "nl", "no", "np", "nr", "nu", "nz", "om", "pa", "pe", "pf", "pg", "ph", "pk", "pl",
  "pm", "pn", "pr", "ps", "pt", "pw", "py", "qa", "re", "ro", "rs", "ru", "rw", "sa", "sb", "sc",
  "sd", "se", "sg", "sh", "si", "sj", "sk", "sl", "sm", "sn", "so", "sr", "ss", "st", "sv", "sx",
  "sy", "sz", "tc", "td", "tf", "tg", "th", "tj", "tk", "tl", "tm", "tn", "to", "tr", "tt", "tv",
  "tw", "tz", "ua", "ug", "uk", "us", "uy", "uz", "va", "vc", "ve", "vg", "vi", "vn", "vu", "wf",
  "ws", "xk", "ye", "yt", "za", "zm", "zw",
] as const;

const cleanString = (value: string) => {
  const next = value.trim();
  return next.length ? next : undefined;
};

const cleanObject = (value: Record<string, unknown>) => {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
};

const optionalNumber = (value: unknown) => {
  if (value === "" || value == null) return undefined;
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

export const BrowserUseChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const browserSettings = config?.browserSettings ?? {};
  const judgeEnabled = config?.judge != null;

  const updateBrowserSettings = (patch: Record<string, unknown>) => {
    updateConfig({
      ...config,
      browserSettings: cleanObject({ ...browserSettings, ...patch }),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <theme.Input
          label={t("providers:browseruse.maxCostUsd") ?? "Maximum cost (USD)"}
          type="number"
          min={0.01}
          step="0.01"
          value={config?.maxCostUsd ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              maxCostUsd: optionalNumber(e.target.value),
            })
          }
        />
      </theme.Card>

      <theme.Card size="small" title={t("providers:browseruse.browserSettings") ?? "Browser settings"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            label={t("providers:browseruse.profileId") ?? "Profile ID"}
            value={browserSettings.profileId ?? ""}
            onChange={(e: any) =>
              updateBrowserSettings({ profileId: cleanString(e.target.value) })
            }
          />

          <theme.Select
            label={t("providers:browseruse.proxyCountryCode") ?? "Proxy country"}
            value={browserSettings.proxyCountryCode === null ? "__none__" : browserSettings.proxyCountryCode ?? ""}
            onChange={(e: any) =>
              updateBrowserSettings({
                proxyCountryCode: e.target.value === "__none__"
                  ? null
                  : cleanString(e.target.value),
              })
            }
          >
            <option value="">{t("providerDefault")}</option>
            <option value="__none__">{t("providers:browseruse.noProxy") ?? "No proxy"}</option>
            {PROXY_COUNTRY_CODES.map((countryCode) => (
              <option key={countryCode} value={countryCode}>
                {countryCode.toUpperCase()}
              </option>
            ))}
          </theme.Select>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <theme.Input
              label={t("providers:browseruse.screenWidth") ?? "Screen width"}
              type="number"
              min={320}
              max={6144}
              step={1}
              value={browserSettings.screenWidth ?? ""}
              style={{ flex: "1 1 220px" }}
              onChange={(e: any) =>
                updateBrowserSettings({ screenWidth: optionalNumber(e.target.value) })
              }
            />
            <theme.Input
              label={t("providers:browseruse.screenHeight") ?? "Screen height"}
              type="number"
              min={320}
              max={3456}
              step={1}
              value={browserSettings.screenHeight ?? ""}
              style={{ flex: "1 1 220px" }}
              onChange={(e: any) =>
                updateBrowserSettings({ screenHeight: optionalNumber(e.target.value) })
              }
            />
          </div>

          <theme.Select
            label={t("providers:browseruse.record") ?? "Record browser session"}
            value={browserSettings.record === true ? "true" : browserSettings.record === false ? "false" : ""}
            onChange={(e: any) =>
              updateBrowserSettings({
                record: e.target.value === "" ? undefined : e.target.value === "true",
              })
            }
          >
            <option value="">{t("providerDefault")}</option>
            <option value="true">{t("enabled") ?? "Enabled"}</option>
            <option value="false">{t("disabled") ?? "Disabled"}</option>
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:browseruse.judge") ?? "Judge"}
        headerActions={
          <theme.Switch
            id="browseruseJudge"
            label={t("providers:browseruse.enableJudge") ?? "Enable judge"}
            checked={judgeEnabled}
            size="small"
            onChange={(value) =>
              updateConfig({
                ...config,
                judge: value ? {} : undefined,
              })
            }
          />
        }
      >
        {judgeEnabled && (
          <theme.TextArea
            label={t("providers:browseruse.judgeContext") ?? "Judge context"}
            rows={4}
            value={config.judge?.context ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                judge: cleanObject({ context: cleanString(e.target.value) }) ?? {},
              })
            }
          />
        )}
      </theme.Card>
    </div>
  );
};
