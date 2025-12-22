import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";


const DEFAULT_WEB_SEARCH = {
  type: "web_search"
};

const DEFAULT_WEB_SEARCH_PREMIUM = {
  type: "web_search_premium"
};

const DEFAULT_IMAGE_RENERATION = {
  type: "image_generation"
};

const DEFAULT_CODE_EXECUTION = {
  type: "code_interpreter"
};

const DEFAULT_DOCUMENT_LIBRARY = {
  library_ids: "",
  type: "document_library"
};


export const MistralTab = ({
  mistral,
  updateMistral,
}: {
  mistral: any;
  updateMistral: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const fileSearchOn = !!mistral.document_library;
  const codeExecutionOn = !!mistral.code_interpreter;
  const imageGenerationOn = !!mistral.image_generation;
  const webSearchOn = !!mistral.web_search || !!mistral.web_search_premium;
  const webSearchPremiumOn = !!mistral.web_search_premium;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 18
    }}>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={webSearchOn}
            onChange={(val) =>
              updateMistral({
                ...mistral,
                web_search_premium: undefined,
                web_search: !val
                  ? undefined
                  : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <theme.Switch
          id="webSearchPremium"
          label={t("mistral.webSearchPremium")}
          checked={webSearchPremiumOn}
          disabled={!webSearchOn}
          onChange={(val) =>
            updateMistral({
              ...mistral,
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
            id="image_generation"
            checked={imageGenerationOn}
            onChange={(val) =>
              updateMistral({
                ...mistral,
                image_generation: !val
                  ? undefined
                  : { ...DEFAULT_IMAGE_RENERATION },
              })
            }
          />
        }
      ></theme.Card>

      <theme.Card
        size="small"
        title={t("code_execution")}
        headerActions={
          <theme.Switch
            id="codeExecution"
            checked={codeExecutionOn}
            onChange={(val) =>
              updateMistral({
                ...mistral,
                code_interpreter: !val
                  ? undefined
                  : { ...DEFAULT_CODE_EXECUTION },
              })
            }
          />
        }
      ></theme.Card>

      <theme.Card
        size="small"
        title={t("openai.file_search")}
        headerActions={
          <theme.Switch
            id="fileSearch"
            checked={fileSearchOn}
            onChange={(val) =>
              updateMistral({
                ...mistral,
                document_library: !val ? undefined : { ...DEFAULT_DOCUMENT_LIBRARY },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("openai.vector_store_ids")}
            placeholder="xxx, zzz"
            disabled={!fileSearchOn}
            value={(mistral.document_library?.library_ids || []).join(", ")}
            onChange={(e: any) =>
              updateMistral({
                ...mistral,
                document_library: {
                  ...mistral.document_library,
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
