import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useConversations } from "aihappey-conversations";
import { useChatContext } from "./context/ChatContext";
import { VercelChatPanel } from "./engine/VercelChatPanel";
import { ChatHeader } from "./layout/ChatHeader";
import { DisclaimerBar } from "./layout/DisclaimerBar";
import { useAppStore } from "aihappey-state";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { create } = useConversations();
  const { config } = useChatContext();
  useEffect(() => {
    if (!conversationId) {
      // Create a new conversation and redirect
      create("New chat").then((conv) => {
        navigate(`/${conv.id}`, { replace: true });
      });
    }
  }, [conversationId, create, navigate]);
  const selectedAgentNames = useAppStore(a => a.selectedAgentNames)
  const agents = useAppStore(a => a.agents)
  const selectedAgents = selectedAgentNames
    .filter(a => agents.some(z => z.name == a))
    .map(a => agents.find(z => z.name == a)!)
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const getAccessToken = config?.getAccessToken;
  const headers = config?.headers;
  const customFetch = config?.fetch;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChatHeader
        agentValues={selectedAgents?.map(a => a.name) ?? []}
        onAgentChange={(name) => selectedAgentNames.includes(name)
          ? setSelectedAgents(selectedAgentNames.filter(a => a != name))
          : setSelectedAgents([...selectedAgentNames, name])} />
      <VercelChatPanel
        getAccessToken={getAccessToken}
        headers={headers}
        customFetch={customFetch}
      />
      <DisclaimerBar />
    </div>
  );
}
