import { useTheme } from "../theme/ThemeContext";

interface AudioCardProps {
  block: { type: "audio"; data: string; mimeType: string };
}

export const AudioCard = ({ block }: AudioCardProps) => {
  const { Card } = useTheme();
  const src = `data:${block.mimeType};base64,${block.data}`;
  return (
    <Card title={block.mimeType}>
      <audio controls style={{ width: "100%", height: 50 }}>
        <source src={src} type={block.mimeType} />
        Your browser does not support the audio element.
      </audio>
    </Card>
  );
};
