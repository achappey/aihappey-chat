import { useTheme } from "../theme/ThemeContext";
import { ModelOption } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";
import { format } from "timeago.js";
import { useTranslation } from "aihappey-i18n";
import { ContextWindowBadge, MaxOutputTokensBadge } from "../badges";

type ModelCardProps = {
  model: ModelOption;
  image?: string
  locale?: string
  onChat?: () => void
};

export const ModelCard = ({ model, image, onChat, locale }: ModelCardProps) => {
  const { Card, Image, Badge, Button } = useTheme();
  const { t } = useTranslation();
  const imageItem = image ? <Image
    height={32}
    shape="square"
    src={image} /> : undefined;

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const isNew =
    typeof model.created === "number" &&
    Date.now() - model.created * 1000 <= THIRTY_DAYS_MS;
  //{model?.owned_by}
  const description = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {(model.context_window ?? 0) > 0 && (
        <ContextWindowBadge context_window={model.context_window!} />
      )}

      {(model.max_tokens ?? 0) > 0 && (
        <MaxOutputTokensBadge mex_output_tokens={model.max_tokens!} />
      )}
    </span>
  );
const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

const loadTime = new Date(
  performance.timeOrigin + nav.loadEventEnd
);

console.log(loadTime);


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
