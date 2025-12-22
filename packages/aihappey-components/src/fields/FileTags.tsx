import { useTheme } from "../theme/ThemeContext";
import { TagItem } from "aihappey-types";

type FileTagsProps = {
    files: File[];
    size?: "small" | "extra-small" | "medium" | undefined
    removeFile?: (name: string) => Promise<void> | void;
};

export const FileTags = ({ files, removeFile, size}: FileTagsProps) => {
    const { Tags } = useTheme();

    const tagItems: TagItem[] = files.map((file) => ({
        key: file.name,
        icon: 'attachment',
        label: file.name,
    }));

    return (
        <Tags
            items={tagItems}
            size={size ?? "small"}
            onRemove={removeFile}
        />
    );
};
