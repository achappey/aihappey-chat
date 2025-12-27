import { useTranslation } from "aihappey-i18n";
import { PollinationsChatConfigForm } from "aihappey-components";

export const PollinationsChatConfig = ({
  pollinations,
  updatePollinations,
}: {
  pollinations: any;
  updatePollinations: (val: any) => void;
}) => {
  const { t } = useTranslation();

  return (<PollinationsChatConfigForm
    config={pollinations}
    translations={{
      reasoning: t("reasoning"),
      reasoningEffort: t("reasoningEffort"),
      [pollinations.reasoning_effort]: t(pollinations.reasoning_effort)
    }}
    updateConfig={updatePollinations} />)
};
