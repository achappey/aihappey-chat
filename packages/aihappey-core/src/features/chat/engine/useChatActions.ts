import { useCallback, useMemo } from "react";
import { UIMessage } from "aihappey-types";
import { useAppStore, type UiAttachment } from "aihappey-state";
import { useProviderRegistry } from "../../../runtime/providers/useProviderRegistry";

// Helpers, importeer in dit bestand of elders:
import { useUserMessageBuilder } from "../messages/useUserMessageBuilder";
import { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import { useActiveProviderMetadata } from "./useActiveProviderMetadata";
import { useChatErrors } from "../layout/useChatErrors";
import { useStorageErrorMessage } from "../../storage/storageErrorMessage";
import { mcpResourceRuntime } from "../../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";
import { buildSelectedAgentRequest, buildWorkflowMetadata } from "../../agents/agentSelection";
import {
  resolveEndpointProfileForSelectedModel,
  resolveEndpointProfileChatEndpoint,
  resolveEndpointProfileProviderConfig,
  resolveEndpointProfileRequestMetadata,
  resolveEndpointProfileRequestProviderHeaders,
  resolveProviderRequestModelId,
  splitEndpointProfileProviderConfig,
  stripProviderPrefix,
  validateEndpointProfileForModel,
} from "./endpointProfiles";
import { decorateToolsWithRequestConfig } from "../../tools/toolRequestConfig";
import { isGenericChatEndpoint } from "./genericChatEndpoint";

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
  const extractExif = useAppStore(a => a.extractExif)
  //const selectedAgents = useAppStore(a => a.selectedAgents)
  const workflowType = useAppStore(a => a.workflowType)
  const magenticManagerAgentKey = useAppStore(a => a.magenticManagerAgentKey)
  const magentic = useAppStore(a => a.magentic)
  const handoffs = useAppStore(a => a.handoffs)
  const structuredOutputs = useAppStore(a => a.structuredOutputs)
  const verbosity = useAppStore(a => a.verbosity)
  const toolRequestConfig = useAppStore(a => (a as any).toolRequestConfig)
  const useToolNamespaces = useAppStore(a => (a as any).useToolNamespaces)
  const maximumIterationCount = useAppStore(a => a.maximumIterationCount)
  const selectedAgentRequest = buildSelectedAgentRequest(
    selectedAgentNames,
    agents,
    remoteAgentModels,
    { workflowType, managerAgentKey: magenticManagerAgentKey },
  )
  const effectiveChatEndpointMode = useAppStore(a => a.effectiveChatEndpointMode)
  const selectedEndpointProfileId = useAppStore(a => a.selectedEndpointProfileId)
  const selectedBaseUrl = useAppStore(a => a.selectedBaseUrl)
  const configuredChatEndpoint = useAppStore(a => a.configuredChatEndpoint)
  const effectiveChatEndpoint = useAppStore(a => a.effectiveChatEndpoint)
  const endpointRawModelIds = useAppStore(a => a.endpointRawModelIds)
  const endpointProviderMetadataEnabled = useAppStore(a => a.endpointProviderMetadataEnabled)
  const activeProviderMetadata = useActiveProviderMetadata();
  const allProviderMetadata = useAppStore(a => a.providerMetadata)
  const allProviderHeaders = useAppStore(a => a.providerHeaders)
  const providers = useProviderRegistry()
  const models = useAppStore(a => a.models)
  const selectedModelOption = useMemo(
    () => models?.find((model: any) => model.id === selectedModel),
    [models, selectedModel],
  );
  const endpointProfile = useMemo(
    () => resolveEndpointProfileForSelectedModel({
        modelId: selectedModel,
        model: selectedModelOption,
        selectedEndpointProfileId,
        selectedBaseUrl,
        selectedChatEndpoint: effectiveChatEndpoint,
        configuredChatEndpoint,
        providers,
      }),
    [
      configuredChatEndpoint,
      effectiveChatEndpoint,
      providers,
      selectedBaseUrl,
      selectedEndpointProfileId,
      selectedModel,
      selectedModelOption,
    ],
  );
  const requestEndpointProfile = validateEndpointProfileForModel({
    endpointProfile,
    modelId: selectedModel,
    model: selectedModelOption,
  });
  const isProviderEndpointProfile = requestEndpointProfile?.kind === "provider";
  const requestEndpoint = resolveEndpointProfileChatEndpoint({
    endpointProfile: requestEndpointProfile,
    selectedChatEndpoint: effectiveChatEndpoint,
  }) ?? effectiveChatEndpoint;
  const requestModel = isProviderEndpointProfile
    ? resolveProviderRequestModelId({
      modelId: selectedModel,
      providerKey: requestEndpointProfile.providerKey,
      model: selectedModelOption,
    })
    : endpointRawModelIds
      ? stripProviderPrefix(selectedModel)
      : selectedModel;
  const providerMetadata = useMemo(
    () => resolveEndpointProfileRequestMetadata({
      activeProviderMetadata,
      providerMetadata: allProviderMetadata,
      endpointProfile: requestEndpointProfile,
      fallbackProviderMetadataEnabled: endpointProviderMetadataEnabled !== false,
    }),
    [activeProviderMetadata, allProviderMetadata, requestEndpointProfile, endpointProviderMetadataEnabled],
  );
  const providerHeaders = useMemo(
    () => resolveEndpointProfileRequestProviderHeaders({
      providerHeaders: allProviderHeaders,
      endpointProfile: requestEndpointProfile,
      selectedModelProviderKey: selectedModel?.split("/")[0],
    }),
    [allProviderHeaders, requestEndpointProfile, selectedModel],
  );
  const requestTools = useMemo(
    () => decorateToolsWithRequestConfig(finalTools, toolRequestConfig),
    [finalTools, toolRequestConfig],
  );
  const endpointProfileProviderConfig = useMemo(
    () => resolveEndpointProfileProviderConfig({
      activeProviderMetadata,
      providerMetadata: allProviderMetadata,
      endpointProfile: requestEndpointProfile,
    }),
    [activeProviderMetadata, allProviderMetadata, requestEndpointProfile],
  );
  const { body: providerRequestConfig } = useMemo(
    () => splitEndpointProfileProviderConfig(endpointProfileProviderConfig, requestEndpointProfile?.providerKey, requestEndpoint),
    [endpointProfileProviderConfig, requestEndpointProfile, requestEndpoint],
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
          if (selectedAgentRequest.error) throw new Error(selectedAgentRequest.error);
          await addMessage(conversationId!, userMsg);
          await sendMessage(userMsg, {
            body: {
              ...(chatMode === "chat" ? { model: requestModel } : {}),
              ...(chatMode === "agent" && selectedAgentRequest.requestAgents.length > 0
                ? { agents: selectedAgentRequest.requestAgents }
                : {}),
              ...(chatMode === "agent" && selectedAgentRequest.models.length > 0
                ? { models: selectedAgentRequest.models }
                : {}),
              ...(chatMode === "agent" ? { workflowType } : {}),
              tools: requestTools,
              toolRequestConfig,
              useToolNamespaces,
              temperature,
              ...(!isGenericChatEndpoint(requestEndpoint) ? { verbosity } : {}),
              providerMetadata,
              providerHeaders,
              ...(isProviderEndpointProfile && providerRequestConfig ? { providerRequestConfig } : {}),
              ...(isProviderEndpointProfile ? { providerRequestConfigProviderKey: requestEndpointProfile.providerKey } : {}),
              ...(isProviderEndpointProfile ? { omitProviderMetadataInNativeMetadata: true } : {}),
              response_format: structuredOutputs,
              workflowMetadata: buildWorkflowMetadata(maximumIterationCount, handoffs, magentic),
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
      providerHeaders,
      providerRequestConfig,
      isProviderEndpointProfile,
      requestEndpointProfile,
      addChatError,
      chatMode,
      selectedAgentRequest.requestAgents,
      selectedAgentRequest.models,
      workflowType,
      magentic,
      maximumIterationCount,
      handoffs,
      temperature,
      verbosity,
      //    clearAttachments,
      requestModel,
      conversationId,
      requestTools,
      toolRequestConfig,
      useToolNamespaces,
    ]
  );


  const handleSend = useCallback(
    async (text: string) => {
      const userMsg = await buildFromText(text);
      if (userMsg) {
        try {
          if (selectedAgentRequest.error) throw new Error(selectedAgentRequest.error);
          await addMessage(conversationId!, userMsg);
          await sendMessage(userMsg, {
            body: {
              ...(chatMode === "chat" ? { model: requestModel } : {}),
              ...(chatMode === "agent" && selectedAgentRequest.requestAgents.length > 0
                ? { agents: selectedAgentRequest.requestAgents }
                : {}),
              ...(chatMode === "agent" && selectedAgentRequest.models.length > 0
                ? { models: selectedAgentRequest.models }
                : {}),
              ...(chatMode === "agent" ? { workflowType } : {}),
              tools: requestTools,
              toolRequestConfig,
              useToolNamespaces,
              temperature,
              ...(!isGenericChatEndpoint(requestEndpoint) ? { verbosity } : {}),
              providerMetadata,
              providerHeaders,
              ...(isProviderEndpointProfile && providerRequestConfig ? { providerRequestConfig } : {}),
              ...(isProviderEndpointProfile ? { providerRequestConfigProviderKey: requestEndpointProfile.providerKey } : {}),
              ...(isProviderEndpointProfile ? { omitProviderMetadataInNativeMetadata: true } : {}),
              response_format: structuredOutputs,
              workflowMetadata: buildWorkflowMetadata(maximumIterationCount, handoffs, magentic),
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
      selectedAgentRequest.requestAgents,
      selectedAgentRequest.models,
      workflowType,
      magentic,
      maximumIterationCount,
      handoffs,
      providerMetadata,
      providerHeaders,
      providerRequestConfig,
      isProviderEndpointProfile,
      requestEndpointProfile,
      addChatError,
      requestModel,
      conversationId,
      requestTools,
      toolRequestConfig,
      useToolNamespaces,
    ]
  );

  return { onPromptExecute, handleSend };
}
