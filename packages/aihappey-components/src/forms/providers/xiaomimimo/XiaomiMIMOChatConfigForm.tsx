import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const THINKING_TYPES = ["enabled", "disabled"] as const;

type ThinkingType = (typeof THINKING_TYPES)[number];
type AudioFormat = "wav" | "mp3" | "pcm" | "pcm16";

export type XiaomiMIMOWebSearchTool = {
    type: "web_search";
    force_search?: string;
    max_keyword?: number;
    limit?: number;
    user_location?: {
        type: "approximate";
        country?: string;
        region?: string;
        city?: string;
        district?: string;
        longitude?: number;
        latitude?: number;
    };
};

export type XiaomiMIMOChatConfig = {
    thinking?: {
        type: ThinkingType;
    };
    audio?: {
        format?: AudioFormat;
        optimize_text_preview?: boolean;
        voice?: string;
    };
    tools?: XiaomiMIMOWebSearchTool[];
};

const DEFAULT_THINKING: NonNullable<XiaomiMIMOChatConfig["thinking"]> = {
    type: "enabled",
};

const DEFAULT_WEB_SEARCH: XiaomiMIMOWebSearchTool = {
    type: "web_search",
    force_search: "false",
    max_keyword: 5,
    limit: 5,
};

const twoColumnGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    width: "100%",
    alignItems: "end",
} as const;

const optionalString = (value: string) => {
    const trimmed = String(value ?? "").trim();
    return trimmed ? trimmed : undefined;
};

