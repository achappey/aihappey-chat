import { useTheme } from "../theme/ThemeContext";
import { ModelOption } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";
import { format } from "timeago.js";
import { useTranslation } from "aihappey-i18n";

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
      description={model?.owned_by}

      size="small"
    >
      <LimitedTextField text={model?.description} />
    </Card>
  );
};
