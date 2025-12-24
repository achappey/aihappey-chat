import { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { TagItem } from "aihappey-types";

type ModelContextCatalogSettings = {
    quickSearches: string[];
};

type ModelContextCatalogSettingsFormProps = {
    value: ModelContextCatalogSettings;
    onAdd: (tag: string) => void;
    onRemove: (tag: string) => void;
    translations?: {
        label?: string;
        placeholder?: string;
        add?: string;
    };
};

export const ModelContextCatalogSettingsForm = ({
    value,
    onAdd,
    onRemove,
    translations,
}: ModelContextCatalogSettingsFormProps) => {
    const { Tags, Input, Button } = useTheme();
    const [newTag, setNewTag] = useState<string>("");

    const items: TagItem[] =
        value.quickSearches?.map(q => ({ key: q, label: q })) ?? [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div>
                <Input
                    value={newTag}
                    label={translations?.label}
                    placeholder={translations?.placeholder}
                    onChange={(e) => setNewTag(e.target.value)}
                />
                <Button
                    icon="add"
                    size="small"
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
