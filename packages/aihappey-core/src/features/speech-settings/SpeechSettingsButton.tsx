import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { SpeechSettingsModal } from "./SpeechSettingsModal";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";

export interface SpeechSettingsButtonOptions {
  providerMetadata: any;
  setProviderMetadata: (meta: any) => void;
  selectedModel: string;
  resetDefaults?: () => void;
}

export const SpeechSettingsButton = (props: SpeechSettingsButtonOptions) => {
  const { providerMetadata, setProviderMetadata, selectedModel, resetDefaults } = props;
  const { Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showProviderKeys, setShowProviderKeys] = useState(false);

  return (
    <>
      <Button
        type="button"
        icon="speechSettings"
        size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("speechSettings.title")}
      />

      <SpeechSettingsModal
        open={open && !showProviderKeys}
        onClose={() => setOpen(false)}
        onEditProviderKeys={() => setShowProviderKeys(true)}
        resetDefaults={resetDefaults}
        providerMetadata={providerMetadata}
        setProviderMetadata={setProviderMetadata}
        selectedModel={selectedModel}
      />

      <ProviderKeysModal
        open={showProviderKeys}
        onClose={() => setShowProviderKeys(false)}
      />
    </>
  );
};

