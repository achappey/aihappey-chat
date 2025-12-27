import { useTranslation } from "aihappey-i18n";
import { OpenAIImageConfigForm, PollinationsChatConfigForm, PollinationsImageConfigForm } from "aihappey-components";

export const OpenAIImageConfig = ({
  openai,
  updateOpenAI,
}: {
  openai: any;
  updateOpenAI: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (<OpenAIImageConfigForm
    config={openai}
    translations={{
      quality: t('quality'),
      low: t('low'),
      medium: t('medium'),
      auto: t('auto'),
      high: t('high'),
      moderation: t('moderation'),
      opaque: t('opaque'),
      transparent: t('transparent'),
      background: t('background'),
      formTitle: t('general'),
    }}
    updateConfig={updateOpenAI} />)
};
