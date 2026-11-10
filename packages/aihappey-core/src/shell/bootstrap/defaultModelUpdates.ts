import { MODEL_PREFERENCE_FIELDS, normalizeModelIds, type DefaultModelsByType } from "aihappey-state";
import type { ModelOption } from "aihappey-types";

type PreferenceField = typeof MODEL_PREFERENCE_FIELDS[keyof typeof MODEL_PREFERENCE_FIELDS];

/** Release dates are Unix seconds. Only explicitly configured, verifiable lists are offered. */
export function getDefaultModelUpdates(
  preferences: Partial<Record<PreferenceField, unknown>>,
  defaults: DefaultModelsByType | undefined,
  models: readonly ModelOption[],
  now = Date.now(),
): DefaultModelsByType {
  const updates: DefaultModelsByType = {};
  const nowSeconds = now / 1000;
  if (!Number.isFinite(nowSeconds) || nowSeconds <= 0) return updates;
  const validDate = (model: ModelOption | undefined): model is ModelOption & { created: number } =>
    typeof model?.created === "number" && Number.isFinite(model.created)
    && model.created > 0 && model.created <= nowSeconds;

  for (const type of Object.keys(MODEL_PREFERENCE_FIELDS) as (keyof DefaultModelsByType)[]) {
    const saved = normalizeModelIds(preferences[MODEL_PREFERENCE_FIELDS[type]]);
    const configured = normalizeModelIds(defaults?.[type]);
    if (!saved.length || !configured.length) continue;
    const catalog = new Map(models.filter(model => model.type === type).map(model => [model.id, model]));
    const replacements = configured.map(id => catalog.get(id));
    // Applying replaces the whole list: never introduce unavailable/wrong-type/undated models.
    if (!replacements.every(validDate)) continue;
    const oldModels = saved.map(id => catalog.get(id)).filter(validDate)
      .filter(model => nowSeconds - model.created > 30 * 24 * 60 * 60);
    if (oldModels.some(old => replacements.some(model => !saved.includes(model.id) && model.created > old.created))) {
      updates[type] = configured;
    }
  }
  return updates;
}
