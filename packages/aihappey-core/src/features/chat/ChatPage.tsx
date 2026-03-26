import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useConversations } from "aihappey-conversations";
import { useChatContext } from "./context/ChatContext";
import { VercelChatPanel } from "./engine/VercelChatPanel";
import { ChatHeader } from "./layout/ChatHeader";
import { ChatErrors } from "./layout/ChatErrors";
import { DisclaimerBar } from "./layout/DisclaimerBar";
import { useChatErrors } from "./layout/useChatErrors";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { create } = useConversations();
  const { addChatError } = useChatErrors();
  const getStorageErrorMessage = useStorageErrorMessage();
  const { config } = useChatContext();
  useEffect(() => {
    let cancelled = false;
    if (!conversationId) {
      // Create a new conversation and redirect
      void create("New chat")
        .then((conv) => {
          if (cancelled) return;
          navigate(`/${conv.id}`, { replace: true });
        })
        .catch((err) => {
          if (cancelled) return;
          addChatError(getStorageErrorMessage(err, "Failed to start a new chat"));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [addChatError, conversationId, create, navigate]);
  const selectedAgentNames = useAppStore(a => a.selectedAgentNames)
  const agents = useAppStore(a => a.agents)
  const selectedAgents = selectedAgentNames
    .filter(a => agents.some(z => z.name == a))
    .map(a => agents.find(z => z.name == a)!)
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const getAccessToken = config?.getAccessToken;
  const headers = config?.headers;
  const customFetch = config?.fetch;

  const theme = useTheme()



  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChatHeader
        agentValues={selectedAgents?.map(a => a.name) ?? []}
        onAgentChange={(name) => selectedAgentNames.includes(name)
          ? setSelectedAgents(selectedAgentNames.filter(a => a != name))
          : setSelectedAgents([...selectedAgentNames, name])} />
      {!conversationId ? <ChatErrors /> : null}
      <VercelChatPanel
        getAccessToken={getAccessToken}
        headers={headers}
        customFetch={customFetch}
      />
      <DisclaimerBar />
    </div>
  );
}
