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
  const { Switch, Button } = useTheme();
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.language ?? []).includes(selectedModel);
  const { t } = useTranslation();

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
          <Button
            variant="subtle"
            size="small"
            icon={isFavorite ? "starFilled" : "star"}
            onClick={() => selectedModel && toggleFavoriteModelForType("language", selectedModel)}
            disabled={!selectedModel}
            title={isFavorite ? t("unfavorite_model") : t("favorite_model")}
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
