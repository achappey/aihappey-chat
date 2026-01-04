import { SpeechSettings, SpeechSettingsForm } from "aihappey-components";
import { useAppStore } from "aihappey-state";

export const SpeechSettingsGeneralTab = ({
  onEditProviderKeys: _onEditProviderKeys,
}: {
  onEditProviderKeys?: () => void;
}) => {
  const voice = useAppStore((s) => s.voice);
  const outputFormat = useAppStore((s) => s.speechOutputFormat);
  const instructions = useAppStore((s) => s.speechInstructions);
  const speed = useAppStore((s) => s.speed);
  const language = useAppStore((s) => s.speechLanguage);

  const setVoice = useAppStore((s) => s.setVoice);
  const setOutputFormat = useAppStore((s) => s.setOutputFormat);
  const setInstructions = useAppStore((s) => s.setInstructions);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const onChange = (next: SpeechSettings) => {
    if (next.voice !== voice) setVoice(next.voice);
    if (next.outputFormat !== outputFormat) setOutputFormat(next.outputFormat);
    if (next.instructions !== instructions) setInstructions(next.instructions);
    if (next.speed !== speed) setSpeed(next.speed);
    if (next.language !== language) setLanguage(next.language);
  };

  const settings: SpeechSettings = {
    voice,
    outputFormat,
    instructions,
    speed,
    language,
  };

  return <SpeechSettingsForm value={settings} onChange={onChange} />;
};

