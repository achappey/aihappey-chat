// GoogleChatConfigForm.tsx

import { useTheme } from "../../../theme/ThemeContext";

const DEFAULT_CODE_EXECUTION = {};
const DEFAULT_URL_CONTEXT = {};
const DEFAULT_GOOGLE_MAPS = {};

enum BlockingConfidence {
  PhishBlockThresholdUnspecified = "PhishBlockThresholdUnspecified",
  BlockLowAndAbove = "BlockLowAndAbove",
  BlockMediumAndAbove = "BlockMediumAndAbove",
  BlockHighAndAbove = "BlockHighAndAbove",
  BlockHigherAndAbove = "BlockHigherAndAbove",
  BlockVeryHighAndAbove = "BlockVeryHighAndAbove",
  BlockOnlyExtremelyHigh = "BlockOnlyExtremelyHigh",
}

// --- Defaults ---
const DEFAULT_GOOGLE_THINKING = {
  thinkingBudget: -1,
  includeThoughts: true,
  thinkingLevel: "ThinkingLevelUnspecified",
};

export type GoogleChatConfigFormTranslations = {
  reasoning?: string;
  reasoningEffort?: string;
  budget?: string;
  webSearch?: string;
  code_execution?: string;
  low?: string;
  medium?: string;
  high?: string;

  unspecified?: string;

  includeThoughts?: string;

  intervalStart?: string;
  intervalEnd?: string;

  googleMaps?: string;
  url_context?: string;

  mediaResolution?: string;
  enableEnhancedCivicAnswers?: string;

  // blockingConfidence (used in options list, even though select is currently false-gated)
  blockingConfidence_unspecified?: string;
  blockingConfidence_lowAndAbove?: string;
  blockingConfidence_mediumAndAbove?: string;
  blockingConfidence_highAndAbove?: string;
  blockingConfidence_higherAndAbove?: string;
  blockingConfidence_veryHighAndAbove?: string;
  blockingConfidence_onlyExtremelyHigh?: string;
  blockingConfidence_label?: string;
};

