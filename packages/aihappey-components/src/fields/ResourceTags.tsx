import type { ReadResourceResult, Resource } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";
import { TagItem } from "aihappey-types";

type ResourceTagsProps = {
    size?: "small" | "extra-small" | "medium" | undefined
    resources: [Resource, ReadResourceResult][]
    removeResource?: (id: string) => Promise<void> | void
};

export const ResourceTags = ({
    resources,
    size,
    removeResource
}: ResourceTagsProps) => {
    const { Tags } = useTheme();

    const tagItems: TagItem[] = resources.map(a => ({
        key: a[0].uri,
        icon: 'resources',
        label: a[0].name
    }))

    return <Tags
        items={tagItems}
        size={size ?? "small"}
        onRemove={removeResource}
    />;
};
