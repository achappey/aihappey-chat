import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const PerplexityWebSearchCardForm: React.FC<{
    config: any;
    updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const searchModeOptions = [
        { value: "web", label: t("providers:perplexity.web") },
        { value: "academic", label: t("providers:perplexity.academic") },
    ];


    const searchTypeOptions = [
        { value: "auto", label: t("auto") },
        { value: "fast", label: t("providers:perplexity.fast") },
        { value: "pro", label: t("providers:perplexity.pro") },
    ];
    const contextSizeOptions = [
        { value: "low", label: t("low") },
        { value: "medium", label: t("medium") },
        { value: "high", label: t("high") },
    ];

    const webSearchOptions = config?.web_search_options || {};
    const userLocation = webSearchOptions.user_location || {};

    return (
        <theme.Card size="small" title={t("webSearch")}>
            <div>
                <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
                    <theme.Select
                        label={t("searchMode")}
                        style={{ flex: 1 }}
                        values={[config?.search_mode || ""]}
                        valueTitle={
                            searchModeOptions.find((a) => a.value === config?.search_mode)?.label
                        }
                        options={searchModeOptions}
                        onChange={(val: string) => updateConfig({ ...config, search_mode: val })}
                    >
                        {searchModeOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t("providers:perplexity.searchType")}
                        style={{ flex: 1 }}
                        values={[config?.web_search_options?.search_type || ""]}
                        valueTitle={
                            searchTypeOptions.find((a) => a.value === config?.web_search_options?.search_type)?.label
                        }
                        options={searchTypeOptions}
                        onChange={(val: string) => updateConfig({
                            ...config,
                            web_search_options: {
                                ...webSearchOptions,
                                search_type: val,
                                user_location: userLocation,
                            },
                        })}
                    >
                        {searchTypeOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </div>

                <theme.Select
                    label={t("searchContextSize")}
                    disabled={!config?.web_search_options}
                    values={[webSearchOptions.search_context_size || ""]}
                    valueTitle={
                        contextSizeOptions.find(
                            (a) => a.value === webSearchOptions.search_context_size
                        )?.label
                    }
                    options={contextSizeOptions}
                    onChange={(val: string) =>
                        updateConfig({
                            ...config,
                            web_search_options: {
                                ...webSearchOptions,
                                search_context_size: val,
                                user_location: userLocation,
                            },
                        })
                    }
                >
                    {contextSizeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <div style={{ display: "flex", gap: 12 }}>
                    <theme.Input
                        label={t("latitude")}
                        type="number"
                        disabled={!config?.web_search_options}
                        style={{ minWidth: 70 }}
                        value={userLocation.latitude ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                web_search_options: {
                                    ...webSearchOptions,
                                    user_location: {
                                        ...userLocation,
                                        latitude: e.target.value,
                                    },
                                },
                            })
                        }
                    />
                    <theme.Input
                        label={t("longitude")}
                        type="number"
                        disabled={!config?.web_search_options}
                        style={{ minWidth: 70 }}
                        value={userLocation.longitude ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                web_search_options: {
                                    ...webSearchOptions,
                                    user_location: {
                                        ...userLocation,
                                        longitude: e.target.value,
                                    },
                                },
                            })
                        }
                    />
                    <theme.Input
                        label={t("country")}
                        disabled={!config?.web_search_options}
                        style={{ minWidth: 70 }}
                        value={userLocation.country ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                web_search_options: {
                                    ...webSearchOptions,
                                    user_location: {
                                        ...userLocation,
                                        country: e.target.value,
                                    },
                                },
                            })
                        }
                    />
                </div>

                <theme.Switch
                    id="image_search_relevance_enhanced"
                    label={t("providers:perplexity.improveImageRelevance")}
                    checked={!!config?.web_search_options?.image_search_relevance_enhanced}
                    onChange={(val) =>
                        updateConfig({
                            ...config,
                            web_search_options: {
                                ...webSearchOptions,
                                image_search_relevance_enhanced: val,
                            },
                        })
                    }
                />
            </div>
        </theme.Card>
    );
};

