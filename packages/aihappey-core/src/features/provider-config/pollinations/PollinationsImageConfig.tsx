import { useTranslation } from "aihappey-i18n";
import { PollinationsImageConfigForm } from "aihappey-components";

export const PollinationsImageConfig = ({
  pollinations,
  updatePollinations,
}: {
  pollinations: any;
  updatePollinations: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (<PollinationsImageConfigForm
    config={pollinations}
    translations={{
      formTitle: t('general'),
      enhance: t('providers:pollinations.enhance'),
      enhanceHint: t('providers:pollinations.enhanceHint'),
      private: t('providers:pollinations.private'),
      privateHint: t('providers:pollinations.privateHint'),
    }}
    updateConfig={updatePollinations} />)
};
