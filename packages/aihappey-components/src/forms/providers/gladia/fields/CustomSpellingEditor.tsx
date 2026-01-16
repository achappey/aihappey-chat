import { useTranslation } from "aihappey-i18n";
import { useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { normalizeListItem } from "../../minimax/cards/shared";
import { StringListEditor } from "./StringListEditor";

export const CustomSpellingEditor: React.FC<{
    entries: { term: string; variants: string[] }[];
    onChange: (next: { term: string; variants: string[] }[]) => void;
    idPrefix: string;
}> = ({ entries, onChange, idPrefix }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const [newTerm, setNewTerm] = useState<string>("");

    const addEntry = () => {
        const term = normalizeListItem(newTerm);
        if (!term) return;
        onChange([...entries, { term, variants: [] }]);
        setNewTerm("");
    };

    const updateEntry = (index: number, next: { term: string; variants: string[] }) => {
        const nextEntries = entries.map((entry, idx) => (idx === index ? next : entry));
        onChange(nextEntries);
    };

    const removeEntry = (index: number) => {
        onChange(entries.filter((_, idx) => idx !== index));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
                <theme.Input
                    id={`${idPrefix}-new-term`}
                    label={t("providers:gladia.customSpellingTerm")}
                    placeholder="e.g. SQL"
                    value={newTerm}
                    onChange={(e: any) => setNewTerm(e?.target?.value ?? "")}
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
                    title={t("providers:gladia.customSpellingAddEntry")}
                    variant="informative"
                    disabled={!normalizeListItem(newTerm)}
                    onClick={addEntry}
                />
            </div>

            {entries.length === 0 && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.customSpellingEmpty")}
                </div>
            )}

            {entries.map((entry, index) => (
                <div
                    key={`${entry.term}-${index}`}
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
                            id={`${idPrefix}-term-${index}`}
                            label={t("providers:gladia.customSpellingTerm")}
                            placeholder="e.g. SQL"
                            value={entry.term}
                            onChange={(e: any) =>
                                updateEntry(index, {
                                    ...entry,
                                    term: String(e?.target?.value ?? ""),
                                })
                            }
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
                        idPrefix={`${idPrefix}-variants-${index}`}
                        label={t("providers:gladia.customSpellingVariants")}
                        placeholder="e.g. Sequel"
                        items={entry.variants}
                        onChange={(variants) => updateEntry(index, { ...entry, variants })}
                    />
                </div>
            ))}
        </div>
    );
};