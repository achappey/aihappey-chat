import type { ElicitResult, ElicitRequest } from "aihappey-mcp";
import { useTranslation } from "aihappey-i18n";
import { useAccount } from "aihappey-auth";
import { ElicitationForm as ElicitationFormComponent } from "aihappey-components";

type Props = {
  params: ElicitRequest["params"];
  onRespond: (r: ElicitResult) => void;
};

export const ElicitationForm = ({ params, onRespond }: Props) => {
  const { t } = useTranslation();
  const account = useAccount();
  const getMeta = () => ({
    timestamp: new Date().toISOString(),
    author: account?.username,
  });

  const respond = (resp: ElicitResult) => onRespond({
    ...resp,
    _meta: getMeta(),
  });

  return <ElicitationFormComponent params={params} onRespond={respond} translations={{
    accept: t('mcp.accept'),
    decline: t('mcp.decline'),
    cancel: t('mcp.cancel')
  }} />
 
};