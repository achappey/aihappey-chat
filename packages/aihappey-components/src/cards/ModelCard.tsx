import { useTheme } from "../theme/ThemeContext";
import { getModelDisplayId, getModelDisplayName, type IconToken, ModelOption } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTranslation } from "aihappey-i18n";
import { ContextWindowBadge, MaxOutputTokensBadge } from "../badges";
import type { Provider } from "aihappey-types";
import { useDarkMode } from "usehooks-ts";
import { ModelFavoriteToggleButton } from "../buttons/ModelFavoriteToggleButton";

type ModelCardProps = {
  model: ModelOption;
  locale?: string
  onLaunch?: () => void
  launchIcon?: IconToken
  onChat?: () => void
  provider?: Provider
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

const DEFAULT_LAUNCH_ICON_BY_MODEL_TYPE: Partial<Record<string, IconToken>> = {
  language: "chat",
  video: "video",
  speech: "speech",
  transcription: "transcription",
  reranking: "reranking",
  image: "image",
};

export const ModelCard = ({ model, onLaunch, launchIcon, onChat, provider, isFavorite = false, onToggleFavorite }: ModelCardProps) => {
  const { Card, Image, Badge, Button } = useTheme();
  const { t } = useTranslation();
  const isDarkMode = useDarkMode();


  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const isNew =
    typeof model.created === "number" &&
    Date.now() - model.created * 1000 <= THIRTY_DAYS_MS;

  const description = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {(model.context_window ?? 0) > 0 && (
        <ContextWindowBadge context_window={model.context_window!} />
      )}

      {(model.max_tokens ?? 0) > 0 && (
        <MaxOutputTokensBadge mex_output_tokens={model.max_tokens!} />
      )}

      {model.tags?.includes("real-time") && (
        <Badge bg="subtle"
          size="small"
          appearance={"tint"}
          icon="realtime">{t('realtime')}</Badge>
      )}
    </span>
  );

  const iconImage =
    provider?.icons?.find(i => i.theme === (isDarkMode ? "dark" : "light"))?.src ??
    provider?.icons?.[0]?.src;
  const providerWebsiteUrl = provider?.urls?.homepage;
  const displayId = getModelDisplayId(model);
  const displayName = getModelDisplayName(model);

  const providerImage = iconImage ? <Image
    height={32}
    title={provider?.name}
    shape="square"
    src={iconImage} /> : undefined;

  const imageItem = providerImage && providerWebsiteUrl ? (
    <a
      href={providerWebsiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: "inline-flex" }}
    >
      {providerImage}
    </a>
  ) : providerImage;

  const launchAction = onLaunch
    ? { handler: onLaunch, icon: launchIcon ?? DEFAULT_LAUNCH_ICON_BY_MODEL_TYPE[model.type] }
    : onChat && model.type === "language"
      ? { handler: onChat, icon: "chat" as IconToken }
      : undefined;

  const launchButton = launchAction?.icon
    ? <Button icon={launchAction.icon}
      size="small"
      variant="transparent"
      onClick={launchAction.handler} /> : undefined;

  const actions = <>

    <Button
      icon="copyClipboard"
      size="small"
      variant="transparent"
      title={displayId}
      onClick={() => navigator.clipboard.writeText(displayId)} />

    {launchButton}

    {onToggleFavorite && (
        <ModelFavoriteToggleButton
        modelName={displayName}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        size="small"
        variant="transparent"
      />
    )}
  </>;

  return (
    <Card
      title={displayName}
      image={imageItem}
      actions={actions}
      headerActions={<>{isNew && <>{" "}<Badge>{t("new")}</Badge></>}</>}
      description={description}
      size="small"
    >
      <LimitedTextField text={model?.description} />
    </Card>
  );
};
