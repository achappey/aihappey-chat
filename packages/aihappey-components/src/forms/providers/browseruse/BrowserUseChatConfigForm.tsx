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

export const BrowserUseChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("providers:browseruse.session") ?? "BrowserUse session"}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <theme.Input
            label={t("providers:browseruse.maxCostUsd") ?? "maxCostUsd"}
            type="number"
            min={0}
            step="0.01"
            value={config?.maxCostUsd ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                maxCostUsd: cleanString(String(e.target.value ?? "")),
              })
            }
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <theme.Input
                label={t("providers:browseruse.profileId") ?? "profileId"}
                value={config?.profileId ?? ""}
                onChange={(e: any) =>
                  updateConfig({
                    ...config,
                    profileId: cleanString(e.target.value),
                  })
                }
              />
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <theme.Input
                label={t("providers:browseruse.workspaceId") ?? "workspaceId"}
                value={config?.workspaceId ?? ""}
                onChange={(e: any) =>
                  updateConfig({
                    ...config,
                    workspaceId: cleanString(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <theme.Select
            label={t("providers:browseruse.proxyCountryCode") ?? "proxyCountryCode"}
            value={config?.proxyCountryCode ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                proxyCountryCode: cleanString(e.target.value),
              })
            }
          >
            <option value="">{t("providerDefault")}</option>
            {PROXY_COUNTRY_CODES.map((countryCode) => (
              <option key={countryCode} value={countryCode}>
                {countryCode.toUpperCase()}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:browseruse.features") ?? "BrowserUse features"}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: "100%",
          }}
        >
          <theme.Switch
            id="browseruseEnableRecording"
            label={t("providers:browseruse.enableRecording") ?? "enableRecording"}
            checked={!!config?.enableRecording}
            size="small"
            onChange={(value) =>
              updateConfig({
                ...config,
                enableRecording: value ? true : undefined,
              })
            }
          />

          <theme.Switch
            id="browseruseSkills"
            label={t("providers:browseruse.skills") ?? "skills"}
            checked={config?.skills !== false}
            size="small"
            onChange={(value) =>
              updateConfig({
                ...config,
                skills: value ? true : false,
              })
            }
          />

          <theme.Switch
            id="browseruseAgentmail"
            label={t("providers:browseruse.agentmail") ?? "agentmail"}
            checked={config?.agentmail !== false}
            size="small"
            onChange={(value) =>
              updateConfig({
                ...config,
                agentmail: value ? true : false,
              })
            }
          />

          <theme.Switch
            id="browseruseCacheScript"
            label={t("providers:browseruse.cacheScript") ?? "cacheScript"}
            checked={!!config?.cacheScript}
            size="small"
            onChange={(value) =>
              updateConfig({
                ...config,
                cacheScript: value ? true : undefined,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
