import { useEffect, useState } from "react";
import { useAppStore } from "aihappey-state";
import { acquireAccessToken } from "aihappey-auth";
import { CreateMessageRequest } from "aihappey-mcp";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";

/**
 * ChatAppConnector - Connects the chat-app MCP client on mount.
 * Optionally supports sampling via samplingApi.
 */
export const ChatAppConnector = ({
  clientName = "aihappey-web",
  clientVersion = "1.0.0",
  mcpUrl,
  children,
  samplingApi,
}: {
  clientName?: string;
  clientVersion?: string;
  mcpUrl?: string;
  children: React.ReactNode;
  samplingApi?: string;
}) => {
  const connectChatApp = useAppStore((s) => s.connectChatApp);
 // const chatAppMcp = useAppStore((s) => s.chatAppMcp);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const { t } = useTranslation();
  const { Spinner } = useTheme();
  const [connected, setConnected] = useState<boolean>(false)

  useEffect(() => {
    let runtimeConnection: { close: () => void } | null = null;

    // Build onSample callback if samplingApi is provided
    const onSample = samplingApi
      ? async (server: string, params: CreateMessageRequest) => {
        let accessToken: string | null = null;

        try {
          accessToken = await acquireAccessToken();
        } catch (err) {
          accessToken = null;
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // ONLY add Authorization if token exists
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const res = await fetch(samplingApi, {
          method: "POST",
          headers: {
            ...headers,
            ...customHeaders
          },
          body: JSON.stringify(params.params),
        });
        if (!res.ok) {
          throw new Error(`Sampling failed (${res.status})`);
        }

        return await res.json();
      }
      : undefined;

    const connect = async () => {
      if (mcpUrl) {
        try {
          runtimeConnection = await connectChatApp(clientName, clientVersion, mcpUrl, { onSample });
          setConnected(true)
        } catch (err) {
          console.error("[CHAT-APP] connect FAILED", mcpUrl, err); // ← NEW
        }
      } else {
        console.warn(
          "CHAT_MCP_URL not set; Chat-App MCP client will not connect."
        );
      }
    };

    connect();

    return () => {
      if (runtimeConnection) {
        try {
          runtimeConnection.close();
        } catch (err) {
          console.warn("Error while closing ChatApp MCP connection", err);
        }
      }
    };
    // }
    // Only run on mount or when chatAppMcp changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samplingApi, mcpUrl, clientName, clientVersion]);

  return connected ? (
    <>{children}</>
  ) : (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner size="extra-large" label={t("connecting")} />
    </div>
  );
};
