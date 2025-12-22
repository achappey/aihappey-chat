import { useTheme } from "../theme/ThemeContext";

interface TextCardProps {
  block: { type: "text"; text: string };
  translations?: any
  renderText?: (text: string) => React.ReactNode;
}

export const TextCard = ({ block, renderText, translations }: TextCardProps) => {
  const { Card } = useTheme();
  return (
    <Card title={translations?.text ?? "text"} size="small">
      {renderText ? renderText(block.text) : block.text}
    </Card>
  );
};
