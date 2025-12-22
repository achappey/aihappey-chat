import { useTheme } from "../theme/ThemeContext";
import { ModelOption } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";

type ModelCardProps = {
  model: ModelOption;
  image?: string
  onChat?: () => void
};

export const ModelCard = ({ model, image, onChat }: ModelCardProps) => {
  const { Card, Image, Badge, Button } = useTheme();
  const imageItem = image ? <Image
    height={32}
    shape="square"
    src={image} /> : undefined;

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
      description={model?.owned_by}
      size="small"
    >
      <LimitedTextField text={model?.description} />
    </Card>
  );
};
