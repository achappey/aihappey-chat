import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_PROMPT_CACHE_OPTIONS = {
  mode: "implicit",
  ttl: "30m",
} as const;

const PROMPT_CACHE_MODES = ["implicit", "explicit"] as const;
type PromptCacheMode = (typeof PROMPT_CACHE_MODES)[number];
const PROMPT_CACHE_TTLS = ["30m"] as const;
type PromptCacheTtl = (typeof PROMPT_CACHE_TTLS)[number];

const toPromptCacheMode = (value: unknown): PromptCacheMode =>
  PROMPT_CACHE_MODES.includes(value as PromptCacheMode)
    ? (value as PromptCacheMode)
    : DEFAULT_PROMPT_CACHE_OPTIONS.mode;

const toPromptCacheTtl = (value: unknown): PromptCacheTtl =>
  PROMPT_CACHE_TTLS.includes(value as PromptCacheTtl)
    ? (value as PromptCacheTtl)
    : DEFAULT_PROMPT_CACHE_OPTIONS.ttl;

const omitPromptCacheOptions = (config: any) => {
  const { prompt_cache_options: _promptCacheOptions, ...rest } = config ?? {};
  return rest;
};

export const OpenAIPromptCacheOptionsForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const promptCacheEnabled = !!config?.prompt_cache_options;
  const mode = toPromptCacheMode(config?.prompt_cache_options?.mode);
  const ttl = toPromptCacheTtl(config?.prompt_cache_options?.ttl);

  const updatePromptCacheOptions = (nextMode: PromptCacheMode, nextTtl: PromptCacheTtl) =>
    updateConfig({
      ...config,
      prompt_cache_options: {
        mode: nextMode,
        ttl: nextTtl,
      },
    });

  return (
    <theme.Card
      size="small"
      title={t("providers:openai.promptCacheOptions.title")}
      headerActions={
        <theme.Switch
          id="openai-prompt-cache-options-enabled"
          checked={promptCacheEnabled}
          onChange={(enabled: boolean) =>
            enabled
              ? updateConfig({ ...config, prompt_cache_options: DEFAULT_PROMPT_CACHE_OPTIONS })
              : updateConfig(omitPromptCacheOptions(config))
          }
        />
      }
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <theme.Select
          label={t("providers:openai.promptCacheOptions.mode")}
          style={{ flex: "1 1 0" }}
          disabled={!promptCacheEnabled}
          values={[mode]}
          valueTitle={t(`providers:openai.promptCacheOptions.modes.${mode}`)}
          options={PROMPT_CACHE_MODES.map((value) => ({
            value,
            label: t(`providers:openai.promptCacheOptions.modes.${value}`),
          }))}
          onChange={(value: string) => updatePromptCacheOptions(toPromptCacheMode(value), ttl)}
        >
          {PROMPT_CACHE_MODES.map((value) => (
            <option key={value} value={value}>
              {t(`providers:openai.promptCacheOptions.modes.${value}`)}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:openai.promptCacheOptions.ttl")}
          style={{ flex: "1 1 0" }}
          disabled={!promptCacheEnabled}
          values={[ttl]}
          valueTitle={t(`providers:openai.promptCacheOptions.ttls.${ttl}`)}
          options={PROMPT_CACHE_TTLS.map((value) => ({
            value,
            label: t(`providers:openai.promptCacheOptions.ttls.${value}`),
          }))}
          onChange={(value: string) => updatePromptCacheOptions(mode, toPromptCacheTtl(value))}
        >
          {PROMPT_CACHE_TTLS.map((value) => (
            <option key={value} value={value}>
              {t(`providers:openai.promptCacheOptions.ttls.${value}`)}
            </option>
          ))}
        </theme.Select>
      </div>
    </theme.Card>
  );
};
