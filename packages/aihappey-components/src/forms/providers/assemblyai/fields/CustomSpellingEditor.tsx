import React, { useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { normalizeList, normalizeListItem } from "./shared";
import { StringListEditor } from "./StringListEditor";

export type AssemblyAICustomSpellingEntry = {
  from: string[];
  to: string;
};

export const CustomSpellingEditor: React.FC<{
  idPrefix: string;
  entries: AssemblyAICustomSpellingEntry[];
  onChange: (next: AssemblyAICustomSpellingEntry[]) => void;
}> = ({ idPrefix, entries, onChange }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [newTo, setNewTo] = useState<string>("");

  const normalizedEntries = useMemo(() => {
    return (Array.isArray(entries) ? entries : []).map((e) => ({
      to: normalizeListItem(String((e as any)?.to ?? "")),
      from: normalizeList((e as any)?.from),
    }));
  }, [entries]);

  const addEntry = () => {
    const to = normalizeListItem(newTo);
    if (!to) return;
    onChange([...(normalizedEntries ?? []), { to, from: [] }]);
    setNewTo("");
  };

  const updateEntry = (index: number, patch: Partial<AssemblyAICustomSpellingEntry>) => {
    const next = normalizedEntries.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(normalizedEntries.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <theme.Input
          id={`${idPrefix}-new-to`}
          label={t("providers:assemblyai.customSpellingTo")}
          placeholder="e.g. SQL"
          value={newTo}
          onChange={(e: any) => setNewTo(String(e?.target?.value ?? ""))}
          onKeyDown={(e: any) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addEntry();
            }
          }}
        />
        <theme.Button
          icon="add"
          size="small"
          title={t("providers:assemblyai.customSpellingAdd")}
          variant="informative"
          disabled={!normalizeListItem(newTo)}
          onClick={addEntry}
        />
      </div>

      {normalizedEntries.length === 0 && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>{t("providers:assemblyai.customSpellingEmpty")}</div>
      )}

      {normalizedEntries.map((entry, index) => (
        <div
          key={`${entry.to}-${index}`}
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 8,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <theme.Input
              id={`${idPrefix}-to-${index}`}
              label={t("providers:assemblyai.customSpellingTo")}
              placeholder="e.g. SQL"
              value={entry.to}
              onChange={(e: any) => updateEntry(index, { to: String(e?.target?.value ?? "") })}
            />
            <theme.Button
              icon="delete"
              size="small"
              title={t("delete")}
              variant="danger"
              onClick={() => removeEntry(index)}
            />
          </div>

          <StringListEditor
            idPrefix={`${idPrefix}-from-${index}`}
            label={t("providers:assemblyai.customSpellingFrom")}
            placeholder={t("providers:assemblyai.customSpellingFromPlaceholder")}
            items={entry.from}
            onChange={(from) => updateEntry(index, { from })}
          />
        </div>
      ))}
    </div>
  );
};

