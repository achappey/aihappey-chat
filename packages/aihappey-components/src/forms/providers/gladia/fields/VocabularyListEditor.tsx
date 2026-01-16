import { useTranslation } from "aihappey-i18n";
import { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { normalizeList, normalizeListItem } from "../../minimax/cards/shared";
import { GladiaVocabularyItem, VocabularyRow } from "../GladiaTranscriptionConfigForm";
import { VocabularyRowEditor } from "./VocabularyRowEditor";


export const VocabularyListEditor: React.FC<{
    items: GladiaVocabularyItem[];
    onChange: (next: GladiaVocabularyItem[]) => void;
    languageOptions: { value: string; label: string }[];
    idPrefix: string;
}> = ({ items, onChange, languageOptions, idPrefix }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const rows = useMemo<VocabularyRow[]>(
        () =>
            (Array.isArray(items) ? items : []).map((item) =>
                typeof item === "string"
                    ? { kind: "string", value: String(item ?? "") }
                    : {
                        kind: "object",
                        value: String(item?.value ?? ""),
                        intensity:
                            typeof item?.intensity === "number" ? item.intensity : undefined,
                        pronunciations: normalizeList(item?.pronunciations ?? []),
                        language: item?.language,
                    }
            ),
        [items]
    );

    const updateRow = (index: number, nextRow: VocabularyRow) => {
        const nextRows = rows.map((row, idx) => (idx === index ? nextRow : row));
        const normalized = nextRows
            .map((row) => {
                const value = normalizeListItem(row.value);
                if (!value) return undefined;
                if (row.kind === "string") return value;
                const pronunciations = normalizeList(row.pronunciations ?? []);
                return {
                    value,
                    intensity:
                        typeof row.intensity === "number" ? row.intensity : undefined,
                    pronunciations: pronunciations.length ? pronunciations : undefined,
                    language: row.language?.trim() ? row.language : undefined,
                } as GladiaVocabularyItem;
            })
            .filter(Boolean) as GladiaVocabularyItem[];
        onChange(normalized);
    };

    const removeRow = (index: number) => {
        const nextRows = rows.filter((_, idx) => idx !== index);
        const normalized = nextRows
            .map((row) => {
                const value = normalizeListItem(row.value);
                if (!value) return undefined;
                if (row.kind === "string") return value;
                const pronunciations = normalizeList(row.pronunciations ?? []);
                return {
                    value,
                    intensity:
                        typeof row.intensity === "number" ? row.intensity : undefined,
                    pronunciations: pronunciations.length ? pronunciations : undefined,
                    language: row.language?.trim() ? row.language : undefined,
                } as GladiaVocabularyItem;
            })
            .filter(Boolean) as GladiaVocabularyItem[];
        onChange(normalized);
    };

    const addRow = () => {
        const nextRows: VocabularyRow[] = [
            ...rows,
            { kind: "string", value: "" }
        ];

        const normalized = nextRows
            .map((row) => {
                const value = normalizeListItem(row.value);
                if (!value) return undefined;

                if (row.kind === "string") return value;

                const pronunciations = normalizeList(row.pronunciations ?? []);

                return {
                    value,
                    intensity: typeof row.intensity === "number" ? row.intensity : undefined,
                    pronunciations: pronunciations.length ? pronunciations : undefined,
                    language: row.language?.trim() ? row.language : undefined,
                } satisfies GladiaVocabularyItem;
            })
            .filter(Boolean) as GladiaVocabularyItem[];

        onChange(normalized);
    };


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{t("providers:gladia.customVocabularyList")}</strong>
                <theme.Button
                    icon="add"
                    size="small"
                    title={t("providers:gladia.customVocabularyAddItem")}
                    variant="informative"
                    onClick={addRow}
                />
            </div>
            {rows.length === 0 && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.customVocabularyEmpty")}
                </div>
            )}
            {rows.map((row, idx) => (
                <VocabularyRowEditor
                    key={`${row.kind}-${idx}`}
                    row={row}
                    onChange={(next) => updateRow(idx, next)}
                    onRemove={() => removeRow(idx)}
                    languageOptions={languageOptions}
                    idPrefix={`${idPrefix}-${idx}`}
                />
            ))}
        </div>
    );
};