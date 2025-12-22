import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useParams } from "react-router";
import { useConversations } from "aihappey-conversations";
import { useSystemMessage } from "../messages/useSystemMessage";
import { VercelChatInner } from "./VercelChatInner";
import { useTheme } from "aihappey-components";

export function VercelChatPanel(props: {
  model?: string;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  customFetch?: typeof fetch;
}) {
  const location = useLocation();
  const { conversationId } = useParams();
  const { Spinner } = useTheme();
  const { get, setTemperature } = useConversations();
  const [booted, setBooted] = useState(false);
  const [currentTemperature, setCurrentTemperature] = useState<number>(
    location.state?.temperature != undefined ? location.state?.temperature : 1
  );
  const [bootMsgs, setBootMsgs] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] =
    useState(conversationId);
  const systemMsg = useSystemMessage();

  // Als conversationId verandert: eerst unmounten
  useEffect(() => {
    setBooted(false);
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    get(conversationId).then((conv) => {
      const msgs = conv?.messages ?? [];
      msgs.sort(
        (a, b) =>
          new Date(a.metadata?.timestamp).getTime() -
          new Date(b.metadata?.timestamp).getTime()
      );
      setBootMsgs(msgs);
      setCurrentTemperature(
        conv?.metadata?.temperature != undefined
          ? conv?.metadata?.temperature
          : 1
      );
      setBooted(true);
    });
  }, [conversationId, get]);

  const temperatureChanged = useCallback(
    async (temperature: number) => {
      if (conversationId) {
        await setTemperature(conversationId, temperature);
        setCurrentTemperature(temperature);
      }
    },
    [conversationId]
  );

  const withSystemMsg = useMemo(() => {
    if (!systemMsg) return bootMsgs;

    // If there is a system message at [0], replace it. Otherwise, insert at 0.
    if (bootMsgs[0]?.role === "system") {
      // Only replace if different (optional, avoids unnecessary rerender)
      if (JSON.stringify(bootMsgs[0]) !== JSON.stringify(systemMsg)) {
        return [systemMsg, ...bootMsgs.slice(1)];
      } else {
        return bootMsgs;
      }
    }
    return [systemMsg, ...bootMsgs];
  }, [systemMsg, bootMsgs]);

  if (!booted || currentConversationId !== conversationId) return <Spinner />;

  // Nu forceert React een ECHTE unmount/mount van de inner bij elke switch
  return (
    <VercelChatInner
      key={conversationId}
      {...props}
      initial={withSystemMsg}
      temperature={currentTemperature}
      temperatureChanged={temperatureChanged}
    />
  );
}
