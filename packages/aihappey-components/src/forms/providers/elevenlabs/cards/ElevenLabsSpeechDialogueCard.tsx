import React, { useMemo, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechDialogue,
  ElevenLabsSpeechDialogueInput,
  ElevenLabsSpeechDialogueSettings,
} from "../ElevenLabsSpeechConfigForm";

const normalizeListItem = (s: string): string => (s ?? "").trim().replace(/\s+/g, " ");

const hasAnyOwnValue = (obj: Record<string, any> | undefined) =>
  !!obj && Object.values(obj).some((v) => v !== undefined);

const normalizeInputs = (val: unknown): ElevenLabsSpeechDialogueInput[] => {
  const raw = Array.isArray(val) ? val : [];
  const out: ElevenLabsSpeechDialogueInput[] = [];
  for (const v of raw) {
    const voice_id = normalizeListItem(String((v as any)?.voice_id ?? ""));
    const text = String((v as any)?.text ?? "").trim();

    // Keep partially filled rows, but drop fully empty ones.
    if (!voice_id && !text) continue;

    out.push({ voice_id, text });
  }
  return out;
};

export const ElevenLabsSpeechDialogueCard: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const inputs = useMemo(
    () => normalizeInputs(config?.dialogue?.inputs),
    [config?.dialogue?.inputs]
  );
  const settings = (config?.dialogue?.settings ?? {}) as ElevenLabsSpeechDialogueSettings;
  const stabilityValue = settings?.stability ?? 0.5;

  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraftVoiceId, setEditDraftVoiceId] = useState<string>("");
  const [editDraftText, setEditDraftText] = useState<string>("");

  const [draftVoiceId, setDraftVoiceId] = useState<string>(config?.voice ?? "");
  const [draftText, setDraftText] = useState<string>("");

  const updateDialogue = (next: Partial<ElevenLabsSpeechDialogue>) => {
    const merged: ElevenLabsSpeechDialogue = {
      ...(config?.dialogue ?? {}),
      ...next,
    };

    const nextInputs = normalizeInputs(merged.inputs);
    const nextSettings = merged.settings as ElevenLabsSpeechDialogueSettings | undefined;

    const cleanedSettings = nextSettings && hasAnyOwnValue(nextSettings) ? nextSettings : undefined;
    const cleanedDialogue: ElevenLabsSpeechDialogue | undefined =
      (nextInputs.length > 0 || cleanedSettings)
        ? {
            inputs: nextInputs.length ? nextInputs : undefined,
            settings: cleanedSettings,
          }
        : undefined;

    updateConfig({
      ...config,
      dialogue: cleanedDialogue,
    });
  };

  const addInput = () => {
    const voice_id = normalizeListItem(draftVoiceId);
    const text = String(draftText ?? "").trim();
    if (!voice_id || !text) return;

    updateDialogue({
      inputs: [...inputs, { voice_id, text }],
    });
    setDraftText("");
    setIsAddOpen(false);
  };

  const removeInput = (idx: number) => {
    const next = inputs.filter((_, i) => i !== idx);
    updateDialogue({ inputs: next.length ? next : undefined });

    if (editingIndex === idx) {
      cancelEdit();
    } else if (editingIndex !== null && editingIndex > idx) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const updateRow = (idx: number, next: Partial<ElevenLabsSpeechDialogueInput>) => {
    const nextList = inputs.map((row, i) =>
      i === idx
        ? {
            voice_id:
              next.voice_id !== undefined
                ? normalizeListItem(next.voice_id)
                : row.voice_id,
            text: next.text !== undefined ? String(next.text ?? "").trim() : row.text,
          }
        : row
    );
    updateDialogue({ inputs: nextList });
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const next = [...inputs];
    const tmp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = tmp;
    updateDialogue({ inputs: next });

    if (editingIndex === idx) setEditingIndex(idx - 1);
    else if (editingIndex === idx - 1) setEditingIndex(idx);
  };

  const moveDown = (idx: number) => {
    if (idx >= inputs.length - 1) return;
    const next = [...inputs];
    const tmp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = tmp;
    updateDialogue({ inputs: next });

    if (editingIndex === idx) setEditingIndex(idx + 1);
    else if (editingIndex === idx + 1) setEditingIndex(idx);
  };

  const startEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditDraftVoiceId(inputs[idx]?.voice_id ?? "");
    setEditDraftText(inputs[idx]?.text ?? "");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditDraftVoiceId("");
    setEditDraftText("");
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    updateRow(editingIndex, { voice_id: editDraftVoiceId, text: editDraftText });
    cancelEdit();
  };

  return (
    <theme.Card size="small" title={t("providers:elevenlabs.dialogue")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ opacity: 0.8, fontSize: 12 }}>{t("providers:elevenlabs.dialogueHint")}</div>

        {/* Add Line (collapsed by default) */}
        <div
          style={{
           // padding: 10,
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{t("providers:elevenlabs.dialogueAddLine")}</div>
            <theme.Button
              icon="add"
              size="small"
              variant={isAddOpen ? "subtle" : "informative"}
              title={t("providers:elevenlabs.dialogueAddLine")}
              onClick={() => setIsAddOpen((v) => !v)}
            />
          </div>

          {isAddOpen && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              <theme.Input
                id="elevenlabs-dialogue-add-voice-id"
                label={t("speechSettings.voice")}
                placeholder={t("providers:elevenlabs.dialogueVoiceIdPlaceholder")}
                value={draftVoiceId}
                onChange={(e: any) => setDraftVoiceId(e?.target?.value ?? "")}
              />

              <theme.TextArea
                label={t("providers:elevenlabs.dialogueText")}
                rows={3}
                value={draftText}
                onChange={(value: string) => setDraftText(value ?? "")}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <theme.Button
                  size="small"
                  variant="subtle"
                  title={t("cancel")}
                  onClick={() => {
                    setIsAddOpen(false);
                    setDraftText("");
                  }}
                >
                  {t("cancel")}
                </theme.Button>
                <theme.Button
                  icon="add"
                  size="small"
                  title={t("providers:elevenlabs.dialogueAddLine")}
                  variant="informative"
                  disabled={!normalizeListItem(draftVoiceId) || !String(draftText ?? "").trim()}
                  onClick={addInput}
                />
              </div>
            </div>
          )}
        </div>

        {inputs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {inputs.map((row, idx) => (
              <div
                key={`${idx}-${row.voice_id}-${row.text.slice(0, 12)}`}
                style={{
                //  padding: 10,
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
              //    gap: 10,
                }}
              >
                {/* Display row (single-line) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <div
                    title={row.voice_id}
                    style={{
                      width: 160,
                      flexShrink: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                      opacity: 0.9,
                    }}
                  >
                    {row.voice_id}
                  </div>

                  <div
                    title={row.text}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                    }}
                  >
                    {row.text}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <theme.Button
                      icon="up"
                      size="small"
                      variant="subtle"
                      title={t("up")}
                      disabled={idx === 0}
                      onClick={() => moveUp(idx)}
                    />
                    <theme.Button
                      icon="down"
                      size="small"
                      variant="subtle"
                      title={t("down")}
                      disabled={idx === inputs.length - 1}
                      onClick={() => moveDown(idx)}
                    />
                    <theme.Button
                      icon="edit"
                      size="small"
                      variant="subtle"
                      title={t("edit")}
                      onClick={() => startEdit(idx)}
                    />
                    <theme.Button
                      icon="delete"
                      size="small"
                      variant="danger"
                      title={t("delete")}
                      onClick={() => removeInput(idx)}
                    />
                  </div>
                </div>

                {/* Inline editor */}
                {editingIndex === idx && (
                  <div
                    style={{
                      paddingTop: 10,
                      borderTop: "1px solid rgba(0,0,0,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <theme.Input
                      label={t("speechSettings.voice")}
                      placeholder={t("providers:elevenlabs.dialogueVoiceIdPlaceholder")}
                      value={editDraftVoiceId}
                      onChange={(e: any) => setEditDraftVoiceId(String(e?.target?.value ?? ""))}
                    />

                    <theme.TextArea
                      label={t("providers:elevenlabs.dialogueText")}
                      rows={3}
                      value={editDraftText}
                      onChange={(value: string) => setEditDraftText(value ?? "")}
                    />

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
                        disabled={!normalizeListItem(editDraftVoiceId) || !String(editDraftText ?? "").trim()}
                        onClick={saveEdit}
                      >
                        {t("save")}
                      </theme.Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stability slider (bottom) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <theme.Slider
              label={t("providers:elevenlabs.dialogueStability", {
                value: stabilityValue.toFixed(2),
              })}
              min={0}
              max={1}
              step={0.01}
              value={stabilityValue}
              onChange={(value: number) =>
                updateDialogue({
                  settings: {
                    ...(config?.dialogue?.settings ?? {}),
                    stability: value,
                  },
                })
              }
            />
          </div>
          <theme.Button
            size="small"
            variant="subtle"
            title={t("providers:elevenlabs.dialogueStabilityReset")}
            onClick={() =>
              updateDialogue({
                settings: {
                  ...(config?.dialogue?.settings ?? {}),
                  stability: undefined,
                },
              })
            }
          >
            {t("reset")}
          </theme.Button>
        </div>
      </div>
    </theme.Card>
  );
};

