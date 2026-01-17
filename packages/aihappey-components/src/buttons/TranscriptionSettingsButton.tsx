import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { TranscriptionSettingsModal } from "../modals";

export interface TranscriptionSettingsButtonProps {
  enabledProviders: string[];

  providerMetadata: any;
  setProviderMetadata: (meta: any) => void;

  realtimeProviderMetadata: Record<string, any>;
  setRealtimeProviderMetadata: (meta: Record<string, any>) => void;

  resetDefaults?: () => void;

  /** Optional known-speaker sample binding (implemented in aihappey-core). */
  knownSpeakerSamples?: {
    getSampleInfo?: (speakerName: string) => { exists: boolean; tagLabel?: string };
    onUploadSample?: (speakerName: string, files: File[]) => Promise<void> | void;
    onClearSample?: (speakerName: string) => Promise<void> | void;
    onRenameSample?: (fromSpeakerName: string, toSpeakerName: string) => Promise<void> | void;
    onPreviewSample?: (speakerName: string) => Promise<void> | void;
  };
}

export const TranscriptionSettingsButton: React.FC<
  TranscriptionSettingsButtonProps
> = ({
  enabledProviders,
  realtimeProviderMetadata,
  setRealtimeProviderMetadata,
  providerMetadata,
  setProviderMetadata,
  resetDefaults,
  knownSpeakerSamples,
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
          realtimeProviderMetadata={realtimeProviderMetadata}
          setRealtimeProviderMetadata={setRealtimeProviderMetadata}
          providerMetadata={providerMetadata}
          setProviderMetadata={setProviderMetadata}
          resetDefaults={resetDefaults}
          knownSpeakerSamples={knownSpeakerSamples}
          onEditProviderKeys={() => setShowProviderKeys(true)}
          onClose={() => setOpen(false)}
        />

      </>
    );
  };
