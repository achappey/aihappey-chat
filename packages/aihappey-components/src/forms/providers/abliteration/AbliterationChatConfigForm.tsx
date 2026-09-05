import { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORTS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "ultracode",
] as const;

const FLAGGED_CATEGORIES = [
  "harassment",
  "harassment/threatening",
  "hate",
  "hate/threatening",
  "illicit",
  "illicit/violent",
  "self-harm",
  "self-harm/intent",
  "self-harm/instructions",
  "sexual",
  "sexual/minors",
  "violence",
  "violence/graphic",
] as const;

type ReasoningEffort = (typeof REASONING_EFFORTS)[number];
type FlaggedCategory = (typeof FLAGGED_CATEGORIES)[number];

const DEFAULT_REASONING_EFFORT: ReasoningEffort = "medium";

const parseOptionalInteger = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(999990, Math.max(1, Math.trunc(parsed)));
};

const withoutProperty = (value: Record<string, any> | undefined, property: string) => {
  const next = { ...(value ?? {}) };
  delete next[property];
  return next;
};

export const AbliterationChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (value: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const reasoningOn = config?.reasoning !== undefined;
  const categoriesOn = config?.flagged_categories !== undefined;
  const reasoning = config?.reasoning ?? {};
  const selectedCategories: FlaggedCategory[] = Array.isArray(config?.flagged_categories)
    ? config.flagged_categories.filter((value: unknown): value is FlaggedCategory =>
        FLAGGED_CATEGORIES.includes(value as FlaggedCategory),
      )
    : [];

  const effortOptions = useMemo(
    () => REASONING_EFFORTS.map((value) => ({
      value,
      label: t(`providers:abliteration.reasoning.efforts.${value}`),
    })),
    [t],
  );
  const categoryOptions = useMemo(
    () => FLAGGED_CATEGORIES.map((value) => ({
      value,
      label: t(`providers:abliteration.categories.${value}`),
    })),
    [t],
  );

  const updateReasoning = (patch: Record<string, any>) =>
    updateConfig({
      ...(config ?? {}),
      reasoning: {
        ...reasoning,
        ...patch,
      },
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:abliteration.reasoning.title")}
        headerActions={
          <theme.Switch
            id="abliterationReasoning"
            checked={reasoningOn}
            onChange={(enabled: boolean) =>
              updateConfig(enabled
                ? {
                    ...(config ?? {}),
                    reasoning: { enabled: true, effort: DEFAULT_REASONING_EFFORT },
                  }
                : withoutProperty(config, "reasoning"))
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:abliteration.reasoning.effort")}
            disabled={!reasoningOn}
            values={[reasoning.effort ?? DEFAULT_REASONING_EFFORT]}
            valueTitle={t(`providers:abliteration.reasoning.efforts.${reasoning.effort ?? DEFAULT_REASONING_EFFORT}`)}
            options={effortOptions}
            onChange={(effort: string) => updateReasoning({ effort: effort as ReasoningEffort })}
          >
            {effortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </theme.Select>

          <theme.Input
            label={t("providers:abliteration.reasoning.maxTokens")}
            type="number"
            min={1}
            max={999990}
            step={1}
            disabled={!reasoningOn}
            value={reasoning.max_tokens ?? ""}
            onChange={(event: any) => updateReasoning({
              max_tokens: parseOptionalInteger(event.target.value),
            })}
          />

          <theme.Switch
            id="abliterationReasoningEnabled"
            label={t("providers:abliteration.reasoning.enabled")}
            disabled={!reasoningOn}
            checked={reasoning.enabled === true}
            onChange={(enabled: boolean) => updateReasoning({ enabled: enabled || undefined })}
          />
          <theme.Switch
            id="abliterationReasoningExclude"
            label={t("providers:abliteration.reasoning.exclude")}
            disabled={!reasoningOn}
            checked={reasoning.exclude === true}
            onChange={(exclude: boolean) => updateReasoning({ exclude: exclude || undefined })}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:abliteration.other.title")}
        headerActions={
          <theme.Switch
            id="abliterationFlaggedCategories"
            checked={categoriesOn}
            onChange={(enabled: boolean) =>
              updateConfig(enabled
                ? { ...(config ?? {}), flagged_categories: [...FLAGGED_CATEGORIES] }
                : withoutProperty(config, "flagged_categories"))
            }
          />
        }
      >
        <theme.Select
          label={t("providers:abliteration.other.flaggedCategories")}
          disabled={!categoriesOn}
          multiselect
          values={selectedCategories}
          valueTitle={selectedCategories.length
            ? selectedCategories
                .map((value) => t(`providers:abliteration.categories.${value}`))
                .join(", ")
            : t("providers:abliteration.other.noneSelected")}
          options={categoryOptions}
          onChange={(category: string) => {
            const value = category as FlaggedCategory;
            const nextCategories = selectedCategories.includes(value)
              ? selectedCategories.filter((item) => item !== value)
              : [...selectedCategories, value];
            updateConfig({ ...(config ?? {}), flagged_categories: nextCategories });
          }}
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </theme.Select>
      </theme.Card>
    </div>
  );
};
