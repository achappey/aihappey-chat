import { useState, useEffect } from "react";
import { useTheme } from "aihappey-components";

import { PromptArgumentsModal } from "./PromptArgumentsModal";
import { useTranslation } from "aihappey-i18n";
import { useAppStore, Prompt } from "aihappey-state";
import { PromptSelectModal } from "./PromptSelectModal";
import { useAutoPromptExecution } from "./useAutoPromptExecution";
import { getPrompts } from "../../runtime/mcp/mcpPrompts";

export type PromptWithSource = Prompt & {
  _serverName?: string;
  _serverTitle?: string;
  _url?: string;
};

type PromptSelectButtonProps = {
  onPromptExecute?: any;
};

export const PromptSelectButton = ({
  onPromptExecute,
}: PromptSelectButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const [prompts, setPrompts] = useState<PromptWithSource[]>([]);
  const [open, setOpen] = useState(false);
  const [argumentPrompt, setArgumentPrompt] = useState<PromptWithSource | undefined>(undefined);
  const hasPrompts = Object.keys(mcpServerContent)
    .filter(a => mcpServerContent[a].capabilities?.prompts)
    .length > 0;

  useEffect(() => {

    if (open) {
      Object.keys(mcpServerContent)
        .filter(a => mcpServerContent[a].capabilities?.prompts)
        .map(a => getPrompts(a)
          .then(z => setPrompts(l => [...l, ...z.map(y => ({
            ...y,
            _serverName: a,
            _serverTitle: mcpServers[a]?.registry?.server.title,
            _url: mcpServers[a]?.config?.url
          }))])))
    }
    else {
      setPrompts([])
    }
  }, [open]);


  useAutoPromptExecution({
    onPromptExecute,
    setArgumentPrompt,
    setOpen,
  });

  return (
    <>
      <Button
        type="button"
        disabled={!hasPrompts}
        variant="transparent"
        size="large"
        icon="prompts"
        onClick={() => setOpen(true)}
        title={t("promptSelectModal.title")}
      ></Button>

      <PromptSelectModal
        open={open}
        prompts={prompts}
        onPromptClick={(p) => {
          if (p.arguments && p.arguments.length > 0) {
            setArgumentPrompt(p);
          } else {
            onPromptExecute(p);
          }
          setOpen(false);
        }}
        onHide={() => setOpen(false)}
      />

      {argumentPrompt && <PromptArgumentsModal
        open={argumentPrompt != undefined}
        prompt={argumentPrompt}
        onPromptExecute={async (prompt: any, args: any) => {
          setArgumentPrompt(undefined);

          await onPromptExecute(prompt, args);
        }}
        onHide={() => {
          setArgumentPrompt(undefined)
          setOpen(true)
        }
        }
      />}
    </>
  );
};
