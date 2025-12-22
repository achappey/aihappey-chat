import { useState } from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { AgentSettingsModal } from "./AgentSettingsModal";
import { useAppStore } from "aihappey-state";

export interface AgentSettingsButtonOptions {
  resetDefaults?: any;
}

export const AgentSettingsButton = (props: AgentSettingsButtonOptions) => {
  const {
    resetDefaults,
  } = props;
  const { Button } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectedAgentNames = useAppStore(a => a.selectedAgentNames)
  const agents = useAppStore(a => a.agents)
  const selectedAgents = selectedAgentNames.map(a => agents.find(z => z.name == a))

  return (
    <>
      <Button
        type="button"
        icon="chatSettings"
        size="large"
        disabled={selectedAgents.length == 0}
        variant="transparent"
        onClick={() => setOpen(true)}
        title={t("agentSettings")}
      />
      <AgentSettingsModal
        open={open}
        onClose={() => setOpen(false)}
        resetDefaults={resetDefaults}
      />
    </>
  );
};
