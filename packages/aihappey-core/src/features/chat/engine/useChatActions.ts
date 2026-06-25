import { useCallback, useMemo } from "react";
import { UIMessage } from "aihappey-types";
import { useAppStore, type UiAttachment } from "aihappey-state";

// Helpers, importeer in dit bestand of elders:
import { useUserMessageBuilder } from "../messages/useUserMessageBuilder";
import { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import { useActiveProviderMetadata } from "./useActiveProviderMetadata";
import { useChatErrors } from "../layout/useChatErrors";
import { useStorageErrorMessage } from "../../storage/storageErrorMessage";
import { mcpResourceRuntime } from "../../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";
import { buildSelectedAgentRequest } from "../../agents/agentSelection";
import {
  resolveEndpointProfile,
  resolveEndpointProfileProviderConfig,
  resolveEndpointProfileRequestMetadata,
  splitEndpointProfileProviderConfig,
  stripProviderPrefix,
} from "./endpointProfiles";

type ChatActionsProps = {
  // attachments: UiAttachment[];
  getAttachmentParts: () => Promise<{ parts: any[]; convertedKeys: string[] }>;
  addMessage: (convId: string, msg: UIMessage) => Promise<void>;
  sendMessage: (msg: UIMessage, opts: { body: any }) => Promise<void>;
  // clearAttachments: () => void;
  selectedModel: string | undefined;
  temperature?: number
  conversationId: string | undefined;
  finalTools: any[]; // could type further if desired
  rename: (convId: string, title: string) => Promise<void>;
};

export function useChatActions({
  // attachments,
  getAttachmentParts,
  addMessage,
  sendMessage,
  //clearAttachments,
  temperature,
  selectedModel,
  conversationId,
  finalTools,
}: ChatActionsProps) {

  const selectedAgentNames = useAppStore(a => a.selectedAgentNames)
  const agents = useAppStore(a => a.agents)
  const remoteAgentModels = useAppStore(a => a.remoteAgentModels)
  const chatMode = useAppStore(a => a.chatMode)
  const selectedAgentRequest = buildSelectedAgentRequest(
    selectedAgentNames,
    agents,
    remoteAgentModels,
  )

  const extractExif = useAppStore(a => a.extractExif)
  //const selectedAgents = useAppStore(a => a.selectedAgents)
  const workflowType = useAppStore(a => a.workflowType)
  const handoffs = useAppStore(a => a.handoffs)
  const structuredOutputs = useAppStore(a => a.structuredOutputs)
  const maximumIterationCount = useAppStore(a => a.maximumIterationCount)
  const selectedEndpointProfileId = useAppStore(a => a.selectedEndpointProfileId)
  const selectedBaseUrl = useAppStore(a => a.selectedBaseUrl)
  const configuredChatEndpoint = useAppStore(a => a.configuredChatEndpoint)
  const endpointRawModelIds = useAppStore(a => a.endpointRawModelIds)
  const endpointProviderMetadataEnabled = useAppStore(a => a.endpointProviderMetadataEnabled)
  const activeProviderMetadata = useActiveProviderMetadata();
  const allProviderMetadata = useAppStore(a => a.providerMetadata)
  const endpointProfile = useMemo(
    () => resolveEndpointProfile({ selectedEndpointProfileId, selectedBaseUrl, configuredChatEndpoint }),
    [selectedEndpointProfileId, selectedBaseUrl, configuredChatEndpoint],
  );
  const isProviderEndpointProfile = endpointProfile?.kind === "provider";
  const requestModel = isProviderEndpointProfile
    ? stripProviderPrefix(selectedModel, endpointProfile.providerKey)
    : endpointRawModelIds
      ? stripProviderPrefix(selectedModel)
      : selectedModel;
  const providerMetadata = useMemo(
    () => resolveEndpointProfileRequestMetadata({
      activeProviderMetadata,
      endpointProfile,
      fallbackProviderMetadataEnabled: endpointProviderMetadataEnabled !== false,
    }),
    [activeProviderMetadata, endpointProfile, endpointProviderMetadataEnabled],
  );
  const endpointProfileProviderConfig = useMemo(
    () => resolveEndpointProfileProviderConfig({
      activeProviderMetadata,
      providerMetadata: allProviderMetadata,
      endpointProfile,
    }),
    [activeProviderMetadata, allProviderMetadata, endpointProfile],
  );
  const { body: providerRequestConfig } = useMemo(
    () => splitEndpointProfileProviderConfig(endpointProfileProviderConfig),
    [endpointProfileProviderConfig],
  );
  const { addChatError } = useChatErrors();
  const getStorageErrorMessage = useStorageErrorMessage();
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({
    getAttachmentParts,
    extractExif
  });
 
  const onPromptExecute = useCallback(
    async (prompt: PromptWithSource, args?: Record<string, string>) => {
      const userMsg = await buildFromPrompt(prompt, args);

      if (userMsg) {
        try {
          await addMessage(conversationId!, userMsg);
          await sendMessage(userMsg, {
            body: {
              ...(chatMode === "chat" ? { model: requestModel } : {}),
              ...(chatMode === "agent" && selectedAgentRequest.localAgents.length > 0
                ? { agents: selectedAgentRequest.localAgents }
                : {}),
              ...(chatMode === "agent" && selectedAgentRequest.models.length > 0
                ? { models: selectedAgentRequest.models }
                : {}),
              ...(chatMode === "agent" ? { workflowType } : {}),
              tools: finalTools,
              temperature,
              providerMetadata,
              ...(isProviderEndpointProfile && providerRequestConfig ? { providerRequestConfig } : {}),
              ...(isProviderEndpointProfile ? { omitProviderMetadataInNativeMetadata: true } : {}),
              response_format: structuredOutputs,
            },
          });

          //clearAttachments();
          fileAttachmentRuntime.clear()
          mcpResourceRuntime.clear();
        } catch (err) {
          addChatError(getStorageErrorMessage(err, "Failed to save your message"));
        }
      }
    },
    [
      //      clients,
      //attachments,
      getAttachmentParts,
      addMessage,
      sendMessage,
      providerMetadata,
      providerRequestConfig,
      addChatError,
      chatMode,
      selectedAgentRequest.localAgents,
      selectedAgentRequest.models,
      workflowType,
      temperature,
      //    clearAttachments,
      requestModel,
      conversationId,
      finalTools,
    ]
  );


  const handleSend = useCallback(
    async (text: string) => {
      const userMsg = await buildFromText(text);
      if (userMsg) {
        try {
          await addMessage(conversationId!, userMsg);
          await sendMessage(userMsg, {
            body: {
              ...(chatMode === "chat" ? { model: requestModel } : {}),
              ...(chatMode === "agent" && selectedAgentRequest.localAgents.length > 0
                ? { agents: selectedAgentRequest.localAgents }
                : {}),
              ...(chatMode === "agent" && selectedAgentRequest.models.length > 0
                ? { models: selectedAgentRequest.models }
                : {}),
              ...(chatMode === "agent" ? { workflowType } : {}),
              tools: finalTools,
              temperature,
              providerMetadata,
              ...(isProviderEndpointProfile && providerRequestConfig ? { providerRequestConfig } : {}),
              ...(isProviderEndpointProfile ? { omitProviderMetadataInNativeMetadata: true } : {}),
              response_format: structuredOutputs,
              workflowMetadata: {
                "groupchat": {
                  "maximumIterationCount": maximumIterationCount
                },
                "handoff": {
                  "handoffs": handoffs
                },
              }
            },
          });
          fileAttachmentRuntime.clear()
          mcpResourceRuntime.clear();
        } catch (err) {
          addChatError(getStorageErrorMessage(err, "Failed to save your message"));
        }

      }
    },
    [
      getAttachmentParts,
      addMessage,
      sendMessage,
      chatMode,
      temperature,
      selectedAgentRequest.localAgents,
      selectedAgentRequest.models,
      workflowType,
      providerMetadata,
      providerRequestConfig,
      addChatError,
      requestModel,
      conversationId,
      finalTools,
    ]
  );

  return { onPromptExecute, handleSend };
}
