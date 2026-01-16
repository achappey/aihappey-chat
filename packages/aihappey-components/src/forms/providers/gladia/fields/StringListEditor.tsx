import { useTranslation } from "aihappey-i18n";
import { useState, useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { normalizeList, normalizeListItem } from "../../minimax/cards/shared";
import { toTagItems } from "../GladiaTranscriptionConfigForm";

export const StringListEditor: React.FC<{
    label: string;
    placeholder?: string;
    items: string[];
    onChange: (next: string[]) => void;
    addLabel?: string;
    idPrefix: string;
}> = ({ label, placeholder, items, onChange, addLabel, idPrefix }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const [draft, setDraft] = useState<string>("");
    const normalizedItems = useMemo(() => normalizeList(items), [items]);

    const addItem = () => {
        const n = normalizeListItem(draft);
        if (!n) return;
        onChange(normalizeList([...normalizedItems, n]));
        setDraft("");
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
                <theme.Input
                    id={`${idPrefix}-input`}
                    label={label}
                    placeholder={placeholder}
                    value={draft}
                    onChange={(e: any) => setDraft(e?.target?.value ?? "")}
                    onKeyDown={(e: any) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addItem();
                        }
                    }}
                />
                <theme.Button
                    icon="add"
                    size="small"
                    title={addLabel ?? t("add")}
                    variant="informative"
                    disabled={!normalizeListItem(draft)}
                    onClick={addItem}
                />
            </div>
            {normalizedItems.length > 0 && (
                <theme.Tags size="small" items={toTagItems(normalizedItems)} onRemove={removeItem} />
            )}
        </div>
    );
};