const normalizeFloatInput = (value: string) => {
    const raw = String(value ?? "").trim();
    if (!raw) return undefined;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeUserLocation = (loc: any): XiaomiMIMOWebSearchTool["user_location"] => {
    if (!loc) return undefined;

    const country = optionalString(loc.country);
    const region = optionalString(loc.region);
    const city = optionalString(loc.city);
    const district = optionalString(loc.district);
    const longitude = typeof loc.longitude === "number" ? loc.longitude : undefined;
    const latitude = typeof loc.latitude === "number" ? loc.latitude : undefined;

    if (!country && !region && !city && !district && longitude === undefined && latitude === undefined) {
        return undefined;
    }

    return {
        type: "approximate",
        ...(country ? { country } : {}),
        ...(region ? { region } : {}),
        ...(city ? { city } : {}),
        ...(district ? { district } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
        ...(latitude !== undefined ? { latitude } : {}),
    };
};

const getWebSearchTool = (config: XiaomiMIMOChatConfig): XiaomiMIMOWebSearchTool | undefined =>
    Array.isArray(config?.tools)
        ? config.tools.find((tool) => tool?.type === "web_search")
        : undefined;

const setWebSearchTool = (
    config: XiaomiMIMOChatConfig,
    tool: XiaomiMIMOWebSearchTool | undefined
): XiaomiMIMOChatConfig => {
    const otherTools = Array.isArray(config?.tools)
        ? config.tools.filter((item) => item?.type !== "web_search")
        : [];
    const tools = tool ? [...otherTools, tool] : otherTools;

    return {
        ...config,
        tools: tools.length ? tools : undefined,
    };
};

export const XiaomiMIMOChatConfigForm = ({
    config,
    updateConfig,
}: {
    config: XiaomiMIMOChatConfig;
    updateConfig: (val: XiaomiMIMOChatConfig) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const thinkingOn = !!config?.thinking;
    const thinkingType = config?.thinking?.type ?? DEFAULT_THINKING.type;
    const webSearch = getWebSearchTool(config);
    const webSearchOn = !!webSearch;
    const maxKeyword = webSearch?.max_keyword ?? DEFAULT_WEB_SEARCH.max_keyword!;
    const resultLimit = webSearch?.limit ?? DEFAULT_WEB_SEARCH.limit!;
    const userLocation = webSearch?.user_location;

    const updateThinking = (patch: Partial<NonNullable<XiaomiMIMOChatConfig["thinking"]>>) =>
        updateConfig({
            ...config,
            thinking: {
                ...(config?.thinking ?? DEFAULT_THINKING),
                ...patch,
            },
        });

    const updateWebSearch = (patch: Partial<XiaomiMIMOWebSearchTool>) =>
        updateConfig(
            setWebSearchTool(config, {
                ...(webSearch ?? DEFAULT_WEB_SEARCH),
                ...patch,
                type: "web_search",
            })
        );

    const updateUserLocation = (patch: Record<string, any>) =>
        updateWebSearch({
            user_location: normalizeUserLocation({
                ...(userLocation ?? {}),
                ...patch,
            }),
        });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card
                size="small"
                title={t("reasoning")}
                headerActions={
                    <theme.Switch
                        id="xiaomimimo-thinking"
                        checked={thinkingOn}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                thinking: value ? { ...DEFAULT_THINKING } : undefined,
                            })
                        }
                    />
                }
            >
                <div>
                    <theme.Select
                        label={t("type") ?? "Type"}
                        disabled={!thinkingOn}
                        values={[thinkingType]}
                        valueTitle={t(thinkingType)}
                        options={THINKING_TYPES.map((value) => ({
                            value,
                            label: t(value),
                        }))}
                        onChange={(value: string) => updateThinking({ type: value as ThinkingType })}
                    >
                        {THINKING_TYPES.map((value) => (
                            <option key={value} value={value}>
                                {t(value)}
                            </option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>

            <theme.Card
                size="small"
                title={t("webSearch")}
                headerActions={
                    <theme.Switch
                        id="xiaomimimo-web-search"
                        checked={webSearchOn}
                        onChange={(value) =>
                            updateConfig(setWebSearchTool(config, value ? { ...DEFAULT_WEB_SEARCH } : undefined))
                        }
                    />
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <theme.Switch
                            id="xiaomimimo-force-search"
                            disabled={!webSearchOn}
                            checked={(webSearch?.force_search ?? DEFAULT_WEB_SEARCH.force_search) === "true"}
                            label={t("forceSearch")}
                            onChange={(value) => updateWebSearch({ force_search: value ? "true" : "false" })}
                        />
                    </div>

                    <div style={twoColumnGrid}>
                        <theme.Slider
                            id="xiaomimimo-max-keyword"
                            min={1}
                            max={50}
                            step={1}
                            label={`${t("maxKeywords")} (${maxKeyword})`}
                            disabled={!webSearchOn}
                            value={maxKeyword}
                            onChange={(value: number) => updateWebSearch({ max_keyword: value })}
                        />

                        <theme.Slider
                            id="xiaomimimo-web-search-limit"
                            min={1}
                            max={50}
                            step={1}
                            label={`${t("resultLimit")} (${resultLimit})`}
                            disabled={!webSearchOn}
                            value={resultLimit}
                            onChange={(value: number) => updateWebSearch({ limit: value })}
                        />
                    </div>

                    <div style={twoColumnGrid}>
                        <theme.Input
                            label={t("country")}
                            placeholder="NL"
                            disabled={!webSearchOn}
                            value={userLocation?.country ?? ""}
                            onChange={(e: any) => updateUserLocation({ country: e?.target?.value })}
                        />

                        <theme.Input
                            label={t("region")}
                            placeholder="Noord-Holland"
                            disabled={!webSearchOn}
                            value={userLocation?.region ?? ""}
                            onChange={(e: any) => updateUserLocation({ region: e?.target?.value })}
                        />

                        <theme.Input
                            label={t("city")}
                            placeholder="Amsterdam"
                            disabled={!webSearchOn}
                            value={userLocation?.city ?? ""}
                            onChange={(e: any) => updateUserLocation({ city: e?.target?.value })}
                        />

                        <theme.Input
                            label="District"
                            placeholder="Centrum"
                            disabled={!webSearchOn}
                            value={userLocation?.district ?? ""}
                            onChange={(e: any) => updateUserLocation({ district: e?.target?.value })}
                        />

                        <theme.Input
                            label="Longitude"
                            type="number"
                            disabled={!webSearchOn}
                            value={userLocation?.longitude ?? ""}
                            onChange={(e: any) => updateUserLocation({ longitude: normalizeFloatInput(e?.target?.value) })}
                        />

                        <theme.Input
                            label="Latitude"
                            type="number"
                            disabled={!webSearchOn}
                            value={userLocation?.latitude ?? ""}
                            onChange={(e: any) => updateUserLocation({ latitude: normalizeFloatInput(e?.target?.value) })}
                        />
                    </div>
                </div>
            </theme.Card>
        </div>
    );
};

