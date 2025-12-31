import type { ResourceLink } from "aihappey-mcp";
import { OpenLinkButton } from "../buttons";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

interface ResourceLinkCardProps {
  block: ResourceLink;
}

export const ResourceLinkCard = ({ block }: ResourceLinkCardProps) => {
  const { Card, Image } = useTheme();
  const { t } = useTranslation();
  
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
          {t('noAudioSupport')}
        </audio>
      }

      {block.mimeType?.startsWith("video/")
        && <video autoPlay muted playsInline controls
          style={{ maxWidth: "100%" }}>
          <source src={block.uri} type={block.mimeType} />
          {t('noVideoSupport')}
        </video>
      }
      {block.mimeType?.startsWith("image/") && <Image src={block.uri} fit="contain">
      </Image>}</Card>
  );
};