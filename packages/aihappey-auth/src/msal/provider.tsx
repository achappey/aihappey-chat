import { MsalProvider, useMsal } from "@azure/msal-react";
import { PublicClientApplication, Configuration, InteractionStatus } from "@azure/msal-browser";
import { MsalConfig } from "../config/types";

/**
 * Creates a configured MSAL PublicClientApplication instance.
 */
export const createMsalInstance = (config: MsalConfig) =>
  new PublicClientApplication({
    auth: {
      clientId: config.clientId,
      authority: config.authority,
      redirectUri: config.redirectUri,
    },
    cache: {
      cacheLocation: "localStorage",
    },
  } as Configuration);

/**
 * Pure function component for MSAL context.
 * Receives the instance as a prop to avoid singleton leakage.
 */
export const MsalAuthProvider = ({
  instance,
  children,
}: {
  instance: PublicClientApplication;
  children: React.ReactNode;
}) => <MsalProvider instance={instance}>{children}</MsalProvider>;
