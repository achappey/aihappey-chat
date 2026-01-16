import { useState } from "react";

import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../theme/ThemeContext";
import { RerankingSettingsModal } from "../modals";

export interface RerankingSettingsButtonProps {
    topN?: number;
    setTopN: (topN?: number) => void;
    enabledProviders: string[];
    providerMetadata: Record<string, any>;
    setProviderMetadata: (meta: Record<string, any>) => void;

    resetDefaults?: () => void;
}

export const RerankingSettingsButton: React.FC<RerankingSettingsButtonProps> = ({
    topN,
    setTopN,
    providerMetadata,
    enabledProviders,
    setProviderMetadata,
    resetDefaults,
}) => {
    const { Button } = useTheme();
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                type="button"
                icon="rerankingSettings"
                size="large"
                variant="transparent"
                title={t("rerankingSettings") ?? "Reranking settings"}
                onClick={() => setOpen(true)}
            />

            <RerankingSettingsModal
                open={open}
                enabledProviders={enabledProviders}
                topN={topN}
                setTopN={setTopN}
                providerMetadata={providerMetadata}
                setProviderMetadata={setProviderMetadata}
                resetDefaults={resetDefaults}
                onClose={() => setOpen(false)}
            />
        </>
    );
};

