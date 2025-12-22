import { TextCard, useTheme } from "aihappey-components";
import { Markdown } from "../../../../ui/markdown/Markdown";

interface TextContentViewProps {
  block: { type: "text"; text: string };
}

export const TextContentView = ({ block }: TextContentViewProps) => {
  return (
    <TextCard
      block={block}
      renderText={text => <Markdown text={text} />}
    />
  );
};
