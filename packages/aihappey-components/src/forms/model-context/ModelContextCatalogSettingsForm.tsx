import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { TagItem } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";

type ModelContextCatalogSettings = {
    quickSearches: string[];
};

type ModelContextCatalogSettingsFormProps = {
    value: ModelContextCatalogSettings;
    onAdd: (tag: string) => void;
    onRemove: (tag: string) => void;
};

export const ModelContextCatalogSettingsForm = ({
    value,
    onAdd,
    onRemove,
}: ModelContextCatalogSettingsFormProps) => {
    const { Tags, Input, Button } = useTheme();
    const [newTag, setNewTag] = useState<string>("");
    const { t } = useTranslation()

    const items: TagItem[] =
        value.quickSearches?.map(q => ({ key: q, label: q })) ?? [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
                <Input
                    value={newTag}
                    label={t("quickSearch")}
                    placeholder={t("addQuickSearch")}
                    onChange={(e) => setNewTag(e.target.value)}
                />
                <Button
                    icon="add"
                    size="small"
                    title={t("add")}
                    variant="informative"
                    disabled={!newTag}
                    onClick={() => {
                        onAdd(newTag);
                        setNewTag("");
                    }}
                />
            </div>

            {items.length > 0 && (
                <Tags
                    size="small"
                    items={items}
                    onRemove={onRemove}
                />
            )}
        </div>
    );
};
