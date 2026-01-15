import type { AudioContent } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";
import { normalizeAudioSource } from "./audioSource";
import { useEffect } from "react";

interface AudioCardProps {
  block: AudioContent
}

export const AudioCard = ({ block }: AudioCardProps) => {
  const { Card, AudioPlayer } = useTheme();
  const raw = `data:${block.mimeType};base64,${block.data}`;
  const { src, revoke } = normalizeAudioSource(raw);

  useEffect(() => revoke, [revoke]);

  return (
    <Card title={block.mimeType}>
      <div>
        {src && (
          <AudioPlayer
            src={src}
          />
        )}
      </div>
    </Card>
  );
};
