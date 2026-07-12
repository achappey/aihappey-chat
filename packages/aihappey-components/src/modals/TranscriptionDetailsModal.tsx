import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import type { TranscriptionResponse } from "aihappey-ai";
import type { Provider } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";
import { getProviderResultVisibility, ProviderResultCards } from "./ProviderResultCards";

export type TranscriptionDetailsModalProps = {
    open: boolean;
    onClose: () => void;

    transcription: TranscriptionResponse;

    audio: Blob;
    audioFilename: string;

    providers?: Record<string, Provider>;

    size?: "small" | "medium" | "large";
};

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
    } finally {
        // Defer revocation slightly to allow the download to start in all browsers.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
};

const toTextFilename = (audioFilename: string) => {
    // Replace the last extension with .txt (e.g. "sample.wav" -> "sample.txt").
    if (!audioFilename) return "transcription.txt";
    return audioFilename.replace(/\.[^./\\]+$/, "") + ".txt";
};

const getFlattenedTranscriptionText = (transcription: TranscriptionResponse) => {
    const hasSegments = (transcription.segments?.length ?? 0) > 0;
    if (!hasSegments) return transcription.text ?? "";

    const flattened = transcription.segments
        .map((s) => {
            const text = (s.text ?? "").trim();
            if (!text) return "";
            // Match the UI: time range line, then segment text, then a blank line.
            return `${s.startSecond}s – ${s.endSecond}s\n${text}`;
        })
        .filter((s) => s.length > 0)
        .join("\n\n");

    return flattened.length > 0 ? flattened : (transcription.text ?? "");
};

const getProvider = (
    providers: Record<string, Provider> | undefined,
    key: string | undefined
) => {
    if (!providers || !key) return undefined;

    return providers[key] ?? providers[key.toLocaleLowerCase()];
};

const getProviderKeyFromModelId = (modelId: string | undefined) => {
    if (!modelId?.includes("/")) return undefined;

    return modelId.split("/")[0]?.trim().toLocaleLowerCase();
};

const getProviderKeyFromMetadata = (
    providerMetadata: Record<string, any> | undefined,
    providers: Record<string, Provider> | undefined,
    modelId: string | undefined,
) => {
    if (providerMetadata && providers) {
        const metadataProviderKey = Object.keys(providerMetadata).find((key) => {
            const normalizedKey = key.trim().toLocaleLowerCase();
            return normalizedKey !== "gateway" && !!getProvider(providers, normalizedKey);
        });

        if (metadataProviderKey) return metadataProviderKey;
    }

    const modelProviderKey = getProviderKeyFromModelId(modelId);
    return getProvider(providers, modelProviderKey) ? modelProviderKey : undefined;
};

const tryParseJsonString = (value: unknown) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    try {
        return JSON.parse(trimmed);
    } catch {
        return undefined;
    }
};

export const TranscriptionDetailsModal: React.FC<
    TranscriptionDetailsModalProps
> = ({
    open,
    onClose,
    transcription,
    audio,
    audioFilename,
    providers,
    size = "large",
}) => {
        const theme = useTheme();
        const { t } = useTranslation();

        const providerKey = getProviderKeyFromMetadata(
            transcription.providerMetadata,
            providers,
            transcription.response?.modelId,
        );
        const provider = getProvider(providers, providerKey);
        const providerDisplayName = provider?.name
            ?? providerKey
            ?? transcription.response?.modelId?.split("/")?.[0]
            ?? t("transcriptionProvider", "Provider");

        const tabLabels = {
            rawText: t('text'),
            segments: t('segments'),
            providerInput: t("providerInput", "{{provider}} input", { provider: providerDisplayName }),
            rawOutput: t("providerResult", "{{provider}} result", { provider: providerDisplayName }),
        } as const;

        const hasSegments = (transcription.segments?.length ?? 0) > 0;
        const defaultTab = "rawText";
        const [activeTab, setActiveTab] = useState(defaultTab);

        useEffect(() => {
            if (!open) return;
            // When opening, ensure we never land on a missing tab.
            setActiveTab(defaultTab);
        }, [open]);

        const rawOutput = useMemo(() => transcription.response?.body, [transcription]);
        const providerResultVisibility = getProviderResultVisibility({
            providerMetadata: transcription.providerMetadata,
            providers,
            providerKey,
            headers: transcription.response?.headers,
            body: rawOutput,
        });
        const parsedRequestBody = useMemo(() => tryParseJsonString(transcription.request?.body), [transcription]);
        const hasParsedRequestBody = parsedRequestBody !== undefined;

        const downloadText = () => {
            const text = getFlattenedTranscriptionText(transcription);
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            downloadBlob(blob, toTextFilename(audioFilename));
        };

        return (
            <theme.Modal
                show={open}
                size={size}
                onHide={onClose}
                title={t("transcription")}
                actions={
                    <div style={{ display: "flex", gap: 8 }}>
                        <theme.SplitButton
                            size="small"
                            variant="transparent"
                            icon="download"
                            label={t("download")}

                            onClick={() => {
                                // Intentionally no-op: user must choose Text or Audio from the dropdown.
                            }}
                            menuItems={[
                                {
                                    key: "download-text",
                                    label: t("text"),
                                    onClick: (e) => {
                                        e?.stopPropagation?.();
                                        downloadText();
                                    },
                                },
                                {
                                    key: "download-audio",
                                    label: t("audio"),
                                    onClick: (e) => {
                                        e?.stopPropagation?.();
                                        downloadBlob(audio, audioFilename);
                                    },
                                },
                            ]}
                        />

                        <theme.Button variant="secondary"
                            onClick={onClose}>
                            {t("close")}
                        </theme.Button>
                    </div>
                }
            >
                <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
                    <theme.Tab eventKey="rawText" title={tabLabels.rawText}>
                        <div style={{ whiteSpace: "pre-wrap" }}>{transcription.text}</div>
                    </theme.Tab>

                    {hasSegments && (
                        <theme.Tab eventKey="segments" title={tabLabels.segments}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {transcription.segments.map((segment, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            border: "1px solid rgba(0,0,0,0.1)",
                                            borderRadius: 6,
                                            padding: 8,
                                        }}
                                    >
                                        <div style={{ opacity: 0.75, marginBottom: 4 }}>
                                            {segment.startSecond}s – {segment.endSecond}s
                                        </div>
                                        <div style={{ whiteSpace: "pre-wrap" }}>{segment.text}</div>
                                    </div>
                                ))}
                            </div>
                        </theme.Tab>
                    )}

                    {hasParsedRequestBody && (
                        <theme.Tab eventKey="providerInput" title={tabLabels.providerInput}>
                            <theme.JsonViewer value={parsedRequestBody} />
                        </theme.Tab>
                    )}

                    {providerResultVisibility.hasAny ? (
                        <theme.Tab eventKey="rawOutput" title={tabLabels.rawOutput}>
                            <ProviderResultCards
                                providerMetadata={transcription.providerMetadata}
                                providers={providers}
                                providerKey={providerKey}
                                headers={transcription.response?.headers}
                                body={rawOutput}
                            />
                        </theme.Tab>
                    ) : null}
                </theme.Tabs>
            </theme.Modal>
        );
    };

