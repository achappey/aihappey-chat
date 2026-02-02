import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { VideoSettingsModal } from "./VideoSettingsModal";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";

export interface VideoSettingsButtonOptions {
  resetDefaults?: any;
  providerMetadata: any;
  setProviderMetadata: (meta: any) => void;
}

export const VideoSettingsButton = (props: VideoSettingsButtonOptions) => {
  const { providerMetadata, resetDefaults, setProviderMetadata } = props;
  const { Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showProviderKeys, setShowProviderKeys] = useState(false);

  return (
    <>
      <Button
        type="button"
        icon="videoSettings"
        size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("videoSettings.title")}
      />
      <VideoSettingsModal
        open={open && !showProviderKeys}
        onClose={() => setOpen(false)}
        onEditProviderKeys={() => setShowProviderKeys(true)}
        resetDefaults={resetDefaults}
        providerMetadata={providerMetadata}
        setProviderMetadata={setProviderMetadata}
      />
      <ProviderKeysModal open={showProviderKeys} onClose={() => setShowProviderKeys(false)} />
    </>
  );
};
