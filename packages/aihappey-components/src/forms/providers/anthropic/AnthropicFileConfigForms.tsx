import React from "react";
import type { AnthropicDocumentFileConfig, AnthropicImageFileConfig } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { FileConfigSelect } from "../files/FileConfigSelect";

export const AnthropicImageFileConfigForm: React.FC<{
    config: AnthropicImageFileConfig;
    updateConfig: (value: AnthropicImageFileConfig) => void;
}> = ({ config, updateConfig }) => {
    const { Card } = useTheme();
    const { t } = useTranslation();
    return <Card size="small" title={t("fileInput.transformations")}>
        <FileConfigSelect label={t("fileInput.oversizedImage")} value={config.transformations?.oversized_image}
            options={["downsize", "error"].map((value) => ({ value, label: t(`fileInput.${value}`) }))}
            onChange={(value) => updateConfig(value
                ? { transformations: { oversized_image: value as "downsize" | "error" } }
                : {})} />
    </Card>;
};

export const AnthropicDocumentFileConfigForm: React.FC<{
    config: AnthropicDocumentFileConfig;
    updateConfig: (value: AnthropicDocumentFileConfig) => void;
}> = ({ config, updateConfig }) => {
    const { Card, TextArea } = useTheme();
    const { t } = useTranslation();
    return <Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <FileConfigSelect label={t("fileInput.citations")}
                value={config.citations?.enabled === undefined ? undefined : String(config.citations.enabled)}
                options={[{ value: "true", label: t("fileInput.enabled") }, { value: "false", label: t("fileInput.disabled") }]}
                onChange={(value) => {
                    const { citations, ...rest } = config;
                    updateConfig(value === undefined ? rest : { ...rest, citations: { enabled: value === "true" } });
                }} />
            <TextArea label={t("fileInput.context")} value={config.context ?? ""} rows={4}
                onChange={(context) => {
                    const { context: previous, ...rest } = config;
                    updateConfig(context ? { ...rest, context } : rest);
                }} />
        </div>
    </Card>;
};
