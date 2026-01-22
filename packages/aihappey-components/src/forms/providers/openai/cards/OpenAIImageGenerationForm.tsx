import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_IMAGE_GENERATION = {
  model: "gpt-image-1.5",
  size: "auto",
  quality: "auto",
  input_fidelity: "low",
  background: "auto",
  partial_images: 3,
};

export const OpenAIImageGenerationForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const imageGenerationOn = !!config?.image_generation;

  const modelOptions = [
    { value: "chatgpt-image-latest", label: "chatgpt-image-latest" },
    { value: "gpt-image-1.5", label: "gpt-image-1.5" },
    { value: "gpt-image-1", label: "gpt-image-1" },
    { value: "gpt-image-1-mini", label: "gpt-image-1-mini" },
  ];

  const qualityOptions = [
    { value: "auto", label: t("auto") },
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
  ];

  const backgroundOptions = [
    { value: "auto", label: t("auto") },
    { value: "transparent", label: t("transparent") },
    { value: "opaque", label: t("opaque") },
  ];

  // keep exact underlying values, but map labels to translation keys
  const sizeOptions = [
    { value: "auto", label: t("auto") },
    { value: "1024x1024", label: t("1024x1024") },
    { value: "1024x1536", label: t("1024x1536") },
    { value: "1536x1024", label: t("1536x1024") },
  ];

  const fidelityOptions = [
    { value: "low", label: t("low") },
    { value: "high", label: t("high") },
  ];

  return (
    <theme.Card
      size="small"
      title={t("image_generation")}
      headerActions={
        <theme.Switch
          id="image_generation"
          checked={imageGenerationOn}
          onChange={() => {
            updateConfig({
              ...config,
              image_generation: imageGenerationOn
                ? undefined
                : { ...DEFAULT_IMAGE_GENERATION },
            });
          }}
        />
      }
    >
      <div>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <theme.Select
            label={t("model")}
            style={{ flex: "1 1 0" }}
            values={[config?.image_generation?.model ?? "gpt-image-1.5"]}
            disabled={!imageGenerationOn}
            valueTitle={config?.image_generation?.model ?? "gpt-image-1.5"}
            options={modelOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                image_generation: {
                  ...(config.image_generation ?? { ...DEFAULT_IMAGE_GENERATION }),
                  model: val,
                },
              })
            }
          >
            {modelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Slider
            label={`${t("partial_images")} (${config?.image_generation?.partial_images ?? 0})`}
            disabled={!imageGenerationOn}
            min={0}
            max={3}
            step={1}
            style={{ flex: "1 1 0" }}
            value={config?.image_generation?.partial_images ?? 0}
            onChange={(i: number) =>
              updateConfig({
                ...config,
                image_generation: {
                  ...(config.image_generation ?? { ...DEFAULT_IMAGE_GENERATION }),
                  partial_images: i,
                },
              })
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "row" }}>
          <theme.Select
            label={t("input_fidelity")}
            style={{ flex: "1 1 0" }}
            values={[config?.image_generation?.input_fidelity || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              fidelityOptions.find(
                (a) => a.value === config?.image_generation?.input_fidelity
              )?.label
            }
            options={fidelityOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                image_generation: {
                  ...(config.image_generation ?? { ...DEFAULT_IMAGE_GENERATION }),
                  input_fidelity: val,
                },
              })
            }
          >
            {fidelityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("quality")}
            style={{ flex: "1 1 0" }}
            values={[config?.image_generation?.quality || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              qualityOptions.find(
                (a) => a.value === config?.image_generation?.quality
              )?.label
            }
            options={qualityOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                image_generation: {
                  ...(config.image_generation ?? { ...DEFAULT_IMAGE_GENERATION }),
                  quality: val,
                },
              })
            }
          >
            {qualityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>

        <div style={{ display: "flex", flexDirection: "row" }}>
          <theme.Select
            label={t("background")}
            style={{ flex: "1 1 0" }}
            values={[config?.image_generation?.background || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              backgroundOptions.find(
                (a) => a.value === config?.image_generation?.background
              )?.label
            }
            options={backgroundOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                image_generation: {
                  ...(config.image_generation ?? { ...DEFAULT_IMAGE_GENERATION }),
                  background: val,
                },
              })
            }
          >
            {backgroundOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("size")}
            style={{ flex: "1 1 0" }}
            values={[config?.image_generation?.size || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              sizeOptions.find((a) => a.value === config?.image_generation?.size)
                ?.label
            }
            options={sizeOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                image_generation: {
                  ...(config.image_generation ?? { ...DEFAULT_IMAGE_GENERATION }),
                  size: val,
                },
              })
            }
          >
            {sizeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </div>
    </theme.Card>
  );
};