export const GoogleChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: {
  config: any;
  updateConfig: (val: any) => void;
  translations?: GoogleChatConfigFormTranslations;
}) => {
  const theme = useTheme();

  const blockingConfidenceOptions = [
    {
      value: BlockingConfidence.PhishBlockThresholdUnspecified,
      label: translations?.blockingConfidence_unspecified ?? "unspecified",
    },
    {
      value: BlockingConfidence.BlockLowAndAbove,
      label: translations?.blockingConfidence_lowAndAbove ?? "lowAndAbove",
    },
    {
      value: BlockingConfidence.BlockMediumAndAbove,
      label: translations?.blockingConfidence_mediumAndAbove ?? "mediumAndAbove",
    },
    {
      value: BlockingConfidence.BlockHighAndAbove,
      label: translations?.blockingConfidence_highAndAbove ?? "highAndAbove",
    },
    {
      value: BlockingConfidence.BlockHigherAndAbove,
      label: translations?.blockingConfidence_higherAndAbove ?? "higherAndAbove",
    },
    {
      value: BlockingConfidence.BlockVeryHighAndAbove,
      label: translations?.blockingConfidence_veryHighAndAbove ?? "veryHighAndAbove",
    },
    {
      value: BlockingConfidence.BlockOnlyExtremelyHigh,
      label: translations?.blockingConfidence_onlyExtremelyHigh ?? "onlyExtremelyHigh",
    },
  ];

  const searchOn = !!config?.google_search; // when ON it's an empty object
  const thinkingOn = config?.thinkingConfig != null; // null/undefined = OFF
  const codeExecutionOn = !!config?.code_execution;
  const urlContextOn = !!config?.url_context;
  const googleMapsOn = !!config?.googleMaps;

  const timeRangeFilter = config?.google_search?.timeRangeFilter ?? {
    startTime: undefined,
    endTime: undefined,
  };

  const mediaResolution = [
    {
      value: "MediaResolutionUnspecified",
      label: translations?.unspecified ?? "unspecified",
    },
    { value: "MediaResolutionLow", label: translations?.low ?? "low" },
    { value: "MediaResolutionMedium", label: translations?.medium ?? "medium" },
    { value: "MediaResolutionHigh", label: translations?.high ?? "high" },
  ];

  const thinkingLevel = [
    {
      value: "ThinkingLevelUnspecified",
      label: translations?.unspecified ?? "unspecified",
    },
    { value: "Low", label: translations?.low ?? "low" },
    { value: "High", label: translations?.high ?? "high" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={translations?.reasoning ?? "reasoning"}
        headerActions={
          <>
            {false && (
              <theme.Switch
                id="googleThinking"
                checked={thinkingOn}
                onChange={() =>
                  updateConfig({
                    ...config,
                    thinkingConfig: thinkingOn ? null : { ...DEFAULT_GOOGLE_THINKING },
                  })
                }
              />
            )}
          </>
        }
      >
        <div>
          <theme.Select
            label={translations?.reasoningEffort ?? "reasoningEffort"}
            style={{ maxWidth: "100%" }}
            values={[config?.thinkingConfig?.thinkingLevel || ""]}
            disabled={!thinkingOn}
            valueTitle={
              thinkingLevel.find(
                (a) => a.value === config?.thinkingConfig?.thinkingLevel
              )?.label
            }
            options={thinkingLevel}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                thinkingConfig: {
                  ...(config?.thinkingConfig ?? { ...DEFAULT_GOOGLE_THINKING }),
                  thinkingLevel: val,
                },
              })
            }
          >
            {thinkingLevel.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="googleIncludeThoughts"
            label={translations?.includeThoughts ?? "includeThoughts"}
            disabled={!thinkingOn}
            checked={!!config?.thinkingConfig?.includeThoughts}
            onChange={() =>
              updateConfig({
                ...config,
                thinkingConfig: {
                  ...(config?.thinkingConfig ?? { ...DEFAULT_GOOGLE_THINKING }),
                  includeThoughts: !config?.thinkingConfig?.includeThoughts,
                },
              })
            }
          />
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          ></div>

          <div style={{ flex: "0 0 140px" }}>
            {false && (
              <theme.Input
                type="number"
                label={translations?.budget ?? "budget"}
                orientation="vertical"
                max={32768}
                style={{ maxWidth: "100%" }}
                disabled={config?.thinkingConfig?.thinkingBudget == -1 || !thinkingOn}
                value={config?.thinkingConfig?.thinkingBudget ?? ""}
                onChange={(e: any) => {
                  const raw = e.target.value;
                  const parsed =
                    raw === ""
                      ? ""
                      : Math.min(32768, Math.max(0, parseInt(raw, 10) || 0));
                  updateConfig({
                    ...config,
                    thinkingConfig: {
                      ...(config?.thinkingConfig ?? { ...DEFAULT_GOOGLE_THINKING }),
                      thinkingBudget: parsed === "" ? undefined : parsed,
                    },
                  });
                }}
              />
            )}
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.webSearch ?? "webSearch"}
        headerActions={
          <theme.Switch
            id="googleSearch"
            checked={searchOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                google_search: !val
                  ? undefined
                  : {
                      timeRangeFilter: {
                        startTime: undefined,
                        endTime: undefined,
                      },
                    },
              })
            }
          />
        }
      >
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <theme.Input
              type="datetime-local"
              label={translations?.intervalStart ?? "intervalStart"}
              disabled={!searchOn}
              value={timeRangeFilter.startTime}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  google_search: {
                    ...(config.google_search ?? {}),
                    timeRangeFilter: {
                      ...(timeRangeFilter ?? {}),
                      startTime: e.target.value ?? undefined,
                    },
                  },
                })
              }
            />
            <theme.Input
              type="datetime-local"
              label={translations?.intervalEnd ?? "intervalEnd"}
              value={timeRangeFilter.endTime}
              disabled={!searchOn}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  google_search: {
                    ...(config.google_search ?? {}),
                    timeRangeFilter: {
                      ...(timeRangeFilter ?? {}),
                      endTime: e.target.value ?? undefined,
                    },
                  },
                })
              }
            />
          </div>

          {false && (
            <theme.Select
              label={translations?.blockingConfidence_label ?? "blockingConfidence"}
              value={config.google_search?.blockingConfidence || ""}
              disabled={!searchOn}
              valueTitle={
                blockingConfidenceOptions.find(
                  (a) => a.value === config.google_search?.blockingConfidence
                )?.label
              }
              options={blockingConfidenceOptions}
              onChange={(val: string) =>
                updateConfig({
                  ...config,
                  google_search: {
                    ...config.google_search,
                    blockingConfidence: val,
                  },
                })
              }
            >
              {blockingConfidenceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>
          )}
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.googleMaps ?? "googleMaps"}
        headerActions={
          <theme.Switch
            id="googleMaps"
            checked={googleMapsOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                googleMaps: !val ? undefined : { ...DEFAULT_GOOGLE_MAPS },
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={translations?.url_context ?? "url_context"}
        headerActions={
          <theme.Switch
            id="urlContext"
            checked={urlContextOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                url_context: !val ? undefined : { ...DEFAULT_URL_CONTEXT },
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={translations?.code_execution ?? "code_execution"}
        headerActions={
          <theme.Switch
            id="codeExecution"
            checked={codeExecutionOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                code_execution: !val ? undefined : { ...DEFAULT_CODE_EXECUTION },
              })
            }
          />
        }
      />

      <theme.Select
        label={translations?.mediaResolution ?? "mediaResolution"}
        style={{ maxWidth: "100%" }}
        values={[config.mediaResolution || ""]}
        disabled={!thinkingOn}
        valueTitle={
          mediaResolution.find((a) => a.value === config.mediaResolution)?.label
        }
        options={mediaResolution}
        onChange={(val: string) =>
          updateConfig({
            ...config,
            mediaResolution: val,
          })
        }
      >
        {mediaResolution.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </theme.Select>

      <theme.Switch
        id="enableEnhancedCivicAnswers"
        checked={config?.enableEnhancedCivicAnswers}
        label={
          translations?.enableEnhancedCivicAnswers ?? "enableEnhancedCivicAnswers"
        }
        onChange={(value) =>
          updateConfig({
            ...config,
            enableEnhancedCivicAnswers: value,
          })
        }
      />
    </div>
  );
};
