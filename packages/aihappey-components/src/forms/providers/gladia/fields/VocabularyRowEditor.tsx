import { useTranslation } from "aihappey-i18n";
import { useMemo, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { normalizeList, normalizeListItem } from "../../minimax/cards/shared";
import { parseOptionalNumber, toTagItems, VocabularyRow } from "../GladiaTranscriptionConfigForm";

export const VocabularyRowEditor: React.FC<{
    row: VocabularyRow;
    onChange: (next: VocabularyRow) => void;
    onRemove: () => void;
    languageOptions: { value: string; label: string }[];
    idPrefix: string;
}> = ({ row, onChange, onRemove, languageOptions, idPrefix }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const pronunciations = useMemo(
        () => normalizeList(row.pronunciations ?? []),
        [row.pronunciations]
    );
    const [newPronunciation, setNewPronunciation] = useState<string>("");

    const addPronunciation = () => {
        const n = normalizeListItem(newPronunciation);
        if (!n) return;
        onChange({ ...row, pronunciations: normalizeList([...pronunciations, n]) });
        setNewPronunciation("");
    };

    const removePronunciation = (value: string) => {
        const key = normalizeListItem(value).toLowerCase();
        const next = pronunciations.filter(
            (x) => normalizeListItem(x).toLowerCase() !== key
        );
        onChange({ ...row, pronunciations: next.length ? next : undefined });
    };

    return (
        <div
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
                <theme.Select
                    label={t("providers:gladia.customVocabularyItemType")}
                    values={[row.kind]}
                    valueTitle={
                        row.kind === "string"
                            ? t("providers:gladia.customVocabularyItemTypeString")
                            : t("providers:gladia.customVocabularyItemTypeObject")
                    }
                    options={[
                        {
                            value: "string",
                            label: t("providers:gladia.customVocabularyItemTypeString"),
                        },
                        {
                            value: "object",
                            label: t("providers:gladia.customVocabularyItemTypeObject"),
                        },
                    ]}
                    onChange={(val: string) => {
                        if (val === "string") {
                            onChange({ kind: "string", value: row.value });
                        } else {
                            onChange({
                                kind: "object",
                                value: row.value,
                                intensity: row.intensity,
                                pronunciations: row.pronunciations,
                                language: row.language,
                            });
                        }
                    }}
                >
                    <option value="string">
                        {t("providers:gladia.customVocabularyItemTypeString")}
                    </option>
                    <option value="object">
                        {t("providers:gladia.customVocabularyItemTypeObject")}
                    </option>
                </theme.Select>

                <theme.Button
                    icon="delete"
                    size="small"
                    title={t("delete")}
                    variant="danger"
                    onClick={onRemove}
                />
            </div>

            <theme.Input
                id={`${idPrefix}-value`}
                label={t("providers:gladia.customVocabularyValue")}
                placeholder="e.g. Gladia"
                value={row.value}
                onChange={(e: any) =>
                    onChange({ ...row, value: String(e?.target?.value ?? "") })
                }
            />

            {row.kind === "object" && (
                <>
                    <theme.Input
                        id={`${idPrefix}-intensity`}
                        label={t("providers:gladia.customVocabularyIntensity")}
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={row.intensity ?? ""}
                        onChange={(e: any) =>
                            onChange({
                                ...row,
                                intensity: parseOptionalNumber(e?.target?.value),
                            })
                        }
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div>
                            <theme.Input
                                id={`${idPrefix}-pronunciations`}
                                label={t("providers:gladia.customVocabularyPronunciations")}
                                placeholder="e.g. Nightz Watch"
                                value={newPronunciation}
                                onChange={(e: any) =>
                                    setNewPronunciation(e?.target?.value ?? "")
                                }
                                onKeyDown={(e: any) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addPronunciation();
                                    }
                                }}
                            />
                            <theme.Button
                                icon="add"
                                size="small"
                                title={t("add")}
                                variant="informative"
                                disabled={!normalizeListItem(newPronunciation)}
                                onClick={addPronunciation}
                            />
                        </div>
                        {pronunciations.length > 0 && (
                            <theme.Tags
                                size="small"
                                items={toTagItems(pronunciations)}
                                onRemove={removePronunciation}
                            />
                        )}
                    </div>

                    <theme.Select
                        label={t("providers:gladia.customVocabularyLanguage")}
                        values={[row.language ?? ""]}
                        valueTitle={
                            languageOptions.find((o) => o.value === (row.language ?? ""))
                                ?.label
                        }
                        options={languageOptions}
                        onChange={(val: string) =>
                            onChange({
                                ...row,
                                language: val?.trim() ? val : undefined,
                            })
                        }
                    >
                        {languageOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </>
            )}
        </div>
    );
};