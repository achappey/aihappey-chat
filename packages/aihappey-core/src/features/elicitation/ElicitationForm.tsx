import type { ElicitRequest, ElicitResult } from "aihappey-mcp";
import { useAccount } from "aihappey-auth";
import { ElicitationForm as ElicitationFormComponent } from "aihappey-components";
import { Markdown } from "../../ui/markdown/Markdown";

type Props = {
  params: ElicitRequest["params"];
  onChange: (s: {
    values: Record<string, any>;
    isValid: boolean;
  }) => void;
};

export const ElicitationForm = ({ params, onChange }: Props) => {
  return (
    <ElicitationFormComponent
      params={params}
      onChange={onChange}
      onRenderMarkdown={(text) => <Markdown text={text} />}
    />
  );
};

/**
 * Helper hook to attach MCP meta to any ElicitResult.
 * (Buttons live in the modal, so the modal uses this hook.)
 */
export const useElicitMeta = () => {
  const account = useAccount();

  const withMeta = (r: ElicitResult): ElicitResult => ({
    ...r,
    _meta: {
      timestamp: new Date().toISOString(),
      author: account?.username,
    },
  });

  return { withMeta };
};
