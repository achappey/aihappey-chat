import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { ModelFavoriteToggleButton, StickyHeaderBar, useTheme } from "aihappey-components";

type WebAppDetailHeaderProps = {
  chatOpen: boolean;
  onToggleChat: () => void;
};

export const WebAppDetailHeader = ({
  chatOpen,
  onToggleChat,
}: WebAppDetailHeaderProps) => {
  const { Switch } = useTheme();
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.language ?? []).includes(selectedModel);
  const selectedModelOption = models?.find((model) => model.id === selectedModel);

  return (
    <StickyHeaderBar

      leftContent={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ModelSelect
            models={models ?? []}
            modelTypes={["language"]}
            value={selectedModel ?? ""}
            onChange={setSelectedModel}
          />
          <ModelFavoriteToggleButton
            variant="subtle"
            size="small"
            isFavorite={isFavorite}
            modelName={selectedModelOption?.name ?? selectedModel}
            onToggleFavorite={() => selectedModel && toggleFavoriteModelForType("language", selectedModel)}
            disabled={!selectedModel}
          />
        </div>
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
