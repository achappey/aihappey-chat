import { useTheme } from "../theme/ThemeContext";
import { SpeechResponse } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps } from "aihappey-types";
import { useEffect, useState } from "react";
import { format } from "timeago.js";

interface SpeechCardProps {
  speech: SpeechResponse;
  onDelete?: () => void;
}

/** detect Google-style PCM data URI */
const isPcmDataUri = (audio?: string) =>
  typeof audio === "string" &&
  audio.startsWith("data:audio/L16;codec=pcm");

/** PCM (LINEAR16) → WAV blob URL */
const pcmDataUriToWavUrl = (dataUri: string): string => {
  const match = dataUri.match(
    /^data:audio\/L16;codec=pcm;rate=(\d+);base64,(.+)$/
  );

  if (!match) throw new Error("Invalid PCM data URI");

  const sampleRate = Number(match[1]);
  const base64 = match[2];

  const pcmBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const wavBuffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(wavBuffer);

  let o = 0;
  const write = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o++, s.charCodeAt(i));
  };

  write("RIFF");
  view.setUint32(o, 36 + pcmBytes.length, true); o += 4;
  write("WAVE");
  write("fmt ");
  view.setUint32(o, 16, true); o += 4;
  view.setUint16(o, 1, true); o += 2;   // PCM
  view.setUint16(o, 1, true); o += 2;   // mono
  view.setUint32(o, sampleRate, true); o += 4;
  view.setUint32(o, sampleRate * 2, true); o += 4;
  view.setUint16(o, 2, true); o += 2;   // block align
  view.setUint16(o, 16, true); o += 2;  // bits
  write("data");
  view.setUint32(o, pcmBytes.length, true); o += 4;

  new Uint8Array(wavBuffer, 44).set(pcmBytes);

  return URL.createObjectURL(new Blob([wavBuffer], { type: "audio/wav" }));
};

export const SpeechCard = ({ speech, onDelete }: SpeechCardProps) => {
  const { Card, Menu } = useTheme();
  const { t } = useTranslation();
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    if (!speech.audio) return;

    if (isPcmDataUri(speech.audio)) {
      const wavUrl = pcmDataUriToWavUrl(speech.audio);
      setSrc(wavUrl);
      return () => URL.revokeObjectURL(wavUrl);
    }

    // passthrough for mp3 / wav / ogg / blob / http
    setSrc(speech.audio);
  }, [speech.audio]);

  const menuItems: MenuItemProps[] = onDelete
    ? [{ key: "delete", label: t("delete"), onClick: onDelete }]
    : [];

  return (
    <Card title={speech?.response?.modelId}
      description={<>{format(speech?.response?.timestamp)}</>}
      headerActions={onDelete ? <Menu items={menuItems} /> : undefined}>
      {src && (
        <audio
          controls
          preload="metadata"
          style={{ width: "100%", height: 50 }}
          src={src}
        />
      )}
    </Card>
  );
};
