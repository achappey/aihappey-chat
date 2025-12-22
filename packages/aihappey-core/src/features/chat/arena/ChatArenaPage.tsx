import { ChatArena } from "./ChatArena";
import { DisclaimerBar } from "../layout/DisclaimerBar";
import { useChatContext } from "../context/ChatContext";

export const ChatArenaPage = () => {
  const { config } = useChatContext();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChatArena
        api={config.api}
        getAccessToken={config?.getAccessToken}
        headers={config?.headers}
        customFetch={config?.fetch}
      />

      <DisclaimerBar />
    </div>
  );
};
