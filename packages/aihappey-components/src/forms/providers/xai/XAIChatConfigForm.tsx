import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_WEB_SEARCH = {
  enable_image_understanding: true,
  allowed_domains: [],
  excluded_domains: [],
};

const DEFAULT_X_SEARCH = {
  enable_image_understanding: true,
  enable_video_understanding: true,
  allowed_x_handles: [],
  excluded_x_handles: [],
};

export const XAIChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const reasoningOn = !!config?.reasoning;
  const webSearchOn = !!config?.web_search;
  const xSearchOn = !!config?.x_search;
  const codeExecutionOn = !!config?.code_execution;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={reasoningOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                reasoning: val ? {} : undefined,
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={webSearchOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                web_search: !val ? undefined : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("providers:xai.allowedDomains")}
            disabled={!webSearchOn}
            value={(config?.web_search?.allowed_domains || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  allowed_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Input
            label={t("providers:xai.excludedDomains")}
            disabled={!webSearchOn}
            value={(config?.web_search?.excluded_domains || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  excluded_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="webImageUnderstanding"
            label={t("providers:xai.imageUnderstanding")}
            disabled={!webSearchOn}
            checked={config?.web_search?.enable_image_understanding}
            onChange={(val) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  enable_image_understanding: val,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("xSearch")}
        headerActions={
          <theme.Switch
            id="xSearch"
            checked={xSearchOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                x_search: !val ? undefined : { ...DEFAULT_X_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("providers:xai.allowed_x_handles")}
            disabled={!xSearchOn}
            value={(config?.x_search?.allowed_x_handles || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                x_search: {
                  ...config.x_search,
                  allowed_x_handles: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Input
            label={t("providers:xai.excluded_x_handles")}
            disabled={!xSearchOn}
            value={(config?.x_search?.excluded_x_handles || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                x_search: {
                  ...config.x_search,
                  excluded_x_handles: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="xImageUnderstanding"
            label={t("providers:xai.imageUnderstanding")}
            disabled={!xSearchOn}
            checked={config?.x_search?.enable_image_understanding}
            onChange={(val) =>
              updateConfig({
                ...config,
                x_search: {
                  ...config.x_search,
                  enable_image_understanding: val,
                },
              })
            }
          />

          <theme.Switch
            id="xVideoUnderstanding"
            label={t("providers:xai.videoUnderstanding")}
            disabled={!xSearchOn}
            checked={config?.x_search?.enable_video_understanding}
            onChange={(val) =>
              updateConfig({
                ...config,
                x_search: {
                  ...config.x_search,
                  enable_video_understanding: val,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("code_execution")}
        headerActions={
          <theme.Switch
            id="codeExecution"
            checked={codeExecutionOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                code_execution: !val ? undefined : {},
              })
            }
          />
        }
      />

      <theme.Switch
        id="parallelToolCalls"
        checked={!!config?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) =>
          updateConfig({
            ...config,
            parallel_tool_calls: value,
          })
        }
      />

      <theme.TextArea
        label={t("providers:openai.instructions")}
        placeholder={t("providers:openai.instructionsPlaceholder")}
        rows={5}
        value={config?.instructions}
        onChange={(value) =>
          updateConfig({
            ...config,
            instructions: value,
          })
        }
      />
    </div>
  );
};
