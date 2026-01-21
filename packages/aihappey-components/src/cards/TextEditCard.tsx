import type { TextUIPart } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTranslation } from "aihappey-i18n";

export type TextEditCardProps = {
    part: TextUIPart;
    onDelete?: () => void;
};

export const TextEditCard = ({ part, onDelete }: TextEditCardProps) => {
    const { Card, Button } = useTheme();
    const { t } = useTranslation();
    return (
        <Card
            size="small"
            title={t(part.type)}
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
            <LimitedTextField text={part.text} rows={3} />
        </Card>
    );
};

