import { createStore } from "zustand";
import { createChatSlice, type ChatSlice } from "./slices/chatSlice";
import { createMcpSlice, type McpSlice } from "./slices/mcpSlice";
import { createUiSlice, type UiSlice } from "./slices/uiSlice";
import { withPersist } from "./persist";
import { AgentSlice, createAgentSlice } from "./slices/agentSlice";
import { createMcpServersSlice, McpServersSlice } from "./slices/mcpServersSlice";
import { createMcpRegistrySlice, McpRegistrySlice } from "./slices/mcpRegistrySlice";
import { createImageSlice, ImageSlice } from "./slices/imageSlice";
import { createVideoSlice, VideoSlice } from "./slices/videoSlice";
import { createTranscriptionSlice, TranscriptionSlice } from "./slices/transcriptionSlice";
import { createSpeechSlice, SpeechSlice } from "./slices/speechSlice";
import { createRerankingSlice, RerankingSlice } from "./slices/rerankingSlice";
import { createRealtimeSlice, RealtimeSlice } from "./slices/realtimeSlice";
import { createJsonRenderSlice, JsonRenderSlice } from "./slices/jsonRenderSlice";
import { AppStoreConfig, setAppStoreConfig } from "./appStoreConfig";

export type RootState = ChatSlice & McpSlice & ImageSlice & VideoSlice & TranscriptionSlice & RealtimeSlice
  & SpeechSlice
  & UiSlice & AgentSlice & McpServersSlice & McpRegistrySlice & RerankingSlice & JsonRenderSlice;

export const createAppStore = (config: AppStoreConfig = {}) => {
  setAppStoreConfig(config);

  return createStore<RootState, [["zustand/persist", unknown]]>(
    withPersist(
      (set, get, store) => ({
        ...createChatSlice(set, get, store),
        ...createAgentSlice(set, get, store),
        ...createImageSlice(set, get, store),
        ...createVideoSlice(set, get, store),
        ...createMcpServersSlice(set, get, store),
        ...createRerankingSlice(set, get, store),
        ...createRealtimeSlice(set, get, store),
        ...createSpeechSlice(set, get, store),
        ...createTranscriptionSlice(set, get, store),
        ...createMcpRegistrySlice(set, get, store),
        ...createMcpSlice(set, get, store),
        ...createUiSlice(set, get, store),
        ...createJsonRenderSlice(set, get, store),
      })
    )
  );
};
