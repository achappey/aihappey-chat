import { useTranslation } from "aihappey-i18n";
import React, { useMemo, useState } from "react";
import type { TagItem } from "aihappey-types";
import { useTheme } from "../../../../theme/ThemeContext";
import { normalizeList, normalizeListItem } from "./shared";

const toTagItems = (items: string[]): TagItem[] => items.map((x) => ({ key: x, label: x }));

export const StringListEditor: React.FC<{
  idPrefix: string;
  label: string;
  placeholder?: string;
  addLabel?: string;
  items: string[];
  onChange: (next: string[]) => void;
  maxItems?: number;
}> = ({ idPrefix, label, placeholder, addLabel, items, onChange, maxItems }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const normalizedItems = useMemo(() => normalizeList(items), [items]);
  const [draft, setDraft] = useState<string>("");

  const atMax = typeof maxItems === "number" && normalizedItems.length >= maxItems;

  const addItem = () => {
    if (atMax) return;
    const n = normalizeListItem(draft);
    if (!n) return;
    onChange(normalizeList([...normalizedItems, n]));
    setDraft("");
  };

  const removeItem = (item: string) => {
    const key = normalizeListItem(item).toLowerCase();
    const next = normalizedItems.filter((x) => normalizeListItem(x).toLowerCase() !== key);
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div>
        <theme.Input
          id={`${idPrefix}-input`}
          label={label}
          placeholder={placeholder}
          disabled={atMax}
          value={draft}
          onChange={(e: any) => setDraft(String(e?.target?.value ?? ""))}
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
          disabled={!normalizeListItem(draft) || atMax}
          onClick={addItem}
        />
      </div>

      {normalizedItems.length > 0 && (
        <theme.Tags size="small" items={toTagItems(normalizedItems)} onRemove={removeItem} />
      )}
    </div>
  );
};

