import React, { useEffect, useState } from "react";
import { languageNames, useTranslation } from "aihappey-i18n";
import { useAccount } from "aihappey-auth";
import { useIsDesktop } from "../../../shell/responsive/useIsDesktop";
import { useMultiTheme, useTheme } from "aihappey-components";
import { fetchWelcomeMessage } from "../../../runtime/chat-app/welcomeMessage";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../context/ChatContext";
import { useProviderRegistry } from "../../../runtime/providers/useProviderRegistry";

interface WelcomeMessageProps { }

type WelcomeThemeId = "bootstrap" | "shadcn" | "fluent" | "default";

const welcomeSizing: Record<WelcomeThemeId, {
  desktopFontSize: string;
  mobileFontSize: string;
  desktopSkeletonWidth: string;
  mobileSkeletonWidth: string;
  desktopSkeletonHeight: number;
  mobileSkeletonHeight: number;
  desktopGap: string;
  mobileGap: string;
}> = {
  bootstrap: {
    desktopFontSize: "clamp(2.125rem, 3vw, 2.875rem)",
    mobileFontSize: "clamp(1.625rem, 7vw, 2.125rem)",
    desktopSkeletonWidth: "clamp(380px, 35vw, 520px)",
    mobileSkeletonWidth: "clamp(240px, 64vw, 360px)",
    desktopSkeletonHeight: 46,
    mobileSkeletonHeight: 34,
    desktopGap: "0.5rem",
    mobileGap: "0.4375rem",
  },
  shadcn: {
    desktopFontSize: "clamp(1.875rem, 2.45vw, 2.375rem)",
    mobileFontSize: "clamp(1.5rem, 6.5vw, 1.875rem)",
    desktopSkeletonWidth: "clamp(420px, 39vw, 560px)",
    mobileSkeletonWidth: "clamp(260px, 68vw, 380px)",
    desktopSkeletonHeight: 44,
    mobileSkeletonHeight: 34,
    desktopGap: "0.875rem",
    mobileGap: "0.75rem",
  },
  fluent: {
    desktopFontSize: "clamp(1.875rem, 2.4vw, 2.3125rem)",
    mobileFontSize: "clamp(1.5rem, 6.5vw, 1.875rem)",
    desktopSkeletonWidth: "clamp(360px, 34vw, 520px)",
    mobileSkeletonWidth: "clamp(220px, 62vw, 340px)",
    desktopSkeletonHeight: 46,
    mobileSkeletonHeight: 34,
    desktopGap: "0.5rem",
    mobileGap: "0.4375rem",
  },
  default: {
    desktopFontSize: "clamp(1.875rem, 2.5vw, 2.5rem)",
    mobileFontSize: "clamp(1.5rem, 6.5vw, 1.875rem)",
    desktopSkeletonWidth: "clamp(380px, 36vw, 520px)",
    mobileSkeletonWidth: "clamp(240px, 64vw, 360px)",
    desktopSkeletonHeight: 44,
    mobileSkeletonHeight: 34,
    desktopGap: "0.5rem",
    mobileGap: "0.4375rem",
  },
};

const resolveWelcomeThemeId = (themeId?: string): WelcomeThemeId => {
  if (themeId === "bootstrap" || themeId === "shadcn" || themeId === "fluent") return themeId;
  return "default";
};

const welcomeSlotStyle: React.CSSProperties = {
  minHeight: "clamp(66px, 6.25vw, 82px)",
  marginBlockStart: "1.25rem",
  marginBlockEnd: "0.5rem",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const mobileWelcomeSlotStyle: React.CSSProperties = {
  ...welcomeSlotStyle,
  minHeight: "58px",
  marginBlockStart: "1rem",
  marginBlockEnd: "0.4375rem",
};

const welcomeTextStyle: React.CSSProperties = {
  fontWeight: 700,
  lineHeight: 1.18,
  letterSpacing: "0.01em",
  margin: 0,
};

const mobileWelcomeTextStyle: React.CSSProperties = {
  ...welcomeTextStyle,
  lineHeight: 1.2,
};

const welcomeSkeletonStyle: React.CSSProperties = {
  display: "inline-block",
  boxSizing: "border-box",
  verticalAlign: "middle",
};

const mobileWelcomeSkeletonStyle: React.CSSProperties = {
  ...welcomeSkeletonStyle,
};

const getWelcomeSlotStyle = (
  isDesktop: boolean,
  sizing: (typeof welcomeSizing)[WelcomeThemeId]
): React.CSSProperties => ({
  ...(isDesktop ? welcomeSlotStyle : mobileWelcomeSlotStyle),
  marginBlockEnd: isDesktop ? sizing.desktopGap : sizing.mobileGap,
});

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ }) => {
  const { Skeleton } = useTheme();
  const multiTheme = useMultiTheme();
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const account = useAccount()
  const { config } = useChatContext();
  const models = useAppStore((s) => s.models);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const gatewayEnabled = useAppStore((s: any) => s.gatewayEnabled);
  const providers = useProviderRegistry();
  const [welcomeMessage, setWelcomeMessage] = useState<string | undefined>(
    undefined
  );

  const isDesktop = useIsDesktop();
  const sizing = welcomeSizing[resolveWelcomeThemeId(multiTheme?.selectedThemeId)];

  useEffect(() => {
    if (models && models?.length > 0)
      fetchWelcomeMessage((languageNames as any)[i18n.language as any],
        account?.name,
        {
          baseUrl: config.baseUrl,
          fetch: config.fetch,
          getAccessToken: config.getAccessToken,
          models,
          customHeaders,
          gatewayEnabled: (config as any)?.gatewayEnabled !== false && gatewayEnabled !== false,
          providers,
          fallback: t("sideInference.fallbackWelcome") ?? "Welcome",
        })
        .then(a =>
          setWelcomeMessage(a)
        );

  }, [account?.name, config.baseUrl, config.fetch, config.getAccessToken, customHeaders, gatewayEnabled, i18n.language, models, providers, t]);

  return (
    <div style={getWelcomeSlotStyle(isDesktop, sizing)}>
      {welcomeMessage ? (
        isDesktop ? (
          <h1 style={{ ...welcomeTextStyle, fontSize: sizing.desktopFontSize }}>{welcomeMessage}</h1>
        ) : (
          <h2 style={{ ...mobileWelcomeTextStyle, fontSize: sizing.mobileFontSize }}>{welcomeMessage}</h2>
        )
      ) : (
        <Skeleton
          width={isDesktop ? sizing.desktopSkeletonWidth : sizing.mobileSkeletonWidth}
          height={isDesktop ? sizing.desktopSkeletonHeight : sizing.mobileSkeletonHeight}
          style={isDesktop ? welcomeSkeletonStyle : mobileWelcomeSkeletonStyle}
        />
      )}
    </div>
  );
};
