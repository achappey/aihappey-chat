import { useTranslation } from "aihappey-i18n";
import { XAIImageConfigForm } from "aihappey-components";

export const XAIImageConfig = ({
  xai,
  updateXAI,
}: {
  xai: any;
  updateXAI: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (<XAIImageConfigForm
    config={xai}
    translations={{
      quality: t('quality'),
      low: t('low'),
      medium: t('medium'),
      high: t('high'),
      formTitle: t('general'),
    }}
    updateConfig={updateXAI} />)
};
