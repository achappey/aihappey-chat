import { useState } from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { ChatSettingsModal } from "./ChatSettingsModal";

export interface ChatSettingsButtonOptions {
  temperature?: number;
  temperatureChanged?: any;
  resetDefaults?: any;
  providerMetadata: any;
  setProviderMetadata: (meta: any) => void;
}

export const ChatSettingsButton = (props: ChatSettingsButtonOptions) => {
  const {
    temperature,
    temperatureChanged,
    providerMetadata,
    resetDefaults,
    setProviderMetadata,
  } = props;
  const { Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

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
        open={open}
        onClose={() => setOpen(false)}
        setTemperature={temperatureChanged}
        temperature={temperature}
        resetDefaults={resetDefaults}
        providerMetadata={providerMetadata}
        setProviderMetadata={setProviderMetadata}
      />
    </>
  );
};
