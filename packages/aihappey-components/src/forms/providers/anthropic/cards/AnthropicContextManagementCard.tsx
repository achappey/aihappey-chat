import { useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  formatAnthropicStringList,
  parseAnthropicNumberInput,
  parseAnthropicStringList,
} from "./AnthropicToolCardShared";

const CONTEXT_MANAGEMENT_TYPES = [
  "clear_tool_uses_20250919",
  "clear_thinking_20251015",
  "compact_20260112",
] as const;

const DEFAULT_CONTEXT_MANAGEMENT_TYPE = "clear_tool_uses_20250919";
const DEFAULT_COMPACT_TRIGGER = 150000;

const createContextManagementEdit = (
  type: string = DEFAULT_CONTEXT_MANAGEMENT_TYPE
) => {
  switch (type) {
    case "clear_thinking_20251015":
      return {
        type,
        keep: {
          type: "thinking_turns",
          value: 1,
        },
      };
    case "compact_20260112":
      return {
        type,
        trigger: {
          type: "input_tokens",
          value: DEFAULT_COMPACT_TRIGGER,
        },
      };
    case "clear_tool_uses_20250919":
    default:
      return {
        type: "clear_tool_uses_20250919",
        trigger: {
          type: "input_tokens",
          value: 10000,
        },
      };
  }
};

const cloneJsonValue = (value: any) =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));

const getContextManagementEdits = (config: any) =>
  Array.isArray(config?.context_management?.edits)
    ? config.context_management.edits
    : [];

const sanitizeInputTokensValue = (value: any) => {
  if (value?.type !== "input_tokens") return undefined;

  const parsed = Number(value?.value);
  return Number.isFinite(parsed)
    ? {
        type: "input_tokens",
        value: parsed,
      }
    : undefined;
};

const sanitizeToolUsesValue = (value: any) => {
  if (value?.type !== "tool_uses") return undefined;

  const parsed = Number(value?.value);
  return Number.isFinite(parsed)
    ? {
        type: "tool_uses",
        value: parsed,
      }
    : undefined;
};

const sanitizeClearThinkingKeep = (value: any) => {
  if (value === "all") return "all";
  if (value?.type === "all") return { type: "all" };

  if (value?.type === "thinking_turns") {
    const parsed = Number(value?.value);
    return Number.isFinite(parsed)
      ? {
          type: "thinking_turns",
          value: parsed,
        }
      : undefined;
  }

  return undefined;
};

const sanitizeClearToolInputs = (value: any) => {
  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    const nextValues = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    return nextValues.length ? nextValues : undefined;
  }

  return undefined;
};

const hasFiniteNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

const isContextManagementDraftValid = (value: any) => {
  switch (value?.type) {
    case "clear_tool_uses_20250919": {
      const hasValidTrigger =
        value?.trigger === undefined ||
        (value?.trigger?.type === "input_tokens" && hasFiniteNumber(value?.trigger?.value)) ||
        (value?.trigger?.type === "tool_uses" && hasFiniteNumber(value?.trigger?.value));
      const hasValidKeep =
        value?.keep === undefined ||
        (value?.keep?.type === "tool_uses" && hasFiniteNumber(value?.keep?.value));
      const hasValidClearAtLeast =
        value?.clear_at_least === undefined ||
        (value?.clear_at_least?.type === "input_tokens" &&
          hasFiniteNumber(value?.clear_at_least?.value));
      const hasValidClearToolInputs =
        value?.clear_tool_inputs === undefined ||
        typeof value?.clear_tool_inputs === "boolean" ||
        (Array.isArray(value?.clear_tool_inputs) &&
          value.clear_tool_inputs.every((item: unknown) => typeof item === "string"));

      return (
        hasValidTrigger &&
        hasValidKeep &&
        hasValidClearAtLeast &&
        hasValidClearToolInputs
      );
    }
    case "clear_thinking_20251015":
      return (
        value?.keep === undefined ||
        value?.keep === "all" ||
        value?.keep?.type === "all" ||
        (value?.keep?.type === "thinking_turns" && hasFiniteNumber(value?.keep?.value))
      );
    case "compact_20260112":
      return (
        value?.trigger === undefined ||
        (value?.trigger?.type === "input_tokens" && hasFiniteNumber(value?.trigger?.value))
      );
    default:
      return false;
  }
};

