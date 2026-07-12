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
  speechInput?: unknown;
  speechItem?: {
    input?: unknown;
  };
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

const getJsonObjectChildren = (value: unknown): Record<string, unknown> | undefined => {
  if (!isJsonObject(value)) return undefined;
  const children = { ...value };
  return Object.keys(children).length > 0 ? children : undefined;
};

const getSpeechInputText = (value: unknown) => {
  if (!isJsonObject(value)) return undefined;

  const text = value.text;
  return typeof text === "string" && text.trim().length > 0 ? text : undefined;
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

export const SpeechCard = ({ speech, speechInput, speechItem, onDelete, providers }: SpeechCardProps) => {
  const { Card, Menu, AudioPlayer, Image, Modal, JsonViewer, Button, Tabs, Tab, Badge } = useTheme();
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [src, setSrc] = useState<string>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState("input");
  const modelId = speech.response?.modelId;
  const providerMetadata = speech.providerMetadata;
  const gatewayCost = getGatewayCost(providerMetadata);
  const providerKey = getProviderKeyFromMetadata(providerMetadata, providers);
  const provider = getProvider(providers, providerKey);
  const providerDisplayName = provider?.name ?? providerKey ?? modelId?.split("/")?.[0] ?? t("speechProvider", "Provider");
  const inputObject = getJsonObjectChildren(speechInput)
    ?? getJsonObjectChildren(speechItem?.input)
    ?? getJsonObjectChildren((speech as any).input);
  const inputText = getSpeechInputText(inputObject);
  const requestBody = speech.request?.body;
  const hasRequestBodyJsonObject = isJsonObject(requestBody);
  const responseBody = speech.response?.body;
  const hasResponseBodyJsonObject = isJsonObject(responseBody);
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

  useEffect(() => {
    if (!detailsOpen) return;
    setActiveDetailsTab("input");
  }, [detailsOpen]);

  const menuItems: MenuItemProps[] = [
    {
      key: "download",
      label: t("download"),
      icon: "download",
      onClick: () => downloadSpeechAudio(speech, src),
      disabled: !src && !(speech.audio instanceof Uint8Array),
    },
    { key: "details", label: t("details", "Details"), icon: "eye" as const, onClick: () => setDetailsOpen(true) },
    ...(onDelete ? [{ key: "delete", label: t("delete"), icon: "delete" as const, onClick: onDelete }] : []),
  ];

  return (
    <>
      <Card title={modelId}
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
        show={detailsOpen}
        onHide={() => setDetailsOpen(false)}
        title={t("speechDetails", "Speech details")}
        size="large"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="transparent"
              icon="download"
              onClick={() => downloadSpeechAudio(speech, src)}
              disabled={!src && !(speech.audio instanceof Uint8Array)}
            >
              {t("download")}
            </Button>
            <Button variant="secondary" onClick={() => setDetailsOpen(false)}>
              {t("close")}
            </Button>
          </div>
        }
      >
        <Tabs activeKey={activeDetailsTab} onSelect={setActiveDetailsTab}>
          <Tab eventKey="input" title={t("input")}>
            <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {modelId ? (
                <Badge
                  title={modelId}
                  icon="brain"
                  size="small"
                  bg="informative"
                  appearance="ghost"
                >
                  {modelId}
                </Badge>
              ) : undefined}
            </div>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {inputText ?? <span style={{ opacity: 0.7 }}>{t("none")}</span>}
            </div>
          </Tab>

          {hasRequestBodyJsonObject && (
            <Tab eventKey="providerInput" title={t("providerInput", "{{provider}} input", { provider: providerDisplayName })}>
              <JsonViewer value={requestBody} />
            </Tab>
          )}

          {hasResponseBodyJsonObject && (
            <Tab eventKey="providerResult" title={t("providerResult", "{{provider}} result", { provider: providerDisplayName })}>
              <JsonViewer value={responseBody} />
            </Tab>
          )}
        </Tabs>
      </Modal>
    </>
  );
};
