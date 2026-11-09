import { useCallback, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useSkills } from "aihappey-skills";
import { getModelProviderKey } from "../chat/engine/endpointProfiles";
import { renderProviderChatForm } from "../chat-settings/ProviderChatForm";
import { buildOpenAISkillOptions, createOpenAIShellSkillResolver } from "../provider-config/openai/openAISkillOptions";
import type { BenchmarkEnvironment, BenchmarkSettings, BenchmarkTarget } from "./types";

/** Mounted per editor opening; Cancel discards the entire deep-copied draft. */
export function BenchmarkSettingsModal({ target, env, appTitle, onSave, onClose }: {
  target: BenchmarkTarget;
  env: BenchmarkEnvironment;
  appTitle?: string;
  onSave: (settings: BenchmarkSettings) => void;
  onClose: () => void;
}) {
  const { Modal, Button, Input, Text } = useTheme();
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => structuredClone(target.settings));
  const skills = useSkills();
  const options = useMemo(() => buildOpenAISkillOptions(skills.items ?? []), [skills.items]);
  const resolver = useMemo(() => createOpenAIShellSkillResolver(skills, options), [skills, options]);
  const providerKey = getModelProviderKey(target.modelId, env.models.find(model => model.id === target.modelId)) ?? "";
  const updateConfig = useCallback((config: any) => setDraft(current => ({ ...current,
    providerMetadata: { ...current.providerMetadata, [providerKey]: structuredClone(config) } })), [providerKey]);
  const updateHeaders = useCallback((headers: Record<string, string> | undefined) => setDraft(current => ({ ...current,
    providerHeaders: { ...current.providerHeaders, [providerKey]: { ...headers } } })), [providerKey]);
  const form = renderProviderChatForm({
    providerKey, config: draft.providerMetadata[providerKey] ?? {}, headers: draft.providerHeaders[providerKey] ?? {},
    updateConfig, updateHeaders, models: env.models, appTitle, openAISkillOptions: options, resolveOpenAIShellSkill: resolver,
  });
  const valid = (draft.temperature === undefined || (Number.isFinite(draft.temperature) && draft.temperature >= 0 && draft.temperature <= 2))
    && (draft.maxOutputTokens === undefined || (Number.isInteger(draft.maxOutputTokens) && draft.maxOutputTokens > 0));
  return <Modal show title={t("ai.benchmarks.targetSettings", { number: target.ordinal })} onHide={onClose} size="large" actions={<>
    <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
    <Button disabled={!valid} onClick={() => { onSave(structuredClone(draft)); onClose(); }}>{t("save")}</Button>
  </>}>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Text>{t("ai.benchmarks.localSettings")}</Text>
      <Input label={t("ai.benchmarks.temperature")} type="number" min={0} max={2} step={0.1} value={draft.temperature ?? ""}
        onChange={event => setDraft(current => ({ ...current, temperature: event.target.value === "" ? undefined : Number(event.target.value) }))} />
      <Input label={t("maxOutputTokens")} type="number" min={1} step={1} value={draft.maxOutputTokens ?? ""}
        onChange={event => setDraft(current => ({ ...current, maxOutputTokens: event.target.value === "" ? undefined : Number(event.target.value) }))} />
      {form ?? <Text>{t("ai.benchmarks.noProviderSettings")}</Text>}
    </div>
  </Modal>;
}
