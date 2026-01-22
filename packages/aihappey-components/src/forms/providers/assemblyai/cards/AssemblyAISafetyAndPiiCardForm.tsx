import React, { useMemo, useState } from "react";
import type { TagItem } from "aihappey-types";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";
import { ASSEMBLYAI_REDACT_PII_POLICIES } from "../constants";
import { normalizeList, normalizeListItem, parseOptionalInt } from "../fields/shared";

const toTagItems = (items: string[]): TagItem[] => items.map((x) => ({ key: x, label: x }));

export const AssemblyAISafetyAndPiiCardForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const redactPolicies = useMemo(() => normalizeList(config?.redact_pii_policies), [config?.redact_pii_policies]);
  const [draftPolicy, setDraftPolicy] = useState<string>("");
  const policyItems = toTagItems(redactPolicies);

  const addPolicy = () => {
    const raw = normalizeListItem(draftPolicy);
    if (!raw) return;
    if (!ASSEMBLYAI_REDACT_PII_POLICIES.includes(raw as any)) return;
    updateConfig({
      ...config,
      redact_pii_policies: normalizeList([...redactPolicies, raw]),
    });
    setDraftPolicy("");
  };

  const removePolicy = (policy: string) => {
    const key = normalizeListItem(policy).toLowerCase();
    const next = redactPolicies.filter((x) => normalizeListItem(x).toLowerCase() !== key);
    updateConfig({
      ...config,
      redact_pii_policies: next.length ? next : undefined,
    });
  };

  const piiAudioOn = config?.redact_pii_audio ?? false;
  const setPiiAudio = (enabled: boolean) => {
    if (enabled) {
      updateConfig({
        ...config,
        redact_pii_audio: true,
      });
      return;
    }
    updateConfig({
      ...config,
      redact_pii_audio: false,
      redact_pii_audio_quality: undefined,
    });
  };

  const subOptions = [
    { value: "", label: t("providerDefault") },
    { value: "entity_name", label: "entity_name" },
    { value: "hash", label: "hash" },
  ];
  const audioQualityOptions = [
    { value: "", label: t("providerDefault") },
    { value: "mp3", label: "mp3" },
    { value: "wav", label: "wav" },
  ];

  return (
    <theme.Card size="small" title={t("providers:assemblyai.safetyAndPii")} description={t("providers:assemblyai.safetyAndPiiHint")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Switch
          id="assemblyai-filter-profanity"
          label={t("providers:assemblyai.filterProfanity")}
          checked={config?.filter_profanity ?? false}
          onChange={(enabled) => updateConfig({ ...config, filter_profanity: !!enabled })}
        />

        <theme.Switch
          id="assemblyai-content-safety"
          label={t("providers:assemblyai.contentSafety")}
          checked={config?.content_safety ?? false}
          onChange={(enabled) => updateConfig({ ...config, content_safety: !!enabled })}
        />

        <theme.Input
          id="assemblyai-content-safety-confidence"
          type="number"
          min={25}
          max={100}
          step={1}
          label={t("providers:assemblyai.contentSafetyConfidence")}
          value={config?.content_safety_confidence ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              content_safety_confidence: parseOptionalInt(e?.target?.value),
            })
          }
        />

        <theme.Switch
          id="assemblyai-redact-pii"
          label={t("providers:assemblyai.redactPii")}
          checked={config?.redact_pii ?? false}
          onChange={(enabled) => updateConfig({ ...config, redact_pii: !!enabled })}
        />

        <theme.Select
          label={t("providers:assemblyai.redactPiiSub")}
          values={[config?.redact_pii_sub ?? ""]}
          valueTitle={
            subOptions.find((o) => o.value === (config?.redact_pii_sub ?? ""))?.label ??
            t("providerDefault")
          }
          options={subOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "").trim();
            updateConfig({
              ...config,
              redact_pii_sub: raw.length ? raw as any : undefined,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {subOptions.map((o) => (
            <option key={o.value || "__default"} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Card size="small" title={t("providers:assemblyai.redactPiiPolicies")} description={t("providers:assemblyai.redactPiiPoliciesHint")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
              <theme.Select
                label={t("providers:assemblyai.addPolicy")}
                values={[draftPolicy]}
                valueTitle={draftPolicy || t("select")}
                options={ASSEMBLYAI_REDACT_PII_POLICIES.map((p) => ({ value: p, label: p }))}
                onChange={(val: string) => setDraftPolicy(String(val ?? "").trim())}
                style={{ minWidth: 220 }}
              >
                <option value="">{t("select")}</option>
                {ASSEMBLYAI_REDACT_PII_POLICIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </theme.Select>
              <theme.Button
                icon="add"
                size="small"
                title={t("add")}
                variant="informative"
                disabled={!draftPolicy || !ASSEMBLYAI_REDACT_PII_POLICIES.includes(draftPolicy as any)}
                onClick={addPolicy}
              />
            </div>

            {policyItems.length > 0 && <theme.Tags size="small" items={policyItems} onRemove={removePolicy} />}
          </div>
        </theme.Card>

        <theme.Card
          size="small"
          title={t("providers:assemblyai.redactPiiAudio")}
          headerActions={<theme.Switch id="assemblyai-redact-pii-audio" checked={piiAudioOn} onChange={setPiiAudio} />}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <theme.Select
              label={t("providers:assemblyai.redactPiiAudioQuality")}
              disabled={!piiAudioOn}
              values={[config?.redact_pii_audio_quality ?? ""]}
              valueTitle={
                audioQualityOptions.find((o) => o.value === (config?.redact_pii_audio_quality ?? ""))?.label ??
                t("providerDefault")
              }
              options={audioQualityOptions}
              onChange={(val: string) => {
                const raw = String(val ?? "").trim();
                updateConfig({
                  ...config,
                  redact_pii_audio_quality: raw.length ? raw as any : undefined,
                });
              }}
              style={{ minWidth: 220 }}
            >
              {audioQualityOptions.map((o) => (
                <option key={o.value || "__default"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>
          </div>
        </theme.Card>
      </div>
    </theme.Card>
  );
};

