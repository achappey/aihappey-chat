import { ImageContent } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "aihappey-components";


interface ImageContentViewProps {
  block: { type: "image"; data: string; mimeType: string };
}

export const ImageContentView = ({ block }: ImageContentViewProps) => {
  const { Card, Image } = useTheme();
  const src = `data:${block.mimeType};base64,${block.data}`;

  return (
    <Card title={block.mimeType} size="small">
      <Image fit="cover" src={src} />
    </Card>
  );
};
