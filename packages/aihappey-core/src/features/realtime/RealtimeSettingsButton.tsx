import { useState } from "react";
import { defaultProviderRealtimeConversationMetadata, useAppStore } from "aihappey-state";
import { RealtimeSettingsModal, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

const defaultRealtimeProviders = ["OpenAI", "xAI"];

export function RealtimeSettingsButton() {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const providerRealtimeConversationMetadata = useAppStore((s) => s.providerRealtimeConversationMetadata);
  const setProviderRealtimeConversationMetadata = useAppStore((s) => s.setProviderRealtimeConversationMetadata);
  const enabledProviders = useAppStore((s: any) => s.enabledProvidersByType?.audio ?? s.enabledProvidersByType?.realtime);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        icon="realtimeSettings"
        size="large"
        variant="transparent"
        title={t("realtime")}
        onClick={() => setOpen(true)}
      />
      <RealtimeSettingsModal
        open={open}
        enabledProviders={enabledProviders ?? defaultRealtimeProviders}
        providerMetadata={providerRealtimeConversationMetadata ?? {}}
        setProviderMetadata={setProviderRealtimeConversationMetadata}
        resetDefaults={() => setProviderRealtimeConversationMetadata(defaultProviderRealtimeConversationMetadata)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

