import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { TranscriptionSettingsModal } from "../modals";

export interface TranscriptionSettingsButtonProps {
  enabledProviders: string[];

  providerMetadata: any;
  setProviderMetadata: (meta: any) => void;

  resetDefaults?: () => void;
}

export const TranscriptionSettingsButton: React.FC<
  TranscriptionSettingsButtonProps
> = ({
  enabledProviders,
  providerMetadata,
  setProviderMetadata,
  resetDefaults,
}) => {
  const { Button } = useTheme();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [showProviderKeys, setShowProviderKeys] = useState(false);

  return (
    <>
      <Button
        type="button"
        icon="transcriptionSettings"
        size="large"
        variant="transparent"
        title={t("transcriptionSettings")}
        onClick={() => setOpen(true)}
      />

      <TranscriptionSettingsModal
        open={open}
        enabledProviders={enabledProviders}
        providerMetadata={providerMetadata}
        setProviderMetadata={setProviderMetadata}
        resetDefaults={resetDefaults}
        onEditProviderKeys={() => setShowProviderKeys(true)}
        onClose={() => setOpen(false)}
      />

    </>
  );
};
