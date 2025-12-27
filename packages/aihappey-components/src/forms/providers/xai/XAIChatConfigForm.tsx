// XAIChatConfigForm.tsx

import { useTheme } from "../../../theme/ThemeContext";

const DEFAULT_WEB_SEARCH = {
    enable_image_understanding: true,
    allowed_domains: [],
    excluded_domains: [],
};

const DEFAULT_X_SEARCH = {
    enable_image_understanding: true,
    enable_video_understanding: true,
    allowed_x_handles: [],
    excluded_x_handles: [],
};

export type XAIChatConfigFormTranslations = {
    reasoning?: string;
    webSearch?: string;
    xSearch?: string;
    code_execution?: string;
    parallelToolCalls?: string;
    instructionsLabel?: string;
    instructionsPlaceholder?: string;

    allowedDomains?: string;
    excludedDomains?: string;
    allowedXHandles?: string;
    excludedXHandles?: string;
    imageUnderstanding?: string;
    videoUnderstanding?: string;
};

export const XAIChatConfigForm = ({
    config,
    updateConfig,
    translations,
}: {
    config: any;
    updateConfig: (val: any) => void;
    translations?: XAIChatConfigFormTranslations;
}) => {
    const theme = useTheme();

    const reasoningOn = !!config?.reasoning;
    const webSearchOn = !!config?.web_search;
    const xSearchOn = !!config?.x_search;
    const codeExecutionOn = !!config?.code_execution;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card
                size="small"
                title={translations?.reasoning ?? "reasoning"}
                headerActions={
                    <theme.Switch
                        id="reasoning"
                        checked={reasoningOn}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                reasoning: val ? {} : undefined,
                            })
                        }
                    />
                }
            />

            <theme.Card
                size="small"
                title={translations?.webSearch ?? "webSearch"}
                headerActions={
                    <theme.Switch
                        id="webSearch"
                        checked={webSearchOn}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                web_search: !val ? undefined : { ...DEFAULT_WEB_SEARCH },
                            })
                        }
                    />
                }
            >
                <div>
                    <theme.Input
                        label={translations?.allowedDomains}
                        disabled={!webSearchOn}
                        value={(config?.web_search?.allowed_domains || []).join(", ")}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                web_search: {
                                    ...config.web_search,
                                    allowed_domains: e.target.value
                                        .split(",")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean),
                                },
                            })
                        }
                    />

                    <theme.Input
                        label={translations?.excludedDomains}
                        disabled={!webSearchOn}
                        value={(config?.web_search?.excluded_domains || []).join(", ")}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                web_search: {
                                    ...config.web_search,
                                    excluded_domains: e.target.value
                                        .split(",")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean),
                                },
                            })
                        }
                    />

                    <theme.Switch
                        id="webImageUnderstanding"
                        label={translations?.imageUnderstanding}
                        disabled={!webSearchOn}
                        checked={config?.web_search?.enable_image_understanding}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                web_search: {
                                    ...config.web_search,
                                    enable_image_understanding: val,
                                },
                            })
                        }
                    />
                </div>
            </theme.Card>

            <theme.Card
                size="small"
                title={translations?.xSearch ?? "xSearch"}
                headerActions={
                    <theme.Switch
                        id="xSearch"
                        checked={xSearchOn}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                x_search: !val ? undefined : { ...DEFAULT_X_SEARCH },
                            })
                        }
                    />
                }
            >
                <div>
                    <theme.Input
                        label={translations?.allowedXHandles}
                        disabled={!xSearchOn}
                        value={(config?.x_search?.allowed_x_handles || []).join(", ")}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                x_search: {
                                    ...config.x_search,
                                    allowed_x_handles: e.target.value
                                        .split(",")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean),
                                },
                            })
                        }
                    />

                    <theme.Input
                        label={translations?.excludedXHandles}
                        disabled={!xSearchOn}
                        value={(config?.x_search?.excluded_x_handles || []).join(", ")}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                x_search: {
                                    ...config.x_search,
                                    excluded_x_handles: e.target.value
                                        .split(",")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean),
                                },
                            })
                        }
                    />

                    <theme.Switch
                        id="xImageUnderstanding"
                        label={translations?.imageUnderstanding}
                        disabled={!xSearchOn}
                        checked={config?.x_search?.enable_image_understanding}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                x_search: {
                                    ...config.x_search,
                                    enable_image_understanding: val,
                                },
                            })
                        }
                    />

                    <theme.Switch
                        id="xVideoUnderstanding"
                        label={translations?.videoUnderstanding}
                        disabled={!xSearchOn}
                        checked={config?.x_search?.enable_video_understanding}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                x_search: {
                                    ...config.x_search,
                                    enable_video_understanding: val,
                                },
                            })
                        }
                    />
                </div>
            </theme.Card>

            <theme.Card
                size="small"
                title={translations?.code_execution ?? "code_execution"}
                headerActions={
                    <theme.Switch
                        id="codeExecution"
                        checked={codeExecutionOn}
                        onChange={(val) =>
                            updateConfig({
                                ...config,
                                code_execution: !val ? undefined : {},
                            })
                        }
                    />
                }
            />

            <theme.Switch
                id="parallelToolCalls"
                checked={!!config?.parallel_tool_calls}
                label={translations?.parallelToolCalls ?? "parallelToolCalls"}
                onChange={(value) =>
                    updateConfig({
                        ...config,
                        parallel_tool_calls: value,
                    })
                }
            />

            <theme.TextArea
                label={translations?.instructionsLabel ?? "instructions"}
                placeholder={translations?.instructionsPlaceholder ?? "instructions"}
                rows={5}
                value={config?.instructions}
                onChange={(value) =>
                    updateConfig({
                        ...config,
                        instructions: value,
                    })
                }
            />
        </div>
    );
};
