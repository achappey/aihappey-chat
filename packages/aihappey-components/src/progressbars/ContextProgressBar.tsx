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

    if (!Number.isFinite(context_window) || !context_window || context_window <= 0)
        return undefined;

    const used = Number.isFinite(tokenUsage) ? Math.max(0, tokenUsage ?? 0) : 0;
    const reserved = Number.isFinite(max_output_tokens) ? Math.max(0, max_output_tokens ?? 0) : 0;
    // Theme progress bars use percentages, not a 0–1 ratio.
    const value = Math.min(100, (used / context_window) * 100);

    const fmt = new Intl.NumberFormat(i18n.language, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1
    });

    const tokensUsed = t('tokensUsed', {
        usedTokens: fmt.format(used),
        totalTokens: fmt.format(context_window)
    });

    const toolTip = reserved ? <>
        <div>{tokensUsed}</div>
        <div>{t('tokensReserved', {
            max_output_tokens: fmt.format(reserved)
        })}</div>
        <div>{t('tokensAvailable', {
            availableSpace: fmt.format(Math.max(0, context_window - reserved - used))
        })}</div>
    </>
        : <>{tokensUsed}</>;

    return (
        <ProgressBar tooltipContent={toolTip}
            label={`${fmt.format(used)}/${fmt.format(context_window)}`}
            value={value} />
    );
};
