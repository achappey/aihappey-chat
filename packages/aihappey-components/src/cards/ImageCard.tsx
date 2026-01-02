import type { ImageContent } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";

interface ImageCardProps {
  image: ImageContent
  size?: "small" | "medium" | "large" | undefined
  fit?: "none" | "center" | "contain" | "cover" | "default" | undefined
}

export const ImageCard = ({ image, fit, size }: ImageCardProps) => {
  const { Card, Image } = useTheme();
  const src = `data:${image.mimeType};base64,${image.data}`;
  
  return (
    <Card title={image.mimeType} size={size}>
      <Image src={src} fit={fit} />
    </Card>
  );
};
