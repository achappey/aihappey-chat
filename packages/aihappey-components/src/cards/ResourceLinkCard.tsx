import type { ResourceLink } from "@modelcontextprotocol/sdk/types";
import { OpenLinkButton } from "../buttons";
import { useTheme } from "../theme/ThemeContext";

interface ResourceLinkCardProps {
  block: ResourceLink;
  translations?: any
}

export const ResourceLinkCard = ({ block, translations }: ResourceLinkCardProps) => {
  const { Card, Image } = useTheme();
  return (
    <Card
      title={block.name ?? block.uri}
      description={block.mimeType}
      size="small"
      actions={
        <OpenLinkButton
          size="small"
          url={block.uri}
          variant="transparent"
        />
      }
    >
      {block.mimeType?.startsWith("audio/")
        &&
        <audio controls style={{ width: "100%", height: 50 }}>
          <source src={block.uri} type={block.mimeType} />
          {translations?.noAudioSupport ?? 'noAudioSupport'}
        </audio>
      }

      {block.mimeType?.startsWith("video/")
        && <video autoPlay muted playsInline controls
          style={{ maxWidth: "100%" }}>
          <source src={block.uri} type={block.mimeType} />
          {translations?.noVideoSupport ?? 'noVideoSupport'}
        </video>
      }
      {block.mimeType?.startsWith("image/") && <Image src={block.uri} fit="contain">
      </Image>}</Card>
  );
};