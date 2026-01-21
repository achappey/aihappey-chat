import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const PerplexityMediaCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("providers:perplexity.media")}>
      <div>
        <theme.Switch
          id="images"
          label={t("providers:perplexity.enableMediaClassifier")}
          checked={!!config?.media_response?.enable_media_classifier}
          onChange={(val) =>
            updateConfig({
              ...config,
              media_response: {
                ...config?.media_response,
                enable_media_classifier: val,
              },
            })
          }
        />

        <theme.Switch
          id="images"
          label={t("providers:perplexity.returnImages")}
          checked={!!config?.return_images}
          onChange={() =>
            updateConfig({
              ...config,
              return_images: !config?.return_images,
            })
          }
        />

        <theme.Switch
          id="videos"
          label={t("providers:perplexity.returnVideos")}
          checked={!!config?.media_response?.overrides?.return_videos}
          onChange={(val) =>
            updateConfig({
              ...config,
              media_response: {
                ...config?.media_response,
                overrides: {
                  ...config?.media_response?.overrides,
                  return_videos: val,
                },
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};

