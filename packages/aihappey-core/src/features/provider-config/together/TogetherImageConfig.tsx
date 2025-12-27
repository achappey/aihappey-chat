import { useTranslation } from "aihappey-i18n";
import { TogetherImageConfigForm } from "aihappey-components";

export const TogetherImageConfig = ({
  together,
  updateTogether,
}: {
  together: any;
  updateTogether: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (<TogetherImageConfigForm
    config={together}
    translations={{
      formTitle: t('general'),
      guidanceScale: t('providers:together.guidanceScale'),
      negativePrompt: t('providers:together.negativePrompt'),
      steps: t('providers:together.steps'),
      disableSafetyChecker: t('providers:together.disableSafetyChecker'),
    }}
    updateConfig={updateTogether} />)
};
