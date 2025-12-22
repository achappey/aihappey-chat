import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";


const DEFAULT_WEB_SEARCH = {
  enable_image_understanding: true,
  allowed_domains: [],
  excluded_domains: []
};

const DEFAULT_X_SEARCH = {
  enable_image_understanding: true,
  enable_video_understanding: true,
  allowed_x_handles: [],
  excluded_x_handles: []
};

export const XAITab = ({
  xAI,
  updateXAI,
}: {
  xAI: any;
  updateXAI: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const thinkingOn = !!xAI.reasoning;
  const codeExecutionOn = !!xAI.code_execution;
  const webSearchOn = !!xAI.web_search;
  const xSearchOn = !!xAI.x_search;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={thinkingOn}
            onChange={(val) =>
              updateXAI({
                ...xAI,
                reasoning: val ? {} : undefined,
              })
            }
          />
        }
      >
        <div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={webSearchOn}
            onChange={(val) =>
              updateXAI({
                ...xAI,
                web_search: !val ? undefined : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <div>


          {/* Allowed domains */}
          <theme.Input
            label={t("xai.allowedDomains")}
            placeholder="domain1.com, domain2.com"
            disabled={!webSearchOn}
            value={(xAI.web_search?.allowed_domains || []).join(", ")}
            onChange={(e: any) =>
              updateXAI({
                ...xAI,
                web_search: {
                  ...xAI.web_search,
                  allowed_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
          {/* Blocked domains */}
          <theme.Input
            label={t("xai.excludedDomains")}
            placeholder="domain1.com, domain2.com"
            disabled={!webSearchOn}
            value={(xAI.web_search?.excluded_domains || []).join(", ")}
            onChange={(e: any) =>
              updateXAI({
                ...xAI,
                web_search: {
                  ...xAI.web_search,
                  excluded_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="imageUnderstanding"
            label={t("xai.imageUnderstanding")}
            disabled={!webSearchOn}
            checked={xAI?.web_search?.enable_image_understanding}
            onChange={(val) =>
              updateXAI({
                ...xAI,
                web_search: {
                  ...xAI.web_search,
                  enable_image_understanding: val
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
              updateXAI({
                ...xAI,
                x_search: !val ? undefined : { ...DEFAULT_X_SEARCH },
              })
            }
          />
        }
      >
        <div>

          {/* Allowed domains */}
          <theme.Input
            label={t("xai.allowed_x_handles")}
            placeholder="XUser1, XUser2"
            disabled={!xSearchOn}
            value={(xAI.x_search?.allowed_x_handles || []).join(", ")}
            onChange={(e: any) =>
              updateXAI({
                ...xAI,
                x_search: {
                  ...xAI.x_search,
                  allowed_x_handles: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
          {/* Blocked domains */}
          <theme.Input
            label={t("xai.excluded_x_handles")}
            placeholder="XUser1, XUser2"
            disabled={!xSearchOn}
            value={(xAI.x_search?.excluded_x_handles || []).join(", ")}
            onChange={(e: any) =>
              updateXAI({
                ...xAI,
                x_search: {
                  ...xAI.x_search,
                  excluded_x_handles: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="xSearchImageUnderstanding"
            label={t("xai.imageUnderstanding")}
            disabled={!xSearchOn}
            checked={xAI?.x_search?.enable_image_understanding}
            onChange={(val) =>
              updateXAI({
                ...xAI,
                x_search: {
                  ...xAI.x_search,
                  enable_image_understanding: val
                },
              })
            }
          />

          <theme.Switch
            id="videoUnderstanding"
            label={t("xai.videoUnderstanding")}
            disabled={!xSearchOn}
            checked={xAI?.x_search?.enable_video_understanding}
            onChange={(val) =>
              updateXAI({
                ...xAI,
                x_search: {
                  ...xAI.x_search,
                  enable_video_understanding: val
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
              updateXAI({
                ...xAI,
                code_execution: !val ? undefined : {},
              })
            }
          />
        }
      ></theme.Card>

      <theme.Switch
        id="parallelToolCalls"
        checked={xAI?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) => {
          updateXAI({
            ...xAI,
            parallel_tool_calls: value,
          });
        }}
      />

      <theme.TextArea
        label={t("openai.instructions")}
        placeholder={t("openai.instructionsPlaceholder")}
        rows={5}
        value={xAI?.instructions}
        onChange={(value) => {
          updateXAI({
            ...xAI,
            instructions: value,
          });
        }}></theme.TextArea>
    </div>
  );
};
