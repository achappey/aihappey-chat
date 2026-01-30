import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { StickyHeaderBar, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

type WebAppDetailHeaderProps = {
  chatOpen: boolean;
  onToggleChat: () => void;
};

export const WebAppDetailHeader = ({
  chatOpen,
  onToggleChat,
}: WebAppDetailHeaderProps) => {
  const { Switch } = useTheme();
  const { t } = useTranslation();
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);

  return (
    <StickyHeaderBar
    
      leftContent={
        <ModelSelect
          models={models ?? []}
          modelTypes={["language"]}
          value={selectedModel ?? ""}
          onChange={setSelectedModel}
        />
      }
      rightContent={
        <Switch
          id="webapp-chat-toggle"
          checked={chatOpen}
          onChange={onToggleChat}
        />
      }
    />
  );
};
