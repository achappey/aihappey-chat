import { useEffect, useState } from "react";

import { useTheme } from "../../theme/ThemeContext";
import {
    parseOptionalInteger,
    parseOptionalNumber,
} from "./shared";
import { useTranslation } from "aihappey-i18n";

const safeStringify = (value: unknown) => {
    try {
        return value === undefined ? "" : JSON.stringify(value, null, 2);
    } catch {
        return "";
    }
};

const RESPONSE_INCLUDE_OPTIONS = [
    {
        key: "web_search_call.action.sources",
        labelKey: "providers:openai.includeSources",
        descriptionKey: "providers:openai.responsesIncludeDescriptions.webSearchSources",
    },
    {
        key: "code_interpreter_call.outputs",
        labelKey: "providers:openai.includeOutputs",
        descriptionKey: "providers:openai.responsesIncludeDescriptions.codeInterpreterOutputs",
    },
    {
        key: "computer_call_output.output.image_url",
        labelKey: "providers:openai.responsesIncludeImageUrls",
        descriptionKey: "providers:openai.responsesIncludeDescriptions.computerCallImageUrls",
    },
    {
        key: "file_search_call.results",
        labelKey: "providers:openai.includeSearchResults",
        descriptionKey: "providers:openai.responsesIncludeDescriptions.fileSearchResults",
    },
    {
        key: "message.input_image.image_url",
        labelKey: "providers:openai.responsesIncludeInputImageUrls",
        descriptionKey: "providers:openai.responsesIncludeDescriptions.inputImageUrls",
    },
    {
        key: "message.output_text.logprobs",
        labelKey: "providers:openai.responsesIncludeOutputLogprobs",
        descriptionKey: "providers:openai.responsesIncludeDescriptions.outputTextLogprobs",
    },
    {
        key: "reasoning.encrypted_content",
        labelKey: "providers:openai.encryptedContent",
        descriptionKey: "providers:openai.responsesIncludeDescriptions.reasoningEncryptedContent",
    },
] as const;

export type ResponsesEndpointConfig = {
    stream?: boolean;
    include?: string[];
    top_p?: number;
    parallel_tool_calls?: boolean;
    max_tool_calls?: number;
    service_tier?: string;
    prompt_cache_key?: string;
    prompt_cache_retention?: string;
    reasoning?: {
        effort?: string;
        summary?: string;
    };
    text?: {
        format?: {
            type?: string;
            name?: string;
            description?: string;
            strict?: boolean;
            schema?: Record<string, unknown>;
        };
        verbosity?: string;
    };
};

