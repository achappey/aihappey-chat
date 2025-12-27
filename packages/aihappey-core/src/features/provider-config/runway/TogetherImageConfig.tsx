import { useTranslation } from "aihappey-i18n";
import { RunwayImageConfigForm, TogetherImageConfigForm } from "aihappey-components";

export const RunwayImageConfig = ({
  runway,
  updateRunway,
}: {
  runway: any;
  updateRunway: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (<RunwayImageConfigForm
    config={runway}
    translations={{
      formTitle: t('providers:runway.contentModeration'),
      publicFigureThreshold: t('providers:runway.publicFigureThreshold'),
      low: t('low'),
      auto: t('auto')
    }}
    updateConfig={updateRunway} />)
};
