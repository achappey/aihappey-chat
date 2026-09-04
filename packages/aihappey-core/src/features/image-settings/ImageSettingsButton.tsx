import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ImageSettingsModal } from "./ImageSettingsModal";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";

export interface ImageSettingsButtonOptions {
  selectedModel?: string;
  temperature?: number;
  temperatureChanged?: any;
  resetDefaults?: any;
  providerMetadata: any;
  setProviderMetadata: (meta: any) => void;
}

export const ImageSettingsButton = (props: ImageSettingsButtonOptions) => {
  const {
    selectedModel,
    temperature,
    temperatureChanged,
    providerMetadata,
    resetDefaults,
    setProviderMetadata,
  } = props;
  const { Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showProviderKeys, setShowProviderKeys] = useState(false);

  return (
    <>
      <Button
        type="button"
        icon="imageSettings"
        size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("imageSettings.title")}
      />
      <ImageSettingsModal
        selectedModel={selectedModel}
        open={open && !showProviderKeys}
        onClose={() => setOpen(false)}
        setTemperature={temperatureChanged}
        temperature={temperature}
        onEditProviderKeys={() => setShowProviderKeys(true)}
        resetDefaults={resetDefaults}
        providerMetadata={providerMetadata}
        setProviderMetadata={setProviderMetadata}
      />
      <ProviderKeysModal open={showProviderKeys} onClose={() => setShowProviderKeys(false)} />
    </>
  );
};
