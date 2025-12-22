import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { TagItem } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";

export const ModelContextCatalogSettings = () => {
    const { Tags, Input, Button } = useTheme();
    const quickSearches = useAppStore(s => s.quickSearches);
    const removeQuickSearchTag = useAppStore(s => s.deleteQuickSearch);
    const addQuickSearch = useAppStore(s => s.addQuickSearch);
    const [newTag, setNewTag] = useState<string | undefined>(undefined)
    const { t } = useTranslation()
    const quickSearchTagItems: TagItem[] = quickSearches?.map(q => ({
        key: q,
        label: q,
    })) ?? [];

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div>
                <Input value={newTag ?? ""}
                    placeholder={t('addQuickSearch')}
                    label={t('quickSearch')}
                    onChange={(a) => setNewTag(a.target.value)} />

                <Button icon="add"
                    disabled={!newTag}
                    variant="informative"
                    size="small"
                    onClick={() => {
                        if (newTag) {
                            addQuickSearch(newTag)
                            setNewTag(undefined)
                        }
                    }} />
            </div>

            {quickSearchTagItems.length > 0 && (
                <div style={{ marginTop: 6 }}>
                    <Tags
                        size="small"
                        items={quickSearchTagItems}
                        onRemove={removeQuickSearchTag}
                    />
                </div>
            )}


        </div>
    );
};