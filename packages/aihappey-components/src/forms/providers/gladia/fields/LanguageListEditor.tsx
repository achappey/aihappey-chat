import { useTranslation } from "aihappey-i18n";
import { useMemo, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { normalizeList, normalizeListItem } from "../../minimax/cards/shared";
import { toTagItems } from "../GladiaTranscriptionConfigForm";

export const LanguageListEditor: React.FC<{
    label: string;
    items: string[];
    onChange: (next: string[]) => void;
    idPrefix: string;
    options: { value: string; label: string }[];
}> = ({ label, items, onChange, idPrefix, options }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const normalizedItems = useMemo(() => normalizeList(items), [items]);
    const [selected, setSelected] = useState<string>("");

    const addItem = () => {
        const n = normalizeListItem(selected);
        if (!n) return;
        onChange(normalizeList([...normalizedItems, n]));
        setSelected("");
    };

    const removeItem = (item: string) => {
        const key = normalizeListItem(item).toLowerCase();
        const next = normalizedItems.filter(
            (x) => normalizeListItem(x).toLowerCase() !== key
        );
        onChange(next);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
                <theme.Select
                    label={label}
                    values={[selected]}
                    valueTitle={options.find((o) => o.value === selected)?.label}
                    options={options}
                    onChange={(val: string) => setSelected(val)}
                >
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>
                <theme.Button
                    icon="add"
                    size="small"
                    title={t("add")}
                    variant="informative"
                    disabled={!normalizeListItem(selected)}
                    onClick={addItem}
                />
            </div>
            {normalizedItems.length > 0 && (
                <theme.Tags size="small" items={toTagItems(normalizedItems)} onRemove={removeItem} />
            )}
        </div>
    );
};

