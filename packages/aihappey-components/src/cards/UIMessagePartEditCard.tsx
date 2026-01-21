import type { UIMessagePart } from "aihappey-ai";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTheme } from "../theme/ThemeContext";
import { ReasoningEditCard } from "./ReasoningEditCard";
import { TextEditCard } from "./TextEditCard";
import { useTranslation } from "aihappey-i18n";

export type UIMessagePartEditCardProps = {
    part: UIMessagePart<any, any>;
    onDelete?: () => void;
};

export const UIMessagePartEditCard = ({ part, onDelete }: UIMessagePartEditCardProps) => {
    const { Card, Button } = useTheme();
    const { t } = useTranslation();

    if (part?.type === "text") {
        return <TextEditCard part={part as any} onDelete={onDelete} />;
    }

    if (part?.type === "reasoning") {
        return <ReasoningEditCard part={part as any} onDelete={onDelete} />;
    }

    // Very small generic card for other part types (tool calls, files, sources, etc.)
    const previewText =
        typeof (part as any)?.text === "string"
            ? (part as any).text
            : typeof (part as any)?.type === "string"
                ? (part as any).type
                : "";

    return (
        <Card
            size="small"
            title={t(String((part as any)?.type))}
            headerActions={
                onDelete ? (
                    <Button
                        variant="subtle"
                        icon={"delete"}
                        title={t('delete')}
                        onClick={onDelete}
                    />
                ) : undefined
            }
        >
            {previewText ? <LimitedTextField text={previewText} rows={3} /> : null}
        </Card>
    );
};