const sanitizeContextManagementEdit = (value: any) => {
  switch (value?.type) {
    case "clear_tool_uses_20250919": {
      const clearAtLeast = sanitizeInputTokensValue(value?.clear_at_least);
      const trigger =
        value?.trigger?.type === "input_tokens"
          ? sanitizeInputTokensValue(value.trigger)
          : sanitizeToolUsesValue(value?.trigger);
      const keep = sanitizeToolUsesValue(value?.keep);
      const clearToolInputs = sanitizeClearToolInputs(value?.clear_tool_inputs);
      const excludeTools = Array.isArray(value?.exclude_tools)
        ? value.exclude_tools
            .filter((item: unknown): item is string => typeof item === "string")
            .map((item: string) => item.trim())
            .filter(Boolean)
        : undefined;

      return {
        type: "clear_tool_uses_20250919",
        ...(clearAtLeast ? { clear_at_least: clearAtLeast } : {}),
        ...(clearToolInputs !== undefined
          ? { clear_tool_inputs: clearToolInputs }
          : {}),
        ...(excludeTools?.length ? { exclude_tools: excludeTools } : {}),
        ...(keep ? { keep } : {}),
        ...(trigger ? { trigger } : {}),
      };
    }
    case "clear_thinking_20251015": {
      const keep = sanitizeClearThinkingKeep(value?.keep);

      return {
        type: "clear_thinking_20251015",
        ...(keep !== undefined ? { keep } : {}),
      };
    }
    case "compact_20260112": {
      const instructions =
        typeof value?.instructions === "string" ? value.instructions.trim() : "";
      const trigger = sanitizeInputTokensValue(value?.trigger);

      return {
        type: "compact_20260112",
        ...(instructions ? { instructions } : {}),
        ...(typeof value?.pause_after_compaction === "boolean"
          ? { pause_after_compaction: value.pause_after_compaction }
          : {}),
        ...(trigger ? { trigger } : {}),
      };
    }
    default:
      return {
        type: DEFAULT_CONTEXT_MANAGEMENT_TYPE,
      };
  }
};

const getContextManagementSummary = (entry: any, t: any) => {
  const summaryParts: string[] = [];

  switch (entry?.type) {
    case "clear_tool_uses_20250919": {
      if (entry?.trigger?.type === "input_tokens") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.triggerInputTokens", {
            value: entry.trigger.value,
          })
        );
      }

      if (entry?.trigger?.type === "tool_uses") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.triggerToolUses", {
            value: entry.trigger.value,
          })
        );
      }

      if (entry?.keep?.type === "tool_uses") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.keepToolUses", {
            value: entry.keep.value,
          })
        );
      }

      if (entry?.clear_at_least?.type === "input_tokens") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.clearAtLeast", {
            value: entry.clear_at_least.value,
          })
        );
      }

      if (typeof entry?.clear_tool_inputs === "boolean") {
        summaryParts.push(
          t(
            `providers:anthropic.contextManagement.summaries.clearToolInputs${
              entry.clear_tool_inputs ? "True" : "False"
            }`
          )
        );
      }

      if (Array.isArray(entry?.clear_tool_inputs) && entry.clear_tool_inputs.length) {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.clearToolInputsList", {
            value: entry.clear_tool_inputs.join(", "),
          })
        );
      }

      if (Array.isArray(entry?.exclude_tools) && entry.exclude_tools.length) {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.excludeTools", {
            value: entry.exclude_tools.join(", "),
          })
        );
      }

      break;
    }
    case "clear_thinking_20251015": {
      if (entry?.keep?.type === "thinking_turns") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.keepThinkingTurns", {
            value: entry.keep.value,
          })
        );
      }

      if (entry?.keep?.type === "all") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.keepAllObject")
        );
      }

      if (entry?.keep === "all") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.keepAllLiteral")
        );
      }

      break;
    }
    case "compact_20260112": {
      if (entry?.trigger?.type === "input_tokens") {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.triggerInputTokens", {
            value: entry.trigger.value,
          })
        );
      } else {
        summaryParts.push(
          t(
            "providers:anthropic.contextManagement.summaries.compactDefaultTrigger",
            {
              value: DEFAULT_COMPACT_TRIGGER,
            }
          )
        );
      }

      if (typeof entry?.pause_after_compaction === "boolean") {
        summaryParts.push(
          t(
            `providers:anthropic.contextManagement.summaries.pauseAfterCompaction${
              entry.pause_after_compaction ? "True" : "False"
            }`
          )
        );
      }

      if (typeof entry?.instructions === "string" && entry.instructions.trim()) {
        summaryParts.push(
          t("providers:anthropic.contextManagement.summaries.instructions")
        );
      }

      break;
    }
    default:
      break;
  }

  return summaryParts.length
    ? summaryParts.join(" • ")
    : t("providers:anthropic.contextManagement.summaries.noOptionalFields");
};

