import { useCopyToClipboard } from "usehooks-ts";
import { useTheme } from "../theme/ThemeContext";
import { CapabilityIcon } from "../images";
import { useTranslation } from "aihappey-i18n";

export type PromptIcon = { theme?: string; src: string };

export type PromptCardBasePrompt = {
    name: string;
    title?: string;
    description?: string;
    text?: string;
    icons?: PromptIcon[];
};

export type PromptCardProps<TPrompt extends PromptCardBasePrompt = PromptCardBasePrompt> = {
    prompt: TPrompt;
    onSelect?: () => void;
    /** If provided, enables Open/Copy actions. */
    getPromptUrl?: (prompt: TPrompt) => string;
};

export const PromptCard = <TPrompt extends PromptCardBasePrompt = PromptCardBasePrompt>({
    prompt,
    onSelect,
    getPromptUrl,
}: PromptCardProps<TPrompt>) => {
    const { Card, Button } = useTheme();
    const [, copyToClipboard] = useCopyToClipboard();
    const url = getPromptUrl ? getPromptUrl(prompt) : undefined;
    const showLinkActions = !!url;
    const { t } = useTranslation();

    return (
        <Card
            title={prompt.title ?? prompt.name}
            image={<CapabilityIcon icons={prompt?.icons} />}
            size="small"
            actions={
                <>
                    {onSelect && (
                        <Button
                            onClick={onSelect}
                            variant="transparent"
                            icon="add"
                            size="small"
                        />
                    )}

                    {showLinkActions && (
                        <>
                            <Button
                                rel="noopener noreferrer"
                                variant="transparent"
                                onClick={() => window.open(url!, "_blank")}
                                title={t("newWindow")}
                                icon="openLink"
                                size="small"
                            />
                            <Button
                                onClick={() => copyToClipboard(url!)}
                                variant="transparent"
                                title={t("copyClipboard")}
                                icon="copyClipboard"
                                size="small"
                            />
                        </>
                    )}
                </>
            }
        >
            {prompt.description || prompt.text}
        </Card>
    );
};

