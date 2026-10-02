import React from "react";
import type { OpenAIFileConfig } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { FileConfigSelect } from "../files/FileConfigSelect";

export const OpenAIFileConfigForm: React.FC<{
    config: OpenAIFileConfig;
    updateConfig: (value: OpenAIFileConfig) => void;
    /** Original detail applies to image inputs, not the default/rest file configuration. */
    image?: boolean;
}> = ({ config, updateConfig, image = false }) => {
    const { Card } = useTheme();
    const { t } = useTranslation();
    return <Card size="small" title={t("general")}>
        <FileConfigSelect label={t("fileInput.detail")} value={config.detail}
            options={["auto", "low", "high", ...(image ? ["original"] : [])].map((value) => ({
                value, label: value === "original" ? t("fileInput.original") : t(value),
            }))}
            onChange={(detail) => updateConfig(detail ? { detail: detail as OpenAIFileConfig["detail"] } : {})} />
    </Card>;
};
