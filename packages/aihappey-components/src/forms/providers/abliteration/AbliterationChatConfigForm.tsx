import { useEffect, useMemo, useState } from "react";
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
const DEFAULT_POLICY_ID = "default-policy";

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

const PolicyListEditor = ({
  id,
  label,
  disabled,
  items,
  onChange,
}: {
  id: string;
  label: string;
  disabled: boolean;
  items: string[];
  onChange: (items: string[]) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const value = draft.trim();

  const addItem = () => {
    if (disabled || !value) return;
    if (!items.includes(value)) onChange([...items, value]);
    setDraft("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div>
        <theme.Input
          id={id}
          label={label}
          disabled={disabled}
          value={draft}
          onChange={(event: any) => setDraft(event.target.value)}
          onKeyDown={(event: any) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
        />
        <theme.Button
          icon="add"
          size="small"
          title={t("add")}
          variant="informative"
          disabled={disabled || !value}
          onClick={addItem}
        />
      </div>
      {items.length > 0 && (
        <theme.Tags
          size="small"
          items={items.map((item) => ({ key: item, label: item }))}
          onRemove={disabled ? undefined : (item: string) => onChange(items.filter((value) => value !== item))}
        />
      )}
    </div>
  );
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
  const policyOn = config?.policy !== undefined;
  const reasoning = config?.reasoning ?? {};
  const policy = config?.policy ?? {};
  const rules = policy.rules ?? {};
  const [policyIdDraft, setPolicyIdDraft] = useState(policy.policy_id ?? DEFAULT_POLICY_ID);
  useEffect(() => {
    setPolicyIdDraft(policy.policy_id ?? DEFAULT_POLICY_ID);
  }, [policyOn, policy.policy_id]);
  const selectedCategories: FlaggedCategory[] = Array.isArray(rules.flagged_categories)
    ? rules.flagged_categories.filter((value: unknown): value is FlaggedCategory =>
        FLAGGED_CATEGORIES.includes(value as FlaggedCategory),
      )
    : [];
  const allowlist: string[] = Array.isArray(rules.allowlist) ? rules.allowlist : [];
  const denylist: string[] = Array.isArray(rules.denylist) ? rules.denylist : [];

  const cleanConfig = withoutProperty(config, "flagged_categories");

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
      ...cleanConfig,
      reasoning: {
        ...reasoning,
        ...patch,
      },
    });

  const updatePolicy = (patch: Record<string, any>) =>
    updateConfig({ ...cleanConfig, policy: { ...policy, ...patch } });

  const updateRule = (key: string, value: unknown) => {
    const nextRules = value === undefined
      ? withoutProperty(rules, key)
      : { ...rules, [key]: value };
    updatePolicy({ rules: nextRules });
  };

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
                    ...cleanConfig,
                    reasoning: { enabled: true, effort: DEFAULT_REASONING_EFFORT },
                  }
                : withoutProperty(cleanConfig, "reasoning"))
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
        title={t("providers:abliteration.policy.title")}
        headerActions={
          <theme.Switch
            id="abliterationPolicy"
            checked={policyOn}
            onChange={(enabled: boolean) =>
              updateConfig(enabled
                ? { ...cleanConfig, policy: { policy_id: DEFAULT_POLICY_ID, rules: {} } }
                : withoutProperty(cleanConfig, "policy"))
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="abliterationPolicyId"
            label={t("providers:abliteration.policy.id")}
            required
            disabled={!policyOn}
            value={policyIdDraft}
            onChange={(event: any) => {
              const draft = String(event.target.value);
              setPolicyIdDraft(draft);
              if (draft.trim()) updatePolicy({ policy_id: draft.trim() });
            }}
            onBlur={() => setPolicyIdDraft(policy.policy_id ?? DEFAULT_POLICY_ID)}
          />
          <PolicyListEditor
            id="abliterationPolicyAllowlist"
            label={t("providers:abliteration.policy.allowlist")}
            disabled={!policyOn}
            items={allowlist}
            onChange={(items) => updateRule("allowlist", items.length ? items : undefined)}
          />
          <PolicyListEditor
            id="abliterationPolicyDenylist"
            label={t("providers:abliteration.policy.denylist")}
            disabled={!policyOn}
            items={denylist}
            onChange={(items) => updateRule("denylist", items.length ? items : undefined)}
          />
          <theme.Select
            label={t("providers:abliteration.policy.flaggedCategories")}
            disabled={!policyOn}
            multiselect
            values={selectedCategories}
            valueTitle={selectedCategories.length
              ? selectedCategories
                  .map((value) => t(`providers:abliteration.categories.${value}`))
                  .join(", ")
              : t("providers:abliteration.policy.noneSelected")}
            options={categoryOptions}
            onChange={(category: string) => {
              const value = category as FlaggedCategory;
              const nextCategories = selectedCategories.includes(value)
                ? selectedCategories.filter((item) => item !== value)
                : [...selectedCategories, value];
              updateRule("flagged_categories", nextCategories.length ? nextCategories : undefined);
            }}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </theme.Select>
          <theme.Switch
            id="abliterationPolicyRedactPii"
            label={t("providers:abliteration.policy.redactPii")}
            disabled={!policyOn}
            checked={rules.redact_pii === true}
            onChange={(enabled: boolean) => updateRule("redact_pii", enabled || undefined)}
          />
        </div>
      </theme.Card>
    </div>
  );
};
