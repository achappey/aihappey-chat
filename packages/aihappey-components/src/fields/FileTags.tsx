import { useTheme } from "../theme/ThemeContext";
import { IconToken, TagItem } from "aihappey-types";

type FileTagsProps = {
    files: File[];
    icon?: IconToken
    size?: "small" | "extra-small" | "medium" | undefined
    removeFile?: (name: string) => Promise<void> | void;
};

export const FileTags = ({ files, removeFile, size, icon = 'attachment'}: FileTagsProps) => {
    const { Tags } = useTheme();

    const tagItems: TagItem[] = files.map((file) => ({
        key: file.name,
        icon: icon,
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
