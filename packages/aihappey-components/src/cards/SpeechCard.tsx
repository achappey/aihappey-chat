import { useTheme } from "../theme/ThemeContext";
import { SpeechResponse } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps, Provider } from "aihappey-types";
import { useEffect, useState } from "react";
import { format } from "timeago.js";
import { useDarkMode } from "usehooks-ts";
import { CostBadge } from "../badges";
import { normalizeAudioSource } from "./audioSource";

interface SpeechCardProps {
  speech: SpeechResponse;
  onDelete?: () => void;
  providers?: Record<string, Provider>;
}

const getGatewayCost = (providerMetadata?: Record<string, any>) => {
  const cost = providerMetadata?.gateway?.cost;
  return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;
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
  const { Card, Menu, AudioPlayer, Image } = useTheme();
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [src, setSrc] = useState<string>();
  const providerMetadata = speech.providerMetadata;
  const gatewayCost = getGatewayCost(providerMetadata);
  const providerKey = getProviderKeyFromMetadata(providerMetadata, providers);
  const provider = getProvider(providers, providerKey);
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
    const { src, revoke } = normalizeAudioSource(speech.audio as string);
    setSrc(src);
    return revoke;
  }, [speech.audio]);

  const menuItems: MenuItemProps[] = onDelete
    ? [{ key: "delete", label: t("delete"), onClick: onDelete }]
    : [];

  return (
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
