import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

export type TimestampGranularity = "segment" | "word";

export type TimestampGranularitiesFormProps = {
  /**
   * Prefix used to build stable element ids:
   * - `${idPrefix}-granularities`
   * - `${idPrefix}-segment`
   * - `${idPrefix}-word`
   */
  idPrefix: string;

  /** Provider config field: `timestamp_granularities`. */
  value?: TimestampGranularity[];
  onChange: (next?: TimestampGranularity[]) => void;

  /** Optional overrides for cases where enablement/selection is controlled outside. */
  enabled?: boolean;
  selected?: TimestampGranularity[];

  /** Optional callbacks to let parent own enable/toggle logic. */
  onToggleEnabled?: (enabled: boolean) => void;
  onToggleGranularity?: (g: TimestampGranularity, enabled: boolean) => void;

  /** Optional UI constraints. */
  disableEnableToggle?: boolean;
  disableSegmentToggle?: boolean;
  disableWordToggle?: boolean;

  /** Optional: limit which granularities are supported by the provider/UI. Defaults to both. */
  supportedGranularities?: TimestampGranularity[];
};

const normalizeGranularities = (val: unknown): TimestampGranularity[] => {
  const raw = Array.isArray(val) ? val : [];
  const set = new Set<TimestampGranularity>();

  for (const v of raw) {
    if (v === "segment" || v === "word") set.add(v);
  }

  // keep a stable order in UI + persisted config
  const ordered: TimestampGranularity[] = [];
  if (set.has("segment")) ordered.push("segment");
  if (set.has("word")) ordered.push("word");
  return ordered;
};

export const TimestampGranularitiesForm: React.FC<TimestampGranularitiesFormProps> = ({
  idPrefix,
  value,
  onChange,
  enabled,
  selected,
  onToggleEnabled,
  onToggleGranularity,
  disableEnableToggle,
  disableSegmentToggle,
  disableWordToggle,
  supportedGranularities,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const supported = (() => {
    const normalized = normalizeGranularities(supportedGranularities);
    return normalized.length ? normalized : (["segment", "word"] as TimestampGranularity[]);
  })();

  const derivedEnabled = enabled ?? value != null;
  const normalized = normalizeGranularities(value);

  const effectiveSelected: TimestampGranularity[] = selected
    ? normalizeGranularities(selected)
    : derivedEnabled
      ? normalized.length
        ? normalized
        : ["segment"]
      : [];

  const effectiveSelectedSupported = normalizeGranularities(
    effectiveSelected.filter((g) => supported.includes(g))
  );

  const handleToggleEnabled = (nextEnabled: boolean) => {
    if (onToggleEnabled) {
      onToggleEnabled(nextEnabled);
      return;
    }

    if (!nextEnabled) {
      onChange(undefined);
      return;
    }

    const next = normalized.length ? normalized : (["segment"] as TimestampGranularity[]);
    onChange(normalizeGranularities(next.filter((g) => supported.includes(g))));
  };

  const handleToggleGranularity = (g: TimestampGranularity, nextEnabled: boolean) => {
    if (!supported.includes(g)) return;
    if (onToggleGranularity) {
      onToggleGranularity(g, nextEnabled);
      return;
    }

    const current = normalized;
    const next = nextEnabled
      ? normalizeGranularities([...current, g])
      : normalizeGranularities(current.filter((x) => x !== g));

    // enforce at least one selection when custom is enabled
    const filtered = normalizeGranularities(next.filter((x) => supported.includes(x)));
    // enforce at least one selection when custom is enabled
    const nonEmpty = filtered.length
      ? filtered
      : supported.includes("segment")
        ? (["segment"] as TimestampGranularity[])
        : ([supported[0]] as TimestampGranularity[]);
    onChange(nonEmpty);
  };

  const segmentDisabled = !derivedEnabled || disableSegmentToggle === true;
  const wordDisabled = !derivedEnabled || disableWordToggle === true;

  return (
    <theme.Card
      title={t("providers:openai.timestampGranularities")}
      headerActions={
        <theme.Switch
          id={`${idPrefix}-granularities`}
          disabled={disableEnableToggle === true}
          checked={derivedEnabled}
          onChange={handleToggleEnabled}
        />
      }
    >
      <div>
        {supported.includes("segment") && (
          <theme.Switch
            id={`${idPrefix}-segment`}
            disabled={segmentDisabled}
            checked={effectiveSelectedSupported.includes("segment")}
            label={t("providers:openai.timestampGranularitiesSegment")}
            onChange={(isEnabled) => handleToggleGranularity("segment", isEnabled)}
          />
        )}

        {supported.includes("word") && (
          <theme.Switch
            id={`${idPrefix}-word`}
            disabled={wordDisabled}
            checked={effectiveSelectedSupported.includes("word")}
            label={t("providers:openai.timestampGranularitiesWord")}
            onChange={(isEnabled) => handleToggleGranularity("word", isEnabled)}
          />
        )}
      </div>
    </theme.Card>
  );
};


