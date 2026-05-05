import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const SEARCH_CONTEXT_SIZE_OPTIONS = ["low", "medium", "high"] as const;
const SAFESEARCH_OPTIONS = ["off", "moderate", "strict"] as const;

const DEFAULT_WEB_SEARCH_OPTIONS = {
    search_context_size: "medium",
};

const normalizeOptionalString = (value: unknown) => {
    const trimmed = String(value ?? "").trim();
    return trimmed ? trimmed : undefined;
};

const parseOptionalInteger = (value: unknown) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return undefined;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const normalizeApproximateLocation = (approximate: any) => {
    const nextApproximate = {
        city: normalizeOptionalString(approximate?.city),
        country: normalizeOptionalString(approximate?.country),
        region: normalizeOptionalString(approximate?.region),
        timezone: normalizeOptionalString(approximate?.timezone),
    };

    const hasLocation = Object.values(nextApproximate).some(Boolean);

    return hasLocation
        ? {
            type: "approximate",
            approximate: nextApproximate,
        }
        : undefined;
};

export const BraveChatConfigForm = ({
    config,
    updateConfig,
}: {
    config: any;
    updateConfig: (val: any) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const webSearchOptionsOn = !!config?.web_search_options;
    const webSearchOptions = config?.web_search_options ?? DEFAULT_WEB_SEARCH_OPTIONS;
    const approximateLocation = webSearchOptions?.user_location?.approximate ?? {};

    const searchContextSize =
        webSearchOptions?.search_context_size ??
        DEFAULT_WEB_SEARCH_OPTIONS.search_context_size;
    const searchContextIndex = Math.max(
        0,
        SEARCH_CONTEXT_SIZE_OPTIONS.indexOf(
            searchContextSize as (typeof SEARCH_CONTEXT_SIZE_OPTIONS)[number]
        )
    );

    const safesearchOptions = [
        { value: "", label: t("providers:brave.notSet") },
        ...SAFESEARCH_OPTIONS.map((value) => ({
            value,
            label: t(`providers:brave.safesearchOptions.${value}`),
        })),
    ];

    const updateOptionalRootString = (key: string, value: unknown) => {
        updateConfig({
            ...config,
            [key]: normalizeOptionalString(value),
        });
    };

    const updateOptionalRootInteger = (key: string, value: unknown) => {
        updateConfig({
            ...config,
            [key]: parseOptionalInteger(value),
        });
    };

    const updateWebSearchOptions = (patch: any) => {
        updateConfig({
            ...config,
            web_search_options: {
                ...(config?.web_search_options ?? DEFAULT_WEB_SEARCH_OPTIONS),
                ...patch,
            },
        });
    };

    const updateApproximateLocation = (patch: any) => {
        const nextUserLocation = normalizeApproximateLocation({
            ...approximateLocation,
            ...patch,
        });

        updateWebSearchOptions({
            user_location: nextUserLocation,
        });
    };

    const twoColumnGrid = {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        width: "100%",
        alignItems: "end",
    } as const;

    const fullWidthField = {
        width: "100%",
        minWidth: 0,
    } as const;


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={twoColumnGrid}>
                        <theme.Input
                            label={"Seed"}
                            type="number"
                            style={{ flex: "1 1 140px" }}
                            value={config?.seed ?? ""}
                            onChange={(e: any) => updateOptionalRootInteger("seed", e.target.value)}
                        />

                        <theme.Select
                            label={t("providers:brave.safesearch")}
                            style={{ flex: "1 1 160px" }}
                            values={[config?.safesearch ?? ""]}
                            valueTitle={safesearchOptions.find((a) => a.value === (config?.safesearch ?? ""))?.label}
                            options={safesearchOptions}
                            onChange={(val: string) => updateOptionalRootString("safesearch", val)}
                        >
                            {safesearchOptions.map((option) => (
                                <option key={option.value || "unset"} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </theme.Select>
                    </div>

                    <div style={twoColumnGrid}>
                        <theme.Input
                            label={t("country")}
                            placeholder="us"
                            style={{ flex: "1 1 140px" }}
                            value={config?.country ?? ""}
                            onChange={(e: any) => updateOptionalRootString("country", e.target.value)}
                        />

                        <theme.Input
                            label={t("language")}
                            placeholder="en"
                            style={{ flex: "1 1 140px" }}
                            value={config?.language ?? ""}
                            onChange={(e: any) => updateOptionalRootString("language", e.target.value)}
                        />
                    </div>
                </div>
            </theme.Card>

            <theme.Card
                size="small"
                title={t("webSearch")}
                headerActions={
                    <theme.Switch
                        id="braveWebSearchOptions"
                        checked={webSearchOptionsOn}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                web_search_options: val ? { ...DEFAULT_WEB_SEARCH_OPTIONS } : undefined,
                            })
                        }
                    />
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Slider
                        label={`${t("searchContextSize", "Search context size")} (${t(searchContextSize)})`}
                        disabled={!webSearchOptionsOn}
                        min={0}
                        max={SEARCH_CONTEXT_SIZE_OPTIONS.length - 1}
                        step={1}
                        value={searchContextIndex}
                        onChange={(value: number) =>
                            updateWebSearchOptions({
                                search_context_size:
                                    SEARCH_CONTEXT_SIZE_OPTIONS[value] ?? DEFAULT_WEB_SEARCH_OPTIONS.search_context_size,
                            })
                        }
                    />

                    <div style={twoColumnGrid}>
                        <theme.Input
                            label={t("city")}
                            placeholder="Amsterdam"
                            disabled={!webSearchOptionsOn}
                            style={{ flex: "1 1 160px" }}
                            value={approximateLocation?.city ?? ""}
                            onChange={(e: any) => updateApproximateLocation({ city: e.target.value })}
                        />

                        <theme.Input
                            label={t("country")}
                            placeholder="NL"
                            disabled={!webSearchOptionsOn}
                            style={{ flex: "1 1 120px" }}
                            value={approximateLocation?.country ?? ""}
                            onChange={(e: any) => updateApproximateLocation({ country: e.target.value })}
                        />
                    </div>

                    <div style={twoColumnGrid}>
                        <theme.Input
                            label={t("region")}
                            placeholder="Noord-Holland"
                            disabled={!webSearchOptionsOn}
                            style={{ flex: "1 1 160px" }}
                            value={approximateLocation?.region ?? ""}
                            onChange={(e: any) => updateApproximateLocation({ region: e.target.value })}
                        />

                        <theme.Input
                            label={t("timezone")}
                            placeholder="Europe/Amsterdam"
                            disabled={!webSearchOptionsOn}
                            style={{ flex: "1 1 180px" }}
                            value={approximateLocation?.timezone ?? ""}
                            onChange={(e: any) => updateApproximateLocation({ timezone: e.target.value })}
                        />
                    </div>
                </div>
            </theme.Card>

            <theme.Card size="small" title={t("providers:brave.answerEnrichment")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <theme.Switch
                        id="braveEnableEntities"
                        label={t("providers:brave.enableEntities")}
                        checked={!!config?.enable_entities}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                enable_entities: value,
                            })
                        }
                    />

                    <theme.Switch
                        id="braveEnableCitations"
                        label={t("providers:brave.enableCitations")}
                        checked={!!config?.enable_citations}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                enable_citations: value,
                            })
                        }
                    />
                </div>
            </theme.Card>

            <theme.Card
                size="small"
                title={t("providers:brave.research")}
                headerActions={
                    <theme.Switch
                        id="braveEnableResearch"
                        checked={!!config?.enable_research}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                enable_research: value,
                            })
                        }
                    />
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Switch
                        id="braveResearchAllowThinking"
                        label={t("providers:brave.researchAllowThinking")}
                        disabled={!config?.enable_research}
                        checked={!!config?.research_allow_thinking}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                research_allow_thinking: value,
                            })
                        }
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                        <theme.Input
                            label={t("providers:brave.researchMaximumNumberOfTokensPerQuery")}
                            type="number"
                            disabled={!config?.enable_research}
                            value={config?.research_maximum_number_of_tokens_per_query ?? ""}
                            onChange={(e: any) => updateOptionalRootInteger("research_maximum_number_of_tokens_per_query", e.target.value)}
                        />
                        <theme.Input
                            label={t("providers:brave.researchMaximumNumberOfQueries")}
                            type="number"
                            disabled={!config?.enable_research}
                            value={config?.research_maximum_number_of_queries ?? ""}
                            onChange={(e: any) => updateOptionalRootInteger("research_maximum_number_of_queries", e.target.value)}
                        />
                        <theme.Input
                            label={t("providers:brave.researchMaximumNumberOfIterations")}
                            type="number"
                            disabled={!config?.enable_research}
                            value={config?.research_maximum_number_of_iterations ?? ""}
                            onChange={(e: any) => updateOptionalRootInteger("research_maximum_number_of_iterations", e.target.value)}
                        />
                        <theme.Input
                            label={t("providers:brave.researchMaximumNumberOfSeconds")}
                            type="number"
                            disabled={!config?.enable_research}
                            value={config?.research_maximum_number_of_seconds ?? ""}
                            onChange={(e: any) => updateOptionalRootInteger("research_maximum_number_of_seconds", e.target.value)}
                        />
                        <theme.Input
                            label={t("providers:brave.researchMaximumNumberOfResultsPerQuery")}
                            type="number"
                            disabled={!config?.enable_research}
                            value={config?.research_maximum_number_of_results_per_query ?? ""}
                            onChange={(e: any) => updateOptionalRootInteger("research_maximum_number_of_results_per_query", e.target.value)}
                        />
                    </div>
                </div>
            </theme.Card>
        </div>
    );
};

