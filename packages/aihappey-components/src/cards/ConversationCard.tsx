import { LimitedTextField } from "../fields";
import { useTheme } from "../theme/ThemeContext";

export type ConversationCardProps = {
    title: string;
    subtitle?: string;
    snippet?: string;
    headerActions?: JSX.Element;
    actions?: JSX.Element;
};

/**
 * Small reusable card for displaying a conversation search result.
 *
 * Lives in aihappey-components so it can be used from core features.
 */
export const ConversationCard = ({
    title,
    subtitle,
    snippet,
    headerActions,
    actions,
}: ConversationCardProps) => {
    const { Card } = useTheme();

    const description = [subtitle, snippet].filter(Boolean).join(": ");

    return (
        <Card
            size="small"
            title={title}
            headerActions={headerActions}
            actions={actions}>
            <LimitedTextField text={description} />
        </Card>
    );
};
