import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_WEB_SEARCH = { type: "web_search" };
const DEFAULT_WEB_SEARCH_PREMIUM = { type: "web_search_premium" };
const DEFAULT_IMAGE_GENERATION = { type: "image_generation" };
const DEFAULT_CODE_EXECUTION = { type: "code_interpreter" };
const DEFAULT_DOCUMENT_LIBRARY = { type: "document_library", library_ids: [] };

export const MistralChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const fileSearchOn = !!config?.document_library;
  const codeExecutionOn = !!config?.code_interpreter;
  const imageGenerationOn = !!config?.image_generation;
  const webSearchOn = !!config?.web_search || !!config?.web_search_premium;
  const webSearchPremiumOn = !!config?.web_search_premium;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                web_search_premium: undefined,
                web_search: !val ? undefined : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <theme.Switch
          id="webSearchPremium"
          label={t("providers:mistral.webSearchPremium")}
          checked={webSearchPremiumOn}
          disabled={!webSearchOn}
          onChange={(val) =>
            updateConfig({
              ...config,
              web_search_premium: !val
                ? undefined
                : { ...DEFAULT_WEB_SEARCH_PREMIUM },
            })
          }
        />
      </theme.Card>

      <theme.Card
        size="small"
        title={t("image_generation")}
        headerActions={
          <theme.Switch
            id="imageGeneration"
            checked={imageGenerationOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                image_generation: !val
                  ? undefined
                  : { ...DEFAULT_IMAGE_GENERATION },
              })
            }
          />
        }
      />

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
                code_interpreter: !val
                  ? undefined
                  : { ...DEFAULT_CODE_EXECUTION },
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={t("providers:openai.file_search")}
        headerActions={
          <theme.Switch
            id="fileSearch"
            checked={fileSearchOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                document_library: !val
                  ? undefined
                  : { ...DEFAULT_DOCUMENT_LIBRARY },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("providers:openai.vector_store_ids")}
            placeholder="xxx, zzz"
            disabled={!fileSearchOn}
            value={(config?.document_library?.library_ids || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                document_library: {
                  ...config.document_library,
                  library_ids: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
