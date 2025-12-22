import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

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
  thinkingLevel: "ThinkingLevelUnspecified"
};

export const GoogleTab = ({
  google,
  updateGoogle,
}: {
  google: any;
  updateGoogle: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();


  const blockingConfidenceOptions = [
    { value: BlockingConfidence.PhishBlockThresholdUnspecified, label: t("google.blockingConfidence.unspecified") },
    { value: BlockingConfidence.BlockLowAndAbove, label: t("google.blockingConfidence.lowAndAbove") },
    { value: BlockingConfidence.BlockMediumAndAbove, label: t("google.blockingConfidence.mediumAndAbove") },
    { value: BlockingConfidence.BlockHighAndAbove, label: t("google.blockingConfidence.highAndAbove") },
    { value: BlockingConfidence.BlockHigherAndAbove, label: t("google.blockingConfidence.higherAndAbove") },
    { value: BlockingConfidence.BlockVeryHighAndAbove, label: t("google.blockingConfidence.veryHighAndAbove") },
    { value: BlockingConfidence.BlockOnlyExtremelyHigh, label: t("google.blockingConfidence.onlyExtremelyHigh") },
  ];
  const searchOn = !!google?.google_search; // when ON it's an empty object
  const thinkingOn = google?.thinkingConfig != null; // null/undefined = OFF
  const codeExecutionOn = !!google.code_execution;
  const urlContextOn = !!google.url_context;
  const googleMapsOn = !!google.googleMaps;

  const timeRangeFilter = google?.google_search?.timeRangeFilter ?? {
    startTime: undefined,
    endTime: undefined,
  };


  const mediaResolution = [
    { value: "MediaResolutionUnspecified", label: t("google.unspecified") },
    { value: "MediaResolutionLow", label: t("low") },
    { value: "MediaResolutionMedium", label: t("medium") },
    { value: "MediaResolutionHigh", label: t("high") },
  ];

  const thinkingLevel = [
    { value: "ThinkingLevelUnspecified", label: t("google.unspecified") },
    { value: "Low", label: t("low") },
    { value: "High", label: t("high") },
  ];


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <>{false && <theme.Switch
            id="googleThinking"
            checked={thinkingOn}
            onChange={() =>
              updateGoogle({
                ...google,
                // OFF -> null ; ON -> default object
                thinkingConfig: thinkingOn
                  ? null
                  : { ...DEFAULT_GOOGLE_THINKING },
              })
            }
          />}</>
        }
      >
        <div>

          <theme.Select
            label={t("reasoningEffort")}
            style={{ maxWidth: "100%" }}
            values={[google.thinkingConfig?.thinkingLevel || ""]}
            disabled={!thinkingOn}
            valueTitle={
              thinkingLevel.find((a) => a.value === google.thinkingConfig?.thinkingLevel)
                ?.label
            }
            options={thinkingLevel}
            onChange={(val: string) =>
              updateGoogle({
                ...google,
                thinkingConfig: {
                  ...(google?.thinkingConfig ?? {
                    ...DEFAULT_GOOGLE_THINKING,
                  }),
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
            label={t("google.includeThoughts")}
            disabled={!thinkingOn}
            checked={!!google?.thinkingConfig?.includeThoughts}
            onChange={() =>
              updateGoogle({
                ...google,
                thinkingConfig: {
                  ...(google?.thinkingConfig ?? {
                    ...DEFAULT_GOOGLE_THINKING,
                  }),
                  includeThoughts: !google?.thinkingConfig?.includeThoughts,
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
          >




          </div>

          {/* RIGHT: budget input */}
          <div style={{ flex: "0 0 140px" }}>


            {false && <theme.Input
              type="number"
              label={t("budget")}
              orientation="vertical"
              max={32768}
              style={{ maxWidth: "100%" }}
              disabled={
                google?.thinkingConfig?.thinkingBudget == -1 || !thinkingOn
              }
              value={google?.thinkingConfig?.thinkingBudget ?? ""}
              onChange={(e: any) => {
                const raw = e.target.value;
                const parsed =
                  raw === ""
                    ? ""
                    : Math.min(32768, Math.max(0, parseInt(raw, 10) || 0));
                updateGoogle({
                  ...google,
                  thinkingConfig: {
                    ...(google?.thinkingConfig ?? {
                      ...DEFAULT_GOOGLE_THINKING,
                    }),
                    thinkingBudget: parsed === "" ? undefined : parsed,
                  },
                });
              }}
            />}
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="googleSearch"
            checked={searchOn}
            onChange={(val) =>
              updateGoogle({
                ...google,
                // OFF -> null ; ON -> default object
                google_search: !val ?
                  undefined
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
              label={t("google.intervalStart")}
              disabled={!searchOn}
              value={timeRangeFilter.startTime}
              onChange={(e: any) =>
                updateGoogle({
                  ...google,
                  google_search: {
                    ...(google.google_search ?? {}),
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
              label={t("google.intervalEnd")}
              value={timeRangeFilter.endTime}
              disabled={!searchOn}
              onChange={(e: any) =>
                updateGoogle({
                  ...google,
                  google_search: {
                    ...(google.google_search ?? {}),
                    timeRangeFilter: {
                      ...(timeRangeFilter ?? {}),
                      endTime: e.target.value ?? undefined,
                    },
                  },
                })
              }
            />
          </div>

          {false && <theme.Input
            label={t("xai.excludedDomains")}
            placeholder="domain1.com, domain2.com"
            disabled={!searchOn}
            value={(google.google_search?.excludeDomains || []).join(", ")}
            onChange={(e: any) =>
              updateGoogle({
                ...google,
                google_search: {
                  ...google.google_search,
                  excludeDomains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />}

          {false && <theme.Select
            label={t("google.blockingConfidence.label")}
            value={google.google_search?.blockingConfidence || ""}
            disabled={!searchOn}
            valueTitle={
              blockingConfidenceOptions.find((a) => a.value === google.google_search?.blockingConfidence)
                ?.label
            }
            options={blockingConfidenceOptions}
            onChange={(val: string) =>
              updateGoogle({
                ...google, google_search: {
                  ...google.google_search,
                  blockingConfidence: val
                }
              })
            }
          >
            {blockingConfidenceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>}

        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("google.googleMaps")}
        headerActions={
          <theme.Switch
            id="googleMaps"
            checked={googleMapsOn}
            onChange={(val) =>
              updateGoogle({
                ...google,
                googleMaps: !val ? undefined : { ...DEFAULT_GOOGLE_MAPS },
              })
            }
          />
        }
      ></theme.Card>

      <theme.Card
        size="small"
        title={t("google.url_context")}
        headerActions={
          <theme.Switch
            id="urlContext"
            checked={urlContextOn}
            onChange={(val) =>
              updateGoogle({
                ...google,
                url_context: !val ? undefined : { ...DEFAULT_URL_CONTEXT },
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
              updateGoogle({
                ...google,
                code_execution: !val
                  ? undefined
                  : { ...DEFAULT_CODE_EXECUTION },
              })
            }
          />
        }
      ></theme.Card>

      <theme.Select
        label={t("google.mediaResolution")}
        style={{ maxWidth: "100%" }}
        values={[google.mediaResolution || ""]}
        disabled={!thinkingOn}
        valueTitle={
          mediaResolution.find((a) => a.value === google.mediaResolution)
            ?.label
        }
        options={mediaResolution}
        onChange={(val: string) =>
          updateGoogle({
            ...google,
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
        checked={google?.enableEnhancedCivicAnswers}
        label={t("google.enableEnhancedCivicAnswers")}
        onChange={(value) => {
          updateGoogle({
            ...google,
            enableEnhancedCivicAnswers: value,
          });
        }}
      />
    </div>
  );
};


/*
   {false && <theme.Switch
              id="googleDynamicThinking"
              label={t("google.dynamicThinking")}
              disabled={!thinkingOn}
              checked={google?.thinkingConfig?.thinkingBudget == -1}
              onChange={(value) =>
                updateGoogle({
                  ...google,
                  thinkingConfig: {
                    ...(google?.thinkingConfig ?? {
                      ...DEFAULT_GOOGLE_THINKING,
                    }),
                    thinkingBudget: !value
                      ? DEFAULT_GOOGLE_THINKING.thinkingBudget
                      : -1,
                  },
                })
              }
            />
            }
            */