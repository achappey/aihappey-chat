import type { ImageContent } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";

interface ImageCardProps {
  image: ImageContent
  fit?: "none" | "center" | "contain" | "cover" | "default" | undefined
}

export const ImageCard = ({ image, fit }: ImageCardProps) => {
  const { Card, Image } = useTheme();
  const src = `data:${image.mimeType};base64,${image.data}`;
  return (
    <Card title={image.mimeType}>
      <Image src={src} fit={fit} />
    </Card>
  );
};
