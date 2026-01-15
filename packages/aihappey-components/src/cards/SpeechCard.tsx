import { useTheme } from "../theme/ThemeContext";
import { SpeechResponse } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps } from "aihappey-types";
import { useEffect, useState } from "react";
import { format } from "timeago.js";
import { normalizeAudioSource } from "./audioSource";

interface SpeechCardProps {
  speech: SpeechResponse;
  onDelete?: () => void;
}

export const SpeechCard = ({ speech, onDelete }: SpeechCardProps) => {
  const { Card, Menu, AudioPlayer } = useTheme();
  const { t, i18n } = useTranslation();
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    const { src, revoke } = normalizeAudioSource(speech.audio as string);
    setSrc(src);
    return revoke;
  }, [speech.audio]);

  const menuItems: MenuItemProps[] = onDelete
    ? [{ key: "delete", label: t("delete"), onClick: onDelete }]
    : [];

  return (
    <Card title={speech?.response?.modelId}
      description={<>{format(speech?.response?.timestamp, i18n.language)}</>}
      headerActions={onDelete ? <Menu items={menuItems} /> : undefined}>
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