export const AnthropicContextManagementCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const contextManagementEdits = useMemo(
    () => getContextManagementEdits(config),
    [config?.context_management?.edits]
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<any>(createContextManagementEdit());
  const draftIsValid = isContextManagementDraftValid(draft);

  const updateContextManagement = (nextEntries: any[]) => {
    const sanitizedEntries = nextEntries.map((entry) => sanitizeContextManagementEdit(entry));

    updateConfig({
      ...config,
      context_management: sanitizedEntries.length
        ? {
            ...(config?.context_management ?? {}),
            edits: sanitizedEntries,
          }
        : undefined,
    });
  };

  const startEdit = (index: number, entry: any) => {
    setEditingIndex(index);
    setDraft(cloneJsonValue(entry) ?? createContextManagementEdit());
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft(createContextManagementEdit());
  };

  const saveEdit = () => {
    if (editingIndex === null || !draftIsValid) return;

    const nextEntries = [...contextManagementEdits];
    nextEntries[editingIndex] = sanitizeContextManagementEdit(draft);
    updateContextManagement(nextEntries);
    cancelEdit();
  };

  const moveContextManagementEntry = (from: number, to: number) => {
    if (to < 0 || to >= contextManagementEdits.length || from === to) return;

    const nextEntries = [...contextManagementEdits];
    const [moved] = nextEntries.splice(from, 1);
    nextEntries.splice(to, 0, moved);
    updateContextManagement(nextEntries);

    if (editingIndex === from) {
      setEditingIndex(to);
    } else if (editingIndex === to) {
      setEditingIndex(from);
    }
  };

  const renderClearToolUsesEditor = () => {
    const triggerType =
      draft?.trigger?.type === "input_tokens" || draft?.trigger?.type === "tool_uses"
        ? draft.trigger.type
        : "none";
    const keepType = draft?.keep?.type === "tool_uses" ? "tool_uses" : "none";
    const clearAtLeastType =
      draft?.clear_at_least?.type === "input_tokens" ? "input_tokens" : "none";
    const clearToolInputsMode =
      typeof draft?.clear_tool_inputs === "boolean"
        ? "boolean"
        : Array.isArray(draft?.clear_tool_inputs)
          ? "list"
          : "none";

    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <theme.Select
            label={t("providers:anthropic.contextManagement.trigger")}
            values={[triggerType]}
            valueTitle={t(`providers:anthropic.contextManagement.modes.${triggerType}`)}
            onChange={(value: string) => {
              if (value === "none") {
                const { trigger, ...rest } = draft;
                setDraft(rest);
                return;
              }

              setDraft({
                ...draft,
                trigger: {
                  type: value,
                  value: draft?.trigger?.type === value ? draft?.trigger?.value : undefined,
                },
              });
            }}
          >
            <option value="none">{t("providers:anthropic.contextManagement.modes.none")}</option>
            <option value="input_tokens">
              {t("providers:anthropic.contextManagement.modes.input_tokens")}
            </option>
            <option value="tool_uses">
              {t("providers:anthropic.contextManagement.modes.tool_uses")}
            </option>
          </theme.Select>

          {triggerType !== "none" ? (
            <theme.Input
              type="number"
              label={t("providers:anthropic.contextManagement.triggerValue")}
              value={draft?.trigger?.value ?? ""}
              onChange={(e: any) =>
                setDraft({
                  ...draft,
                  trigger: {
                    type: triggerType,
                    value: parseAnthropicNumberInput(e?.target?.value),
                  },
                })
              }
            />
          ) : null}

          <theme.Select
            label={t("providers:anthropic.contextManagement.keep")}
            values={[keepType]}
            valueTitle={t(`providers:anthropic.contextManagement.modes.${keepType}`)}
            onChange={(value: string) => {
              if (value === "none") {
                const { keep, ...rest } = draft;
                setDraft(rest);
                return;
              }

              setDraft({
                ...draft,
                keep: {
                  type: "tool_uses",
                  value: draft?.keep?.type === "tool_uses" ? draft?.keep?.value : undefined,
                },
              });
            }}
          >
            <option value="none">{t("providers:anthropic.contextManagement.modes.none")}</option>
            <option value="tool_uses">
              {t("providers:anthropic.contextManagement.modes.tool_uses")}
            </option>
          </theme.Select>

          {keepType !== "none" ? (
            <theme.Input
              type="number"
              label={t("providers:anthropic.contextManagement.keepValue")}
              value={draft?.keep?.value ?? ""}
              onChange={(e: any) =>
                setDraft({
                  ...draft,
                  keep: {
                    type: "tool_uses",
                    value: parseAnthropicNumberInput(e?.target?.value),
                  },
                })
              }
            />
          ) : null}

          <theme.Select
            label={t("providers:anthropic.contextManagement.clearAtLeast")}
            values={[clearAtLeastType]}
            valueTitle={t(
              `providers:anthropic.contextManagement.modes.${clearAtLeastType}`
            )}
            onChange={(value: string) => {
              if (value === "none") {
                const { clear_at_least, ...rest } = draft;
                setDraft(rest);
                return;
              }

              setDraft({
                ...draft,
                clear_at_least: {
                  type: "input_tokens",
                  value:
                    draft?.clear_at_least?.type === "input_tokens"
                      ? draft?.clear_at_least?.value
                      : undefined,
                },
              });
            }}
          >
            <option value="none">{t("providers:anthropic.contextManagement.modes.none")}</option>
            <option value="input_tokens">
              {t("providers:anthropic.contextManagement.modes.input_tokens")}
            </option>
          </theme.Select>

          {clearAtLeastType !== "none" ? (
            <theme.Input
              type="number"
              label={t("providers:anthropic.contextManagement.clearAtLeastValue")}
              value={draft?.clear_at_least?.value ?? ""}
              onChange={(e: any) =>
                setDraft({
                  ...draft,
                  clear_at_least: {
                    type: "input_tokens",
                    value: parseAnthropicNumberInput(e?.target?.value),
                  },
                })
              }
            />
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <theme.Select
            label={t("providers:anthropic.contextManagement.clearToolInputs")}
            values={[clearToolInputsMode]}
            valueTitle={t(
              `providers:anthropic.contextManagement.modes.${clearToolInputsMode}`
            )}
            onChange={(value: string) => {
              if (value === "none") {
                const { clear_tool_inputs, ...rest } = draft;
                setDraft(rest);
                return;
              }

              if (value === "boolean") {
                setDraft({
                  ...draft,
                  clear_tool_inputs:
                    typeof draft?.clear_tool_inputs === "boolean"
                      ? draft.clear_tool_inputs
                      : true,
                });
                return;
              }

              setDraft({
                ...draft,
                clear_tool_inputs: Array.isArray(draft?.clear_tool_inputs)
                  ? draft.clear_tool_inputs
                  : [],
              });
            }}
          >
            <option value="none">{t("providers:anthropic.contextManagement.modes.none")}</option>
            <option value="boolean">
              {t("providers:anthropic.contextManagement.modes.boolean")}
            </option>
            <option value="list">{t("providers:anthropic.contextManagement.modes.list")}</option>
          </theme.Select>

          {clearToolInputsMode === "boolean" ? (
            <theme.Select
              label={t("providers:anthropic.contextManagement.clearToolInputsValue")}
              values={[draft?.clear_tool_inputs ? "true" : "false"]}
              valueTitle={t(
                `providers:anthropic.contextManagement.booleanValues.${
                  draft?.clear_tool_inputs ? "true" : "false"
                }`
              )}
              onChange={(value: string) =>
                setDraft({
                  ...draft,
                  clear_tool_inputs: value === "true",
                })
              }
            >
              <option value="true">
                {t("providers:anthropic.contextManagement.booleanValues.true")}
              </option>
              <option value="false">
                {t("providers:anthropic.contextManagement.booleanValues.false")}
              </option>
            </theme.Select>
          ) : null}

          {clearToolInputsMode === "list" ? (
            <theme.Input
              label={t("providers:anthropic.contextManagement.clearToolInputsList")}
              placeholder={t(
                "providers:anthropic.contextManagement.clearToolInputsPlaceholder"
              )}
              value={formatAnthropicStringList(
                Array.isArray(draft?.clear_tool_inputs) ? draft.clear_tool_inputs : []
              )}
              onChange={(e: any) =>
                setDraft({
                  ...draft,
                  clear_tool_inputs:
                    parseAnthropicStringList(e?.target?.value ?? "") ?? [],
                })
              }
            />
          ) : null}

          <theme.Input
            label={t("providers:anthropic.contextManagement.excludeTools")}
            placeholder={t("providers:anthropic.contextManagement.excludeToolsPlaceholder")}
            value={formatAnthropicStringList(draft?.exclude_tools)}
            onChange={(e: any) =>
              setDraft({
                ...draft,
                exclude_tools: parseAnthropicStringList(e?.target?.value ?? "") ?? undefined,
              })
            }
          />
        </div>
      </>
    );
  };

  const renderClearThinkingEditor = () => {
    const keepMode =
      draft?.keep === "all"
        ? "all_literal"
        : draft?.keep?.type === "all"
          ? "all_object"
          : draft?.keep?.type === "thinking_turns"
            ? "thinking_turns"
            : "none";

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <theme.Select
          label={t("providers:anthropic.contextManagement.keep")}
          values={[keepMode]}
          valueTitle={t(`providers:anthropic.contextManagement.modes.${keepMode}`)}
          onChange={(value: string) => {
            if (value === "none") {
              const { keep, ...rest } = draft;
              setDraft(rest);
              return;
            }

            if (value === "all_literal") {
              setDraft({
                ...draft,
                keep: "all",
              });
              return;
            }

            if (value === "all_object") {
              setDraft({
                ...draft,
                keep: { type: "all" },
              });
              return;
            }

            setDraft({
              ...draft,
              keep: {
                type: "thinking_turns",
                value:
                  draft?.keep?.type === "thinking_turns"
                    ? draft?.keep?.value
                    : undefined,
              },
            });
          }}
        >
          <option value="none">{t("providers:anthropic.contextManagement.modes.none")}</option>
          <option value="thinking_turns">
            {t("providers:anthropic.contextManagement.modes.thinking_turns")}
          </option>
          <option value="all_object">
            {t("providers:anthropic.contextManagement.modes.all_object")}
          </option>
          <option value="all_literal">
            {t("providers:anthropic.contextManagement.modes.all_literal")}
          </option>
        </theme.Select>

        {keepMode === "thinking_turns" ? (
          <theme.Input
            type="number"
            label={t("providers:anthropic.contextManagement.keepValue")}
            value={draft?.keep?.value ?? ""}
            onChange={(e: any) =>
              setDraft({
                ...draft,
                keep: {
                  type: "thinking_turns",
                  value: parseAnthropicNumberInput(e?.target?.value),
                },
              })
            }
          />
        ) : null}
      </div>
    );
  };

  const renderCompactEditor = () => {
    const triggerType = draft?.trigger?.type === "input_tokens" ? "input_tokens" : "none";
    const pauseAfterCompactionValue =
      typeof draft?.pause_after_compaction === "boolean"
        ? String(draft.pause_after_compaction)
        : "none";

    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <theme.Select
            label={t("providers:anthropic.contextManagement.trigger")}
            values={[triggerType]}
            valueTitle={t(`providers:anthropic.contextManagement.modes.${triggerType}`)}
            onChange={(value: string) => {
              if (value === "none") {
                const { trigger, ...rest } = draft;
                setDraft(rest);
                return;
              }

              setDraft({
                ...draft,
                trigger: {
                  type: "input_tokens",
                  value:
                    draft?.trigger?.type === "input_tokens"
                      ? draft?.trigger?.value
                      : undefined,
                },
              });
            }}
          >
            <option value="none">{t("providers:anthropic.contextManagement.modes.none")}</option>
            <option value="input_tokens">
              {t("providers:anthropic.contextManagement.modes.input_tokens")}
            </option>
          </theme.Select>

          {triggerType !== "none" ? (
            <theme.Input
              type="number"
              label={t("providers:anthropic.contextManagement.triggerValue")}
              value={draft?.trigger?.value ?? ""}
              onChange={(e: any) =>
                setDraft({
                  ...draft,
                  trigger: {
                    type: "input_tokens",
                    value: parseAnthropicNumberInput(e?.target?.value),
                  },
                })
              }
            />
          ) : null}

          <theme.Select
            label={t("providers:anthropic.contextManagement.pauseAfterCompaction")}
            values={[pauseAfterCompactionValue]}
            valueTitle={t(
              `providers:anthropic.contextManagement.booleanModes.${pauseAfterCompactionValue}`
            )}
            onChange={(value: string) => {
              if (value === "none") {
                const { pause_after_compaction, ...rest } = draft;
                setDraft(rest);
                return;
              }

              setDraft({
                ...draft,
                pause_after_compaction: value === "true",
              });
            }}
          >
            <option value="none">
              {t("providers:anthropic.contextManagement.booleanModes.none")}
            </option>
            <option value="true">
              {t("providers:anthropic.contextManagement.booleanModes.true")}
            </option>
            <option value="false">
              {t("providers:anthropic.contextManagement.booleanModes.false")}
            </option>
          </theme.Select>
        </div>

        <theme.TextArea
          label={t("providers:anthropic.contextManagement.instructions")}
          placeholder={t("providers:anthropic.contextManagement.instructionsPlaceholder")}
          rows={4}
          value={draft?.instructions ?? ""}
          onChange={(value: string) =>
            setDraft({
              ...draft,
              instructions: value,
            })
          }
        />
      </>
    );
  };

  return (
    <theme.Card
      title={t("providers:anthropic.contextManagement.title")}
      size="small"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.78 }}>
          {t("providers:anthropic.contextManagement.description")}
        </div>

        {contextManagementEdits.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.72 }}>
            {t("providers:anthropic.contextManagement.empty")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contextManagementEdits.map((entry: any, index: number) => {
              const isEditing = editingIndex === index;

              return (
                <div
                  key={`anthropic-context-management-${index}`}
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontWeight: 600 }}>
                        {t(
                          `providers:anthropic.contextManagement.types.${
                            entry?.type || DEFAULT_CONTEXT_MANAGEMENT_TYPE
                          }`
                        )}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.72 }}>
                        {getContextManagementSummary(entry, t)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <theme.Button
                        icon="up"
                        size="small"
                        variant="subtle"
                        title={t("up")}
                        disabled={index === 0}
                        onClick={() => moveContextManagementEntry(index, index - 1)}
                      />
                      <theme.Button
                        icon="down"
                        size="small"
                        variant="subtle"
                        title={t("down")}
                        disabled={index === contextManagementEdits.length - 1}
                        onClick={() => moveContextManagementEntry(index, index + 1)}
                      />
                      <theme.Button
                        icon="edit"
                        size="small"
                        variant="subtle"
                        title={t("edit")}
                        onClick={() => startEdit(index, entry)}
                      />
                      <theme.Button
                        icon="delete"
                        size="small"
                        variant="danger"
                        title={t("delete")}
                        onClick={() => {
                          const nextEntries = contextManagementEdits.filter(
                            (_: unknown, entryIndex: number) => entryIndex !== index
                          );
                          updateContextManagement(nextEntries);

                          if (editingIndex === index) {
                            cancelEdit();
                          } else if (editingIndex != null && editingIndex > index) {
                            setEditingIndex(editingIndex - 1);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {isEditing ? (
                    <div
                      style={{
                        paddingTop: 10,
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <theme.Select
                        label={t("providers:anthropic.contextManagement.type")}
                        values={[draft?.type ?? DEFAULT_CONTEXT_MANAGEMENT_TYPE]}
                        valueTitle={t(
                          `providers:anthropic.contextManagement.types.${
                            draft?.type ?? DEFAULT_CONTEXT_MANAGEMENT_TYPE
                          }`
                        )}
                        onChange={(value: string) =>
                          setDraft(
                            createContextManagementEdit(
                              String(value ?? DEFAULT_CONTEXT_MANAGEMENT_TYPE)
                            )
                          )
                        }
                      >
                        {CONTEXT_MANAGEMENT_TYPES.map((value) => (
                          <option key={`anthropic-context-management-type-${value}`} value={value}>
                            {t(`providers:anthropic.contextManagement.types.${value}`)}
                          </option>
                        ))}
                      </theme.Select>

                      {draft?.type === "clear_tool_uses_20250919"
                        ? renderClearToolUsesEditor()
                        : null}
                      {draft?.type === "clear_thinking_20251015"
                        ? renderClearThinkingEditor()
                        : null}
                      {draft?.type === "compact_20260112" ? renderCompactEditor() : null}

                      {!draftIsValid ? (
                        <div style={{ fontSize: 12, opacity: 0.72 }}>
                          {t("providers:anthropic.contextManagement.validation.invalid")}
                        </div>
                      ) : null}

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <theme.Button
                          size="small"
                          variant="subtle"
                          title={t("cancel")}
                          onClick={cancelEdit}
                        >
                          {t("cancel")}
                        </theme.Button>
                        <theme.Button
                          icon="check"
                          size="small"
                          variant="informative"
                          title={t("save")}
                          disabled={!draftIsValid}
                          onClick={saveEdit}
                        >
                          {t("save")}
                        </theme.Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <theme.Button
            icon="add"
            size="small"
            variant="subtle"
            title={t("providers:anthropic.contextManagement.add")}
            onClick={() => {
              const nextEntries = [
                ...contextManagementEdits,
                createContextManagementEdit(),
              ];
              updateContextManagement(nextEntries);
              startEdit(nextEntries.length - 1, nextEntries[nextEntries.length - 1]);
            }}
          >
            {t("providers:anthropic.contextManagement.add")}
          </theme.Button>
        </div>
      </div>
    </theme.Card>
  );
};
