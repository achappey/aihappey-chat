import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const THINKING_TYPES = ["enabled", "disabled"] as const;
const AUDIO_FORMATS = ["wav", "mp3", "pcm", "pcm16"] as const;

type ThinkingType = (typeof THINKING_TYPES)[number];
type AudioFormat = (typeof AUDIO_FORMATS)[number];

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

const DEFAULT_AUDIO: NonNullable<XiaomiMIMOChatConfig["audio"]> = {
    format: "wav",
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

const normalizeNumberInput = (value: string, min: number, max: number) => {
    const raw = String(value ?? "").trim();
    if (!raw) return undefined;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return undefined;

    return Math.min(max, Math.max(min, Math.trunc(parsed)));
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
    const audioOn = !!config?.audio;
    const audioFormat = config?.audio?.format ?? DEFAULT_AUDIO.format;
    const webSearch = getWebSearchTool(config);
    const webSearchOn = !!webSearch;
    const userLocation = webSearch?.user_location;

    const updateThinking = (patch: Partial<NonNullable<XiaomiMIMOChatConfig["thinking"]>>) =>
        updateConfig({
            ...config,
            thinking: {
                ...(config?.thinking ?? DEFAULT_THINKING),
                ...patch,
            },
        });

    const updateAudio = (patch: Partial<NonNullable<XiaomiMIMOChatConfig["audio"]>>) =>
        updateConfig({
            ...config,
            audio: {
                ...(config?.audio ?? DEFAULT_AUDIO),
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
                title={t("audio") ?? "Audio"}
                headerActions={
                    <theme.Switch
                        id="xiaomimimo-audio"
                        checked={audioOn}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                audio: value ? { ...DEFAULT_AUDIO } : undefined,
                            })
                        }
                    />
                }
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={twoColumnGrid}>
                        <theme.Select
                            label={t("format") ?? "Format"}
                            disabled={!audioOn}
                            values={[audioFormat ?? "wav"]}
                            valueTitle={audioFormat ?? "wav"}
                            options={AUDIO_FORMATS.map((value) => ({ value, label: value }))}
                            onChange={(value: string) => updateAudio({ format: value as AudioFormat })}
                        >
                            {AUDIO_FORMATS.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </theme.Select>

                        <theme.Switch
                            id="xiaomimimo-audio-optimize-text-preview"
                            disabled={!audioOn}
                            checked={!!config?.audio?.optimize_text_preview}
                            label="Optimize text preview"
                            onChange={(value) => updateAudio({ optimize_text_preview: !!value })}
                        />
                    </div>

                    <theme.Input
                        id="xiaomimimo-audio-voice"
                        label={t("voice") ?? "Voice"}
                        placeholder="mimo_default"
                        disabled={!audioOn}
                        value={config?.audio?.voice ?? ""}
                        onChange={(e: any) => updateAudio({ voice: optionalString(e?.target?.value) })}
                    />
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
                    <div style={twoColumnGrid}>
                        <theme.Switch
                            id="xiaomimimo-force-search"
                            disabled={!webSearchOn}
                            checked={(webSearch?.force_search ?? DEFAULT_WEB_SEARCH.force_search) === "true"}
                            label="Force search"
                            onChange={(value) => updateWebSearch({ force_search: value ? "true" : "false" })}
                        />

                        <theme.Input
                            id="xiaomimimo-max-keyword"
                            type="number"
                            min={1}
                            max={50}
                            step={1}
                            label="Max keywords"
                            disabled={!webSearchOn}
                            value={webSearch?.max_keyword ?? ""}
                            onChange={(e: any) =>
                                updateWebSearch({ max_keyword: normalizeNumberInput(e?.target?.value, 1, 50) })
                            }
                        />

                        <theme.Input
                            id="xiaomimimo-web-search-limit"
                            type="number"
                            min={1}
                            max={50}
                            step={1}
                            label="Result limit"
                            disabled={!webSearchOn}
                            value={webSearch?.limit ?? ""}
                            onChange={(e: any) =>
                                updateWebSearch({ limit: normalizeNumberInput(e?.target?.value, 1, 50) })
                            }
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

