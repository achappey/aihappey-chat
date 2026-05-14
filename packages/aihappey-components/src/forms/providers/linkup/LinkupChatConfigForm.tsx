import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const LINKUP_MODE_OPTIONS = ["Answer", "Auto", "Investigate", "Research"] as const;
const LINKUP_REASONING_DEPTH_OPTIONS = ["L", "M", "S", "XL"] as const;

export type LinkupChatConfig = {
  excludeDomains?: string[];
  fromDate?: string;
  includeDomains?: string[];
  includeImages?: boolean;
  toDate?: string;
  mode?: (typeof LINKUP_MODE_OPTIONS)[number];
  reasoningDepth?: (typeof LINKUP_REASONING_DEPTH_OPTIONS)[number];
};

const DEFAULT_LINKUP_CONFIG: Required<
  Pick<LinkupChatConfig, "includeImages" | "mode" | "reasoningDepth">
> = {
  includeImages: false,
  mode: "Auto",
  reasoningDepth: "L",
};

const parseDomainList = (value: unknown, maxItems?: number) => {
  const parsed = Array.from(
    new Set(
      String(value ?? "")
        .split(/[\n,]/g)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

  return parsed.length === 0
    ? undefined
    : typeof maxItems === "number"
      ? parsed.slice(0, maxItems)
      : parsed;
};

const serializeDomainList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && !!item.trim()).join("\n")
    : "";

const normalizeOptionalDate = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : undefined;
};

export const LinkupChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: LinkupChatConfig;
  updateConfig: (val: LinkupChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const mode = config?.mode ?? DEFAULT_LINKUP_CONFIG.mode;
  const reasoningDepth =
    config?.reasoningDepth ?? DEFAULT_LINKUP_CONFIG.reasoningDepth;
  const includeImages =
    config?.includeImages ?? DEFAULT_LINKUP_CONFIG.includeImages;

  const setConfigValue = <K extends keyof LinkupChatConfig>(
    key: K,
    value: LinkupChatConfig[K] | undefined
  ) => {
    const nextConfig = { ...(config ?? {}) };

    if (value === undefined) {
      delete nextConfig[key];
    } else {
      nextConfig[key] = value;
    }

    updateConfig(nextConfig);
  };

  const twoColumnGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    width: "100%",
    alignItems: "end",
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general") ?? "General"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:linkup.mode", "Mode")}
            values={[mode]}
            valueTitle={t(`providers:linkup.modes.${mode}`, mode)}
            options={LINKUP_MODE_OPTIONS.map((value) => ({
              value,
              label: t(`providers:linkup.modes.${value}`, value),
            }))}
            onChange={(value: string) =>
              setConfigValue(
                "mode",
                (String(value ?? DEFAULT_LINKUP_CONFIG.mode) as LinkupChatConfig["mode"])
              )
            }
          >
            {LINKUP_MODE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:linkup.modes.${value}`, value)}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:linkup.reasoningDepth", "Reasoning depth")}
            values={[reasoningDepth]}
            valueTitle={t(
              `providers:linkup.reasoningDepthOptions.${reasoningDepth}`,
              reasoningDepth
            )}
            options={LINKUP_REASONING_DEPTH_OPTIONS.map((value) => ({
              value,
              label: t(`providers:linkup.reasoningDepthOptions.${value}`, value),
            }))}
            onChange={(value: string) =>
              setConfigValue(
                "reasoningDepth",
                (String(
                  value ?? DEFAULT_LINKUP_CONFIG.reasoningDepth
                ) as LinkupChatConfig["reasoningDepth"])
              )
            }
          >
            {LINKUP_REASONING_DEPTH_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:linkup.reasoningDepthOptions.${value}`, value)}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="linkupIncludeImages"
            checked={!!includeImages}
            label={t("providers:linkup.includeImages", "Include images")}
            onChange={(value) =>
              setConfigValue("includeImages", !!value)
            }
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:linkup.domainFilters", "Domain filters")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.TextArea
            label={t("providers:linkup.includeDomains", "Include domains")}
            placeholder={"microsoft.com\nagolution.com"}
            rows={4}
            value={serializeDomainList(config?.includeDomains)}
            onChange={(value: string) =>
              setConfigValue("includeDomains", parseDomainList(value, 100))
            }
          />

          <div style={{ fontSize: 12, opacity: 0.72 }}>
            {t(
              "providers:linkup.includeDomainsHelp",
              "One domain per line or comma-separated. Maximum 100 domains."
            )}
          </div>

          <theme.TextArea
            label={t("providers:linkup.excludeDomains", "Exclude domains")}
            placeholder={"wikipedia.org"}
            rows={4}
            value={serializeDomainList(config?.excludeDomains)}
            onChange={(value: string) =>
              setConfigValue("excludeDomains", parseDomainList(value))
            }
          />

          <div style={{ fontSize: 12, opacity: 0.72 }}>
            {t(
              "providers:linkup.excludeDomainsHelp",
              "One domain per line or comma-separated. Leave empty to avoid restricting results."
            )}
          </div>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:linkup.dateRange", "Date range")}>
        <div style={twoColumnGrid}>
          <theme.Input
            type="date"
            label={t("providers:linkup.fromDate", "From date")}
            value={config?.fromDate ?? ""}
            onChange={(e: any) =>
              setConfigValue("fromDate", normalizeOptionalDate(e?.target?.value))
            }
          />

          <theme.Input
            type="date"
            label={t("providers:linkup.toDate", "To date")}
            value={config?.toDate ?? ""}
            onChange={(e: any) =>
              setConfigValue("toDate", normalizeOptionalDate(e?.target?.value))
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
