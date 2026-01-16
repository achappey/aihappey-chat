import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type StringListEditorProps = {
    label: string;
    placeholder?: string;
    items: string[];
    onChange: (next: string[]) => void;
    addLabel?: string;
    idPrefix: string;
};

type CustomSpellingEditorProps = {
    entries: { term: string; variants: string[] }[];
    onChange: (next: { term: string; variants: string[] }[]) => void;
    idPrefix: string;
};

type CustomSpellingCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    normalizeList: (val: unknown) => string[];
    normalizeListItem: (s: string) => string;
    CustomSpellingEditor: React.FC<CustomSpellingEditorProps>;
    StringListEditor: React.FC<StringListEditorProps>;
};

export const GladiaCustomSpellingCardForm: React.FC<CustomSpellingCardProps> = ({
    config,
    updateConfig,
    normalizeList,
    normalizeListItem,
    CustomSpellingEditor,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const customSpellingEntries = useMemo(() => {
        const dict = config?.custom_spelling_config?.spelling_dictionary ?? {};
        return Object.entries(dict).map(([term, variants]) => ({
            term,
            variants: normalizeList(variants),
        }));
    }, [config?.custom_spelling_config?.spelling_dictionary, normalizeList]);

    const [spellingEntries, setSpellingEntries] = useState(customSpellingEntries);

    useEffect(() => {
        setSpellingEntries(customSpellingEntries);
    }, [customSpellingEntries]);

    const updateSpellingEntries = (nextEntries: { term: string; variants: string[] }[]) => {
        setSpellingEntries(nextEntries);
        const nextDict = Object.fromEntries(
            nextEntries
                .map((entry) => ({
                    term: normalizeListItem(entry.term),
                    variants: normalizeList(entry.variants),
                }))
                .filter((entry) => entry.term.length)
                .map((entry) => [entry.term, entry.variants])
        );
        updateConfig({
            ...config,
            custom_spelling_config: {
                spelling_dictionary: nextDict,
            },
        });
    };

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.customSpelling")}
            headerActions={
                <theme.Switch
                    id="gladia-custom-spelling"
                    checked={config?.custom_spelling ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            custom_spelling: enabled,
                            custom_spelling_config: enabled
                                ? config?.custom_spelling_config ?? { spelling_dictionary: {} }
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.custom_spelling ? (
                <CustomSpellingEditor
                    idPrefix="gladia-custom-spelling"
                    entries={spellingEntries}
                    onChange={updateSpellingEntries}
                />
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.customSpellingHint")}
                </div>
            )}
        </theme.Card>
    );
};
