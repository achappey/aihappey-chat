import { useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ChatSettingsModal } from "./ChatSettingsModal";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";

export interface ChatSettingsButtonOptions {
  temperature?: number;
  temperatureChanged?: any;
  resetDefaults?: any;
  providerMetadata: any;
  setProviderMetadata: (meta: any | ((current: any) => any)) => void;
  providerHeaders: Record<string, Record<string, string>>;
  setProviderHeaders: (headers: Record<string, Record<string, string>> | ((current: Record<string, Record<string, string>> | undefined) => Record<string, Record<string, string>> | undefined)) => void;
}

export const ChatSettingsButton = (props: ChatSettingsButtonOptions) => {
  const {
    temperature,
    temperatureChanged,
    providerMetadata,
    providerHeaders,
    resetDefaults,
    setProviderMetadata,
    setProviderHeaders,
  } = props;
  const { Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showProviderKeys, setShowProviderKeys] = useState(false);

  return (
    <>
      <Button
        type="button"
        icon="chatSettings"
        size="large"
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("chatSettings")}
      />
      <ChatSettingsModal
        open={open && !showProviderKeys}
        onClose={() => setOpen(false)}
        setTemperature={temperatureChanged}
        temperature={temperature}
        onEditProviderKeys={() => setShowProviderKeys(true)}
        resetDefaults={resetDefaults}
        providerMetadata={providerMetadata}
        setProviderMetadata={setProviderMetadata}
        providerHeaders={providerHeaders}
        setProviderHeaders={setProviderHeaders}
      />
      <ProviderKeysModal open={showProviderKeys} onClose={() => setShowProviderKeys(false)} />
    </>
  );
};
