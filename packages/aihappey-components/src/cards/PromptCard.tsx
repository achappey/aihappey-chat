import { useCopyToClipboard, useDarkMode } from "usehooks-ts";
import { useTheme } from "../theme/ThemeContext";

export type PromptIcon = { theme?: string; src: string };

export type PromptCardBasePrompt = {
    name: string;
    title?: string;
    description?: string;
    text?: string;
    icons?: PromptIcon[];
};

export type PromptCardTranslations = {
    newWindow?: string;
    copyLink?: string;
};

export type PromptCardProps<TPrompt extends PromptCardBasePrompt = PromptCardBasePrompt> = {
    prompt: TPrompt;
    onSelect?: () => void;
    /** If provided, enables Open/Copy actions. */
    getPromptUrl?: (prompt: TPrompt) => string;
    translations?: PromptCardTranslations;
};

export const PromptCard = <TPrompt extends PromptCardBasePrompt = PromptCardBasePrompt>({
    prompt,
    onSelect,
    getPromptUrl,
    translations,
}: PromptCardProps<TPrompt>) => {
    const { Card, Button, Image } = useTheme();
    const [, copyToClipboard] = useCopyToClipboard();
    const isDarkMode = useDarkMode();

    const icon =
        prompt?.icons?.find((i) => i.theme === (isDarkMode ? "dark" : "light"))?.src ??
        prompt?.icons?.[0]?.src;

    const image = icon ? (
        <Image src={icon} height={32} shape="square" />
    ) : undefined;

    const url = getPromptUrl ? getPromptUrl(prompt) : undefined;
    const showLinkActions = !!url;

    return (
        <Card
            title={prompt.title ?? prompt.name}
            image={image}
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
                                title={translations?.newWindow}
                                icon="openLink"
                                size="small"
                            />
                            <Button
                                onClick={() => copyToClipboard(url!)}
                                variant="transparent"
                                title={translations?.copyLink}
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