export const ResponsesEndpointConfigForm = ({
    value,
    onChange,
}: {
    value: ResponsesEndpointConfig;
    onChange: (next: ResponsesEndpointConfig) => void;
}) => {
    const theme = useTheme();
    const serviceTierOptions = ["auto", "default", "flex", "scale", "priority"];
    const promptCacheRetentionOptions = ["in-memory", "24h"];
    const reasoningEffortOptions = ["none", "minimal", "low", "medium", "high", "xhigh"];
    const reasoningSummaryOptions = ["auto", "concise", "detailed"];
    const verbosityOptions = ["low", "medium", "high"];
    const textFormatOptions = ["text", "json_object", "json_schema"];
    const textFormatType = value.text?.format?.type ?? "text";
    const isJsonSchemaFormat = textFormatType === "json_schema";
    const { t } = useTranslation();
    const [jsonSchemaText, setJsonSchemaText] = useState<string>(safeStringify(value.text?.format?.schema));
    const [jsonSchemaError, setJsonSchemaError] = useState<string | undefined>(undefined);

    const toggleInclude = (key: string, enabled: boolean) => {
        const current = Array.isArray(value.include) ? value.include : [];
        const next = enabled
            ? Array.from(new Set([...current, key]))
            : current.filter((item) => item !== key);

        onChange({
            ...value,
            include: next.length ? next : undefined,
        });
    };

    useEffect(() => {
        setJsonSchemaText(safeStringify(value.text?.format?.schema));
        setJsonSchemaError(undefined);
    }, [value.text?.format?.schema]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title="Responses">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Switch
                        id="responsesStream"
                        label="Stream"
                        checked={!!value.stream}
                        onChange={(next) => onChange({ ...value, stream: next })}
                    />

                    <theme.Switch
                        id="responsesParallelToolCalls"
                        label={t('parallelToolCalls')}
                        checked={!!value.parallel_tool_calls}
                        onChange={(next) => onChange({ ...value, parallel_tool_calls: next })}
                    />

                    <theme.Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        label={t('providers:openai.topP')}
                        value={value.top_p ?? ""}
                        onChange={(e) => onChange({ ...value, top_p: parseOptionalNumber(e?.target?.value) })}
                    />

                    <theme.Input
                        type="number"
                        min={1}
                        step={1}
                        label={t('maxToolCalls')}
                        value={value.max_tool_calls ?? ""}
                        onChange={(e) => onChange({ ...value, max_tool_calls: parseOptionalInteger(e?.target?.value) })}
                    />

                    <theme.Input
                        label={t('providers:openai.promptCacheKey')}
                        value={value.prompt_cache_key ?? ""}
                        onChange={(e) => onChange({ ...value, prompt_cache_key: String(e?.target?.value ?? "") || undefined })}
                    />

                    <theme.Select
                        label={t('providers:openai.serviceTier.title')}
                        values={[value.service_tier ?? ""]}
                        valueTitle={value.service_tier ?
                            t(`providers:openai.serviceTier.${value.service_tier}`)
                            : t('providerDefault')}
                        options={serviceTierOptions.map((item) => ({ value: item, label: item }))}
                        onChange={(next: string) => onChange({ ...value, service_tier: String(next || "") || undefined })}
                    >
                        <option value="">{t('providerDefault')}</option>
                        {serviceTierOptions.map((item) => (
                            <option key={item} value={item}>{t(`providers:openai.serviceTier.${item}`)}</option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t('providers:openai.promptCacheRetention')}
                        values={[value.prompt_cache_retention ?? ""]}
                        valueTitle={value.prompt_cache_retention ?
                            t(`providers:openai.promptCacheOptions.${value.prompt_cache_retention}`)
                            : t('providerDefault')}
                        options={promptCacheRetentionOptions.map((item) => ({ value: item, label: item }))}
                        onChange={(next: string) => onChange({ ...value, prompt_cache_retention: String(next || "") || undefined })}
                    >
                        <option value="">{t('providerDefault')}</option>
                        {promptCacheRetentionOptions.map((item) => (
                            <option key={item} value={item}>{t(`providers:openai.promptCacheOptions.${item}`)}</option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>

            <theme.Card size="small" title="Reasoning">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t('effortLevel')}
                        values={[value.reasoning?.effort ?? ""]}
                        valueTitle={value.reasoning?.effort ? t(value.reasoning?.effort)
                            : t('providerDefault')}
                        options={reasoningEffortOptions.map((item) => ({ value: item, label: item }))}
                        onChange={(next: string) => onChange({
                            ...value,
                            reasoning: {
                                ...value.reasoning,
                                effort: String(next || "") || undefined,
                            },
                        })}
                    >
                        <option value="">{t('providerDefault')}</option>
                        {reasoningEffortOptions.map((item) => (
                            <option key={item} value={item}>{t(item)}</option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t('reasoningSummary')}
                        values={[value.reasoning?.summary ?? ""]}
                        valueTitle={value.reasoning?.summary 
                                ? t(`${value.reasoning?.summary}`) : t('providerDefault')}
                        options={reasoningSummaryOptions.map((item) => ({ value: item, label: t(item) }))}
                        onChange={(next: string) => onChange({
                            ...value,
                            reasoning: {
                                ...value.reasoning,
                                summary: String(next || "") || undefined,
                            },
                        })}
                    >
                        <option value="">{t('providerDefault')}</option>
                        {reasoningSummaryOptions.map((item) => (
                            <option key={item} value={item}>{t(item)}</option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>

            <theme.Card size="small" title={t('providers:openai.responsesIncludeTitle')}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {RESPONSE_INCLUDE_OPTIONS.map((option) => (
                        <theme.Switch
                            key={option.key}
                            id={`responsesInclude-${option.key.replace(/[^a-zA-Z0-9]+/g, '-')}`}
                            label={t(option.labelKey)}
                            hint={t(option.descriptionKey)}
                            checked={!!value.include?.includes(option.key)}
                            onChange={(next) => toggleInclude(option.key, next)}
                        />
                    ))}
                </div>
            </theme.Card>

            <theme.Card size="small" title="Text">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t('verbosity')}
                        values={[value.text?.verbosity ?? ""]}
                        valueTitle={value.text?.verbosity
                            ? t(value.text?.verbosity) : t('providerDefault')}
                        options={verbosityOptions.map((item) => ({ value: item, label: t(item) }))}
                        onChange={(next: string) => onChange({
                            ...value,
                            text: {
                                ...value.text,
                                verbosity: String(next || "") || undefined,
                            },
                        })}
                    >
                        <option value="">{t('providerDefault')}</option>
                        {verbosityOptions.map((item) => (
                            <option key={item} value={item}>{t(item)}</option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t('type')}
                        values={[textFormatType]}
                        valueTitle={t(textFormatType)}
                        options={textFormatOptions.map((item) => ({
                            value: item,
                            label: t(item)
                        }))}
                        onChange={(next: string) => onChange({
                            ...value,
                            text: {
                                ...value.text,
                                format: {
                                    ...value.text?.format,
                                    type: String(next || "text"),
                                },
                            },
                        })}
                    >
                        {textFormatOptions.map((item) => (
                            <option key={item} value={item}>{t(item)}</option>
                        ))}
                    </theme.Select>

                    {isJsonSchemaFormat ? (
                        <>
                            <theme.Input
                                label="text.format.name"
                                placeholder="Structured output name"
                                value={value.text?.format?.name ?? ""}
                                onChange={(e) => onChange({
                                    ...value,
                                    text: {
                                        ...value.text,
                                        format: {
                                            ...value.text?.format,
                                            type: "json_schema",
                                            name: String(e?.target?.value ?? "") || undefined,
                                        },
                                    },
                                })}
                            />

                            <theme.Input
                                label="text.format.description"
                                placeholder="Optional schema description"
                                value={value.text?.format?.description ?? ""}
                                onChange={(e) => onChange({
                                    ...value,
                                    text: {
                                        ...value.text,
                                        format: {
                                            ...value.text?.format,
                                            type: "json_schema",
                                            description: String(e?.target?.value ?? "") || undefined,
                                        },
                                    },
                                })}
                            />

                            <theme.Switch
                                id="responsesTextFormatStrict"
                                label="text.format.strict"
                                checked={!!value.text?.format?.strict}
                                onChange={(next) => onChange({
                                    ...value,
                                    text: {
                                        ...value.text,
                                        format: {
                                            ...value.text?.format,
                                            type: "json_schema",
                                            strict: next,
                                        },
                                    },
                                })}
                            />

                            <theme.TextArea
                                label="text.format.schema"
                                rows={10}
                                hint={jsonSchemaError}
                                value={jsonSchemaText}
                                onChange={(next) => {
                                    setJsonSchemaText(next);

                                    const trimmed = next.trim();
                                    if (!trimmed) {
                                        setJsonSchemaError(undefined);
                                        onChange({
                                            ...value,
                                            text: {
                                                ...value.text,
                                                format: {
                                                    ...value.text?.format,
                                                    type: "json_schema",
                                                    schema: undefined,
                                                },
                                            },
                                        });
                                        return;
                                    }

                                    try {
                                        const parsed = JSON.parse(trimmed);
                                        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
                                            setJsonSchemaError("Schema must be a JSON object.");
                                            return;
                                        }

                                        setJsonSchemaError(undefined);
                                        onChange({
                                            ...value,
                                            text: {
                                                ...value.text,
                                                format: {
                                                    ...value.text?.format,
                                                    type: "json_schema",
                                                    schema: parsed as Record<string, unknown>,
                                                },
                                            },
                                        });
                                    } catch (error: any) {
                                        setJsonSchemaError(error?.message ?? "Invalid JSON schema.");
                                    }
                                }}
                            />
                        </>
                    ) : null}
                </div>
            </theme.Card>
        </div>
    );
};

