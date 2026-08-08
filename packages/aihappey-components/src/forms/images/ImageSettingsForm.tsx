import React from "react";
import { useTheme } from "../../theme/ThemeContext";

import { ImageSizeSettingsForm } from "./ImageSizeSettingsForm";
import { ImageAspectRatioSettingsForm } from "./ImageAspectRatioSettingsForm";
import { useTranslation } from "aihappey-i18n";
import { AttachmentButton } from "../../buttons/AttachmentButton";
import { FileTags } from "../../fields/FileTags";

export type ImageSettings = {
    size?: string;
    aspectRatio?: string;
    n: number;
    seed?: number;
    maxImagesPerCall?: number
};

export type ImageMaskInfo = {
    /** Whether a stored `image_mask` exists. */
    exists: boolean;
    /** Display label (typically filename). */
    tagLabel?: string;
    /** Optional object URL for a small preview. */
    previewUrl?: string;
};

export type ImageSettingsFormProps = {
    value: ImageSettings;
    onChange: (next: ImageSettings) => void;
    sizePresets?: { w: number; h: number; label?: string }[];
    aspectPresets?: { w: number; h: number; label?: string }[];

    /** Optional: image edit mask (single file) stored in `useFiles()` as `image_mask`. */
    maskInfo?: ImageMaskInfo;
    onSelectMaskFile?: (files: File[]) => void;
    onClearMaskFile?: () => void;
};

export const ImageSettingsForm: React.FC<ImageSettingsFormProps> = ({
    value,
    onChange,
    sizePresets,
    aspectPresets,
    maskInfo,
    onSelectMaskFile,
    onClearMaskFile,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const maskFileForTags = maskInfo?.tagLabel
        ? new File([], maskInfo.tagLabel)
        : undefined;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Size */}
            <ImageSizeSettingsForm
                value={{ size: value.size }}
                sizePresets={sizePresets}
                onChange={(next) =>
                    onChange({ ...value, size: next.size })
                }
            />

            <ImageAspectRatioSettingsForm
                value={{ aspectRatio: value.aspectRatio }}
                aspectPresets={aspectPresets}
                onChange={(next) =>
                    onChange({ ...value, aspectRatio: next.aspectRatio })
                }
            />

            {/* Output */}
            <theme.Card size="small" title={t("imageSettings.output")}>
                <div style={styles.outputGrid}>
                    <theme.Slider
                        label={t("imageSettings.n", { n: value.n })}
                        min={1}
                        max={20}
                        value={value.n ?? 1}
                        onChange={(e: number) => {
                            onChange({ ...value, n: e });
                        }}
                    />

                    <theme.Input
                        label={t("imageSettings.maxImagesPerCall")}
                        type="number"
                        value={String(value.maxImagesPerCall ?? "")}
                        onChange={(e: any) => {
                            const next = e.target.value ? Number(e.target.value) : undefined;
                            onChange({ ...value, maxImagesPerCall: next });
                        }}
                    />

                </div>
            </theme.Card>

            <theme.Card size="small"
                title={t("imageSettings.other")}>
                <div>
                    <theme.Input
                        label={t("imageSettings.seed")}
                        type="number"
                        value={value.seed === undefined ? "" : String(value.seed)}
                        onChange={(e: any) => {
                            const raw = String(e.target.value ?? "").trim();
                            if (!raw) {
                                onChange({ ...value, seed: undefined });
                                return;
                            }
                            const parsed = Number(raw);
                            onChange({
                                ...value,
                                seed: Number.isFinite(parsed) ? parsed : undefined,
                            });
                        }}
                    />

                    {/* Mask */}
                    <div style={{ marginTop: 14 }}>
                        <div style={{ marginBottom: 8 }}>
                            {t("imageSettings.mask")}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <AttachmentButton
                                disabled={!onSelectMaskFile}
                                icon="attachment"
                                onFilesSelected={onSelectMaskFile ?? (() => undefined)}
                            />

                            <theme.Button
                                size="small"
                                variant="subtle"
                                icon="dismiss"
                                disabled={!maskInfo?.exists || !onClearMaskFile}
                                onClick={onClearMaskFile ?? (() => undefined)}
                                title={t("delete")}
                            />

                            {maskFileForTags && (
                                <div style={{ flex: 1, minWidth: 220 }}>
                                    <FileTags
                                        size="extra-small"
                                        icon="image"
                                        files={[maskFileForTags]}
                                    />
                                </div>
                            )}

                        </div>

                        {maskInfo?.previewUrl && (
                            <div style={{ marginTop: 10 }}>
                                <img
                                    src={maskInfo.previewUrl}
                                    alt={t("imageSettings.mask")}
                                    style={{
                                        width: 96,
                                        height: 96,
                                        objectFit: "cover",
                                        borderRadius: 8,
                                        border: "1px solid rgba(0,0,0,0.12)",
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </theme.Card>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    outputGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        width: "100%",
    },
};
