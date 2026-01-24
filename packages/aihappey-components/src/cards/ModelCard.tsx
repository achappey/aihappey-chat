import { useTheme } from "../theme/ThemeContext";
import { ModelOption } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTranslation } from "aihappey-i18n";
import { ContextWindowBadge, MaxOutputTokensBadge } from "../badges";
import type { Provider } from "aihappey-types";
import { useDarkMode } from "usehooks-ts";

type ModelCardProps = {
  model: ModelOption;
  locale?: string
  onChat?: () => void
  provider?: Provider
};

export const ModelCard = ({ model, onChat, provider }: ModelCardProps) => {
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

  const imageItem = iconImage ? <Image
    height={32}
    title={provider?.name}
    shape="square"
    src={iconImage} /> : undefined;

  const actions = onChat && model.type == "language"
    ? <Button icon="chat"
      size="small"
      variant="transparent"
      onClick={onChat} /> : undefined;

  return (
    <Card
      title={model?.name ?? model?.id}
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
