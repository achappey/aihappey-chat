import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const WEB_SEARCH_ENGINES = ["exa", "google"] as const;
const MODALITIES = ["text", "image"] as const;
const REASONING_EFFORTS = ["none", "low", "minimal", "medium", "high"] as const;

const DEFAULT_WEB_SEARCH = {
  engine: "exa",
  max_results: 3,
  max_steps: 1,
};

const DEFAULT_IMAGE_CONFIG = {
  aspect_ratio: "1:1",
  image_size: "1K",
  partial_images: 1,
  n: 1,
};

const DEFAULT_REASONING_EFFORT = "medium";

const omitKey = (value: any, key: string) => {
  const { [key]: _omitted, ...rest } = value ?? {};
  return rest;
};

const positiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
};

export const InworldChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (value: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const webSearchOn = !!config?.web_search;
  const imageConfigOn = !!config?.image_config;
  const reasoningOn = config?.reasoning_effort !== undefined;
  const modalities = Array.isArray(config?.modalities) ? config.modalities : [];

  const submitConfig = (nextConfig: any) => {
    const withoutNativeWebSearch = omitKey(nextConfig, "web_search_options");
    updateConfig(withoutNativeWebSearch);
  };

  const toggleModality = (modality: (typeof MODALITIES)[number], enabled: boolean) => {
    const nextModalities = enabled
      ? Array.from(new Set([...modalities, modality]))
      : modalities.filter((value: string) => value !== modality);

    submitConfig({ ...config, modalities: nextModalities });
  };

  const updateWebSearch = (patch: Record<string, unknown>) =>
    submitConfig({
      ...config,
      web_search: {
        ...DEFAULT_WEB_SEARCH,
        ...(config?.web_search ?? {}),
        ...patch,
      },
    });

  const updateImageConfig = (patch: Record<string, unknown>) =>
    submitConfig({
      ...config,
      image_config: {
        ...DEFAULT_IMAGE_CONFIG,
        ...(config?.image_config ?? {}),
        ...patch,
      },
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:inworld.webSearch.title")}
        headerActions={
          <theme.Switch
            id="inworld-web-search"
            checked={webSearchOn}
            onChange={(enabled: boolean) =>
              submitConfig(
                enabled
                  ? { ...config, web_search: { ...DEFAULT_WEB_SEARCH } }
                  : omitKey(config, "web_search")
              )
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:inworld.webSearch.engine")}
            disabled={!webSearchOn}
            values={[config?.web_search?.engine ?? DEFAULT_WEB_SEARCH.engine]}
            valueTitle={t(`providers:inworld.webSearch.engines.${config?.web_search?.engine ?? DEFAULT_WEB_SEARCH.engine}`)}
            onChange={(engine: string) => updateWebSearch({ engine })}
          >
            {WEB_SEARCH_ENGINES.map((engine) => (
              <option key={engine} value={engine}>
                {t(`providers:inworld.webSearch.engines.${engine}`)}
              </option>
            ))}
          </theme.Select>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <theme.Input
              id="inworld-web-search-max-results"
              type="number"
              min={1}
              step={1}
              label={t("providers:inworld.webSearch.maxResults")}
              disabled={!webSearchOn}
              value={config?.web_search?.max_results ?? DEFAULT_WEB_SEARCH.max_results}
              onChange={(event: any) =>
                updateWebSearch({ max_results: positiveInteger(event?.target?.value, 1) })
              }
            />
            <theme.Input
              id="inworld-web-search-max-steps"
              type="number"
              min={1}
              step={1}
              label={t("providers:inworld.webSearch.maxSteps")}
              disabled={!webSearchOn}
              value={config?.web_search?.max_steps ?? DEFAULT_WEB_SEARCH.max_steps}
              onChange={(event: any) =>
                updateWebSearch({ max_steps: positiveInteger(event?.target?.value, 1) })
              }
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:inworld.modalities.title")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {MODALITIES.map((modality) => (
            <theme.Switch
              key={modality}
              id={`inworld-modality-${modality}`}
              size="small"
              checked={modalities.includes(modality)}
              label={t(`providers:inworld.modalities.${modality}`)}
              onChange={(enabled: boolean) => toggleModality(modality, enabled)}
            />
          ))}
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:inworld.imageConfig.title")}
        headerActions={
          <theme.Switch
            id="inworld-image-config"
            checked={imageConfigOn}
            onChange={(enabled: boolean) =>
              submitConfig(
                enabled
                  ? { ...config, image_config: { ...DEFAULT_IMAGE_CONFIG } }
                  : omitKey(config, "image_config")
              )
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <theme.Input
              id="inworld-image-aspect-ratio"
              label={t("providers:inworld.imageConfig.aspectRatio")}
              placeholder="1:1"
              disabled={!imageConfigOn}
              value={config?.image_config?.aspect_ratio ?? DEFAULT_IMAGE_CONFIG.aspect_ratio}
              onChange={(event: any) => updateImageConfig({ aspect_ratio: event?.target?.value })}
            />
            <theme.Input
              id="inworld-image-size"
              label={t("providers:inworld.imageConfig.imageSize")}
              placeholder="1K / 1024x1024"
              disabled={!imageConfigOn}
              value={config?.image_config?.image_size ?? DEFAULT_IMAGE_CONFIG.image_size}
              onChange={(event: any) => updateImageConfig({ image_size: event?.target?.value })}
            />
            <theme.Input
              id="inworld-image-partial-images"
              type="number"
              min={1}
              step={1}
              label={t("providers:inworld.imageConfig.partialImages")}
              disabled={!imageConfigOn}
              value={config?.image_config?.partial_images ?? DEFAULT_IMAGE_CONFIG.partial_images}
              onChange={(event: any) =>
                updateImageConfig({ partial_images: positiveInteger(event?.target?.value, 1) })
              }
            />
            <theme.Input
              id="inworld-image-count"
              type="number"
              min={1}
              step={1}
              label={t("providers:inworld.imageConfig.count")}
              disabled={!imageConfigOn}
              value={config?.image_config?.n ?? DEFAULT_IMAGE_CONFIG.n}
              onChange={(event: any) =>
                updateImageConfig({ n: positiveInteger(event?.target?.value, 1) })
              }
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:inworld.reasoning.title")}
        headerActions={
          <theme.Switch
            id="inworld-reasoning-effort"
            checked={reasoningOn}
            onChange={(enabled: boolean) =>
              submitConfig(
                enabled
                  ? { ...config, reasoning_effort: DEFAULT_REASONING_EFFORT }
                  : omitKey(config, "reasoning_effort")
              )
            }
          />
        }
      >
        <theme.Select
          label={t("providers:inworld.reasoning.effort")}
          disabled={!reasoningOn}
          values={[config?.reasoning_effort ?? DEFAULT_REASONING_EFFORT]}
          valueTitle={t(`providers:inworld.reasoning.efforts.${config?.reasoning_effort ?? DEFAULT_REASONING_EFFORT}`)}
          onChange={(reasoningEffort: string) =>
            submitConfig({ ...config, reasoning_effort: reasoningEffort })
          }
        >
          {REASONING_EFFORTS.map((effort) => (
            <option key={effort} value={effort}>
              {t(`providers:inworld.reasoning.efforts.${effort}`)}
            </option>
          ))}
        </theme.Select>
      </theme.Card>
    </div>
  );
};
