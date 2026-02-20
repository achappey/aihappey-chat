import { useTheme } from "aihappey-components";

type Props = {
  title: string;
  description: string;
};

export const MeshNoDataCard = ({ title, description }: Props) => {
  const { Card, Text } = useTheme();

  return (
    <Card title={title}>
      <Text as="p" align={"center"}>
        {description}
      </Text>
    </Card>
  );
};

