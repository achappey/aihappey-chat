import { ImageContentView } from "./ImageContentView";
import { EmbeddedResourceView } from "./EmbeddedResourceView";
import { AudioCard, ResourceLinkCard, TextCard } from "aihappey-components";
import { Markdown } from "../../../../ui/markdown/Markdown";

interface ContentBlockViewProps {
  block: any;
}

export const ContentBlockView = ({ block }: ContentBlockViewProps) => {
  if (!block || typeof block !== "object" || !block.type) {
    return null;
  }
  switch (block.type) {
    case "text":
      return <TextCard
        block={block}
        renderText={text => <Markdown text={text} />}
      />;
    case "image":
      return <ImageContentView block={block} />;
    case "audio":
      return <AudioCard block={block} />;
    case "resource_link":
      return <ResourceLinkCard block={block} />;
    case "resource":
      return <EmbeddedResourceView block={block} />;
    default:
      return (
        <div style={{ color: "#888", fontSize: 13 }}>
          Unknown content type: {block.type}
        </div>
      );
  }
};