import { useTheme } from "../theme/ThemeContext";
import { SpeechResponse } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps, Provider } from "aihappey-types";
import { useEffect, useState } from "react";
import { format } from "timeago.js";
import { useDarkMode } from "usehooks-ts";
import { CostBadge } from "../badges";
import { normalizeAudioSource, type AudioSourceInput } from "./audioSource";

interface SpeechCardProps {
  speech: SpeechResponse;
  onDelete?: () => void;
  providers?: Record<string, Provider>;
}

const getGatewayCost = (providerMetadata?: Record<string, any>) => {
  const cost = providerMetadata?.gateway?.cost;
  return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;
};

const isJsonObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const downloadUrl = (url: string, filename: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  try {
    downloadUrl(url, filename);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

const extensionByMimeType: Record<string, string> = {
  "audio/aac": "aac",
  "audio/flac": "flac",
  "audio/l16": "wav",
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/webm": "webm",
  "audio/x-m4a": "m4a",
  "audio/x-wav": "wav",
};

const getMimeTypeFromDataUri = (audio: string) => {
  const match = audio.match(/^data:([^;,]+)[;,]/);
  return match?.[1]?.trim().toLocaleLowerCase();
};

const getExtensionFromUrl = (audio: string) => {
  try {
    const url = new URL(audio, window.location.href);
    const extension = url.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLocaleLowerCase();
    return extension;
  } catch {
    return undefined;
  }
};

const getAudioExtension = (audio: SpeechResponse["audio"], src?: string) => {
  if (audio instanceof Uint8Array) return "audio";

  if (audio && typeof audio === "object") {
    const mimeType = (audio as any).mimeType ?? (audio as any).mime_type;
    if (typeof mimeType === "string") {
      const normalizedMimeType = mimeType.split(";")[0].trim().toLocaleLowerCase();
      if (extensionByMimeType[normalizedMimeType]) return extensionByMimeType[normalizedMimeType];
      if (normalizedMimeType.startsWith("audio/")) return normalizedMimeType.slice("audio/".length).split("+")[0];
    }

    if ((audio as any).format?.toLocaleLowerCase?.() === "pcm") return "wav";
  }

  if (typeof audio === "string") {
    const mimeType = getMimeTypeFromDataUri(audio);
    if (mimeType && extensionByMimeType[mimeType]) return extensionByMimeType[mimeType];
    if (mimeType?.startsWith("audio/")) return mimeType.slice("audio/".length).split("+")[0];
    const extension = getExtensionFromUrl(audio);
    if (extension) return extension;
  }

  if (src?.startsWith("blob:")) return "wav";
  return "audio";
};

const getSpeechDownloadFilename = (speech: SpeechResponse, src?: string) => {
  const model = speech.response?.modelId?.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "speech";
  const timestamp = speech.response?.timestamp ? new Date(speech.response.timestamp).toISOString().replace(/[:.]/g, "-") : "audio";
  const extension = getAudioExtension(speech.audio, src);
  return `${model}-${timestamp}.${extension}`;
};

const downloadSpeechAudio = (speech: SpeechResponse, src?: string) => {
  const filename = getSpeechDownloadFilename(speech, src);

  if (speech.audio instanceof Uint8Array) {
    const bytes = new Uint8Array(speech.audio);
    downloadBlob(new Blob([bytes.buffer], { type: "application/octet-stream" }), filename);
    return;
  }

  if (src) {
    downloadUrl(src, filename);
  }
};

const getProvider = (
  providers: Record<string, Provider> | undefined,
  key: string | undefined
) => {
  if (!providers || !key) return undefined;

  return providers[key] ?? providers[key.toLocaleLowerCase()];
};

const getProviderKeyFromMetadata = (
  providerMetadata: Record<string, any> | undefined,
  providers: Record<string, Provider> | undefined
) => {
  if (!providerMetadata || !providers) return undefined;

  return Object.keys(providerMetadata).find((key) => {
    const normalizedKey = key.trim().toLocaleLowerCase();
    return normalizedKey !== "gateway" && !!getProvider(providers, normalizedKey);
  });
};

export const SpeechCard = ({ speech, onDelete, providers }: SpeechCardProps) => {
  const { Card, Menu, AudioPlayer, Image, Modal, JsonViewer, Button } = useTheme();
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [src, setSrc] = useState<string>();
  const [requestOpen, setRequestOpen] = useState(false);
  const providerMetadata = speech.providerMetadata;
  const gatewayCost = getGatewayCost(providerMetadata);
  const providerKey = getProviderKeyFromMetadata(providerMetadata, providers);
  const provider = getProvider(providers, providerKey);
  const requestBody = speech.request?.body;
  const hasRequestBodyJsonObject = isJsonObject(requestBody);
  const providerIcon = provider?.icons?.find((icon: any) => icon.theme === (isDarkMode ? "dark" : "light"))
    ?? provider?.icons?.[0];
  const providerImage = providerIcon?.src ? (
    <Image
      height={40}
      shape="square"
      src={providerIcon.src}
      title={provider?.name ?? providerKey}
    />
  ) : undefined;

  useEffect(() => {
    const { src, revoke } = normalizeAudioSource(speech.audio as AudioSourceInput);
    setSrc(src);
    return revoke;
  }, [speech.audio]);

  const menuItems: MenuItemProps[] = [
    {
      key: "download",
      label: t("download"),
      icon: "download",
      onClick: () => downloadSpeechAudio(speech, src),
      disabled: !src && !(speech.audio instanceof Uint8Array),
    },
    ...(hasRequestBodyJsonObject
      ? [{ key: "view-request", label: t("viewRequest", "View request"), icon: "eye" as const, onClick: () => setRequestOpen(true) }]
      : []),
    ...(onDelete ? [{ key: "delete", label: t("delete"), icon: "delete" as const, onClick: onDelete }] : []),
  ];

  return (
    <>
      <Card title={speech?.response?.modelId}
        description={<div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            {format(speech?.response?.timestamp, i18n.language)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", transform: "translateY(2px)" }}>
            <CostBadge cost={gatewayCost} size="small" />
          </span>
        </div>}
        image={providerImage}
        headerActions={menuItems.length > 0 ? <Menu items={menuItems} /> : undefined}>
        <div>
          {src && (
            <AudioPlayer
              src={src}
            />
          )}
        </div>
      </Card>

      <Modal
        show={requestOpen}
        onHide={() => setRequestOpen(false)}
        title={t("viewRequest", "View request")}
        size="large"
        actions={
          <Button variant="secondary" onClick={() => setRequestOpen(false)}>
            {t("close")}
          </Button>
        }
      >
        <JsonViewer value={requestBody} />
      </Modal>
    </>
  );
};
