import React from "react";
import type { GoogleImageFileConfig, GoogleStaticMediaProcessing, GoogleVideoFileConfig } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { FileConfigSelect } from "../files/FileConfigSelect";

export const GoogleImageFileConfigForm: React.FC<{
    config: GoogleImageFileConfig;
    updateConfig: (value: GoogleImageFileConfig) => void;
}> = ({ config, updateConfig }) => {
    const { Card } = useTheme();
    const { t } = useTranslation();
    return <Card size="small" title={t("general")}>
        <GoogleFileResolution config={config} updateConfig={updateConfig} />
    </Card>;
};

const GoogleFileResolution: React.FC<{
    config: GoogleImageFileConfig;
    updateConfig: (value: GoogleImageFileConfig) => void;
}> = ({ config, updateConfig }) => {
    const { t } = useTranslation();
    return <FileConfigSelect label={t("fileInput.resolution")} value={config.resolution}
        options={["low", "medium", "high", "ultra_high"].map((value) => ({
            value, label: value === "ultra_high" ? t("fileInput.ultraHigh") : t(value),
        }))}
        onChange={(value) => {
            const { resolution, ...rest } = config;
            updateConfig(value ? { ...rest, resolution: value as GoogleImageFileConfig["resolution"] } : rest);
        }} />;
};

export const GoogleVideoFileConfigForm: React.FC<{
    config: GoogleVideoFileConfig;
    updateConfig: (value: GoogleVideoFileConfig) => void;
}> = ({ config, updateConfig }) => {
    const { Card, Input } = useTheme();
    const { t } = useTranslation();
    const processing = config.processing;
    const staticOptions = typeof processing === "object" ? processing : undefined;
    const mode = typeof processing === "object" ? processing.type : processing;

    const updateStaticOption = (field: "fps" | "start_offset" | "end_offset", raw: string) => {
        const next: GoogleStaticMediaProcessing = { ...staticOptions, type: "static" };
        if (!raw) delete next[field];
        else {
            const value = Number(raw);
            if (!Number.isFinite(value) || value < 0 || (field === "fps" && value === 0)) return;
            if (field === "fps") next.fps = value;
            else next[field] = `${value}s`;
        }
        if (next.end_offset !== undefined
            && Number.parseFloat(next.end_offset) <= Number.parseFloat(next.start_offset ?? "0")) {
            if (field === "end_offset") return;
            delete next.end_offset;
        }
        updateConfig({ ...config, processing: Object.keys(next).length === 1 ? "static" : next });
    };

    return <Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <GoogleFileResolution config={config} updateConfig={updateConfig} />
            <FileConfigSelect label={t("fileInput.processing")} value={mode}
                options={["static", "agentic"].map((value) => ({ value, label: t(`fileInput.${value}`) }))}
                onChange={(value) => {
                    const { processing: previous, ...rest } = config;
                    updateConfig(value ? { ...rest, processing: value as "static" | "agentic" } : rest);
                }} />
            {mode === "static" && <>
                <Input type="number" min={0} step="any" label={t("fileInput.startOffset")}
                    value={staticOptions?.start_offset?.replace(/s$/, "") ?? ""}
                    onChange={(event) => updateStaticOption("start_offset", event.target.value)} />
                <Input type="number" min={0} step="any" label={t("fileInput.endOffset")}
                    hint={t("fileInput.endOffsetHint")}
                    value={staticOptions?.end_offset?.replace(/s$/, "") ?? ""}
                    onChange={(event) => updateStaticOption("end_offset", event.target.value)} />
                <Input type="number" min={0} step="any" label={t("fileInput.fps")}
                    value={staticOptions?.fps ?? ""}
                    onChange={(event) => updateStaticOption("fps", event.target.value)} />
            </>}
        </div>
    </Card>;
};
