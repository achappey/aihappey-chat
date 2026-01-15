import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type ContextProgressBarProps = {
    context_window?: number;
    tokenUsage?: number;
    locale?: string
    max_output_tokens?: number;
};

export const ContextProgressBar = ({ context_window, tokenUsage, max_output_tokens }: ContextProgressBarProps) => {
    const { ProgressBar } = useTheme();
    const { i18n, t } = useTranslation();

    if (!context_window)
        return undefined;

    const value = tokenUsage ? tokenUsage / context_window : 0;

    const fmt = new Intl.NumberFormat(i18n.language, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1
    });

    const tokensUsed = t('tokensUsed', {
        usedTokens: fmt.format(tokenUsage ?? 0),
        totalTokens: fmt.format(context_window)
    });

    const toolTip = max_output_tokens ? <>
        <div>{tokensUsed}</div>
        <div>{t('tokensReserved', {
            max_output_tokens: fmt.format(max_output_tokens)
        })}</div>
        <div>{t('tokensAvailable', {
            availableSpace: fmt.format(context_window - max_output_tokens - (tokenUsage ?? 0))
        })}</div>
    </>
        : <>{tokensUsed}</>;

    return (
        <ProgressBar tooltipContent={toolTip}
            label={`${fmt.format(tokenUsage ?? 0)}/${fmt.format(context_window)}`}
            value={value} />
    );
};
