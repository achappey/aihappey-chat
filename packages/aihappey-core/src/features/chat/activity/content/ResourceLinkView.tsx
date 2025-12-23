import { OpenLinkButton, useTheme } from "aihappey-components";


interface ResourceLinkViewProps {
  block: { type: "resource_link"; uri: string, mimeType?: string, name?: string };
}

export const ResourceLinkView = ({ block }: ResourceLinkViewProps) => {
  const { Card, Button, Image } = useTheme();
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
    >{block.mimeType?.startsWith("video/")
      && <video autoPlay muted playsInline controls
        style={{ maxWidth: "100%" }}>
        <source src={block.uri} type={block.mimeType} />Your browser does not support HTML5 video.
      </video>
      }
      {block.mimeType?.startsWith("image/") && <Image src={block.uri} fit="contain">
      </Image>}</Card>
  );
};