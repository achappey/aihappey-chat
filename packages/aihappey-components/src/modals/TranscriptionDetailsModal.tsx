import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import type { TranscriptionResponse } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";

export type TranscriptionDetailsModalProps = {
    open: boolean;
    onClose: () => void;

    transcription: TranscriptionResponse;

    audio: Blob;
    audioFilename: string;

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

export const TranscriptionDetailsModal: React.FC<
    TranscriptionDetailsModalProps
> = ({
    open,
    onClose,
    transcription,
    audio,
    audioFilename,
    size = "large",
}) => {
        const theme = useTheme();
        const { t } = useTranslation();

        // Avoid adding new i18n keys for now; use simple English tab labels.
        const tabLabels = {
            rawText: t('text'),
            segments: t('segments'),
            rawOutput: t('output'),
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

                    <theme.Tab eventKey="rawOutput" title={tabLabels.rawOutput}>
                        <theme.JsonViewer value={rawOutput} />
                    </theme.Tab>
                </theme.Tabs>
            </theme.Modal>
        );
    };

