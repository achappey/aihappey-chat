import { useState, useEffect } from "react";
import { useTheme } from "aihappey-components";

import { PromptArgumentsModal } from "./PromptArgumentsModal";
import { useTranslation } from "aihappey-i18n";
import { useAppStore, Prompt } from "aihappey-state";
import { PromptSelectModal } from "./PromptSelectModal";
import { useAutoPromptExecution } from "./useAutoPromptExecution";

export type PromptWithSource = Prompt & {
  // _url: string;
  //_serverName: string;
  // text?: string;
  _serverName?: string;
};

type PromptSelectButtonProps = {
  model?: string;
  onPromptExecute?: any;
};

export const PromptSelectButton = ({
  model,
  onPromptExecute,
}: PromptSelectButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  const getPrompts = useAppStore((s) => s.getPrompts);
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const [prompts, setPrompts] = useState<PromptWithSource[]>([]);
  const [open, setOpen] = useState(false);
  const [argumentPrompt, setArgumentPrompt] = useState<PromptWithSource | null>(null);
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

      {argumentPrompt && (
        <PromptArgumentsModal
          prompt={argumentPrompt}
          onPromptExecute={async (prompt: any, args: any) => {
            setArgumentPrompt(null);
            setOpen(false);
            await onPromptExecute(prompt, args);
          }}
          model={model}
          onHide={() => setArgumentPrompt(null)}
        />
      )}
    </>
  );
};
