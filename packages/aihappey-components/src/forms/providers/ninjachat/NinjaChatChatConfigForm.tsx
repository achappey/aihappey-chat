import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const NINJACHAT_GROUP_OPTIONS = ["web", "academic", "news"] as const;
const NINJACHAT_SEARCH_DEPTH_OPTIONS = ["basic", "advanced"] as const;
const NINJACHAT_TOPIC_OPTIONS = ["general", "news", "finance"] as const;

export type NinjaChatChatConfig = {
  group?: (typeof NINJACHAT_GROUP_OPTIONS)[number];
  max_results?: number;
  search_depth?: (typeof NINJACHAT_SEARCH_DEPTH_OPTIONS)[number];
  include_images?: boolean;
  topic?: (typeof NINJACHAT_TOPIC_OPTIONS)[number];
};

const DEFAULT_NINJACHAT_CONFIG: Required<NinjaChatChatConfig> = {
  group: "web",
  max_results: 10,
  search_depth: "basic",
  include_images: false,
  topic: "general",
};

const parseMaxResults = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;

  return Math.min(20, Math.max(1, Math.trunc(parsed)));
};

export const NinjaChatChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: NinjaChatChatConfig;
  updateConfig: (val: NinjaChatChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const group = config?.group ?? DEFAULT_NINJACHAT_CONFIG.group;
  const maxResults = config?.max_results ?? DEFAULT_NINJACHAT_CONFIG.max_results;
  const searchDepth = config?.search_depth ?? DEFAULT_NINJACHAT_CONFIG.search_depth;
  const includeImages = config?.include_images ?? DEFAULT_NINJACHAT_CONFIG.include_images;
  const topic = config?.topic ?? DEFAULT_NINJACHAT_CONFIG.topic;

  const setConfigValue = <K extends keyof NinjaChatChatConfig>(
    key: K,
    value: NinjaChatChatConfig[K] | undefined
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
    <theme.Card size="small" title={t("providers:ninjachat.search", "Search")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={twoColumnGrid}>
          <theme.Select
            label={t("providers:ninjachat.group", "Source")}
            values={[group]}
            valueTitle={t(`providers:ninjachat.groupOptions.${group}`, group)}
            options={NINJACHAT_GROUP_OPTIONS.map((value) => ({
              value,
              label: t(`providers:ninjachat.groupOptions.${value}`, value),
            }))}
            onChange={(value: string) =>
              setConfigValue("group", value as NinjaChatChatConfig["group"])
            }
          >
            {NINJACHAT_GROUP_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:ninjachat.groupOptions.${value}`, value)}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:ninjachat.topic", "Topic")}
            values={[topic]}
            valueTitle={t(`providers:ninjachat.topicOptions.${topic}`, topic)}
            options={NINJACHAT_TOPIC_OPTIONS.map((value) => ({
              value,
              label: t(`providers:ninjachat.topicOptions.${value}`, value),
            }))}
            onChange={(value: string) =>
              setConfigValue("topic", value as NinjaChatChatConfig["topic"])
            }
          >
            {NINJACHAT_TOPIC_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:ninjachat.topicOptions.${value}`, value)}
              </option>
            ))}
          </theme.Select>
        </div>

        <div style={twoColumnGrid}>
          <theme.Select
            label={t("providers:ninjachat.searchDepth", "Search depth")}
            values={[searchDepth]}
            valueTitle={t(`providers:ninjachat.searchDepthOptions.${searchDepth}`, searchDepth)}
            options={NINJACHAT_SEARCH_DEPTH_OPTIONS.map((value) => ({
              value,
              label: t(`providers:ninjachat.searchDepthOptions.${value}`, value),
            }))}
            onChange={(value: string) =>
              setConfigValue("search_depth", value as NinjaChatChatConfig["search_depth"])
            }
          >
            {NINJACHAT_SEARCH_DEPTH_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:ninjachat.searchDepthOptions.${value}`, value)}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="ninjachat-max-results"
            label={t("providers:ninjachat.maxResults", "Max results")}
            type="number"
            min={1}
            max={20}
            value={maxResults}
            onChange={(e: any) => setConfigValue("max_results", parseMaxResults(e?.target?.value))}
          />
        </div>

        <theme.Switch
          id="ninjachat-include-images"
          checked={!!includeImages}
          label={t("providers:ninjachat.includeImages", "Include images")}
          onChange={(value) => setConfigValue("include_images", !!value)}
        />
      </div>
    </theme.Card>
  );
};

