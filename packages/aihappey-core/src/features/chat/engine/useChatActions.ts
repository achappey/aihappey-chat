import { useCallback } from "react";
import { UIMessage } from "aihappey-types";
import { useAppStore, type UiAttachment } from "aihappey-state";

// Helpers, importeer in dit bestand of elders:
import { useUserMessageBuilder } from "../messages/useUserMessageBuilder";
import { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import { useActiveProviderMetadata } from "./useActiveProviderMetadata";
import { mcpResourceRuntime } from "../../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";

type ChatActionsProps = {
  // attachments: UiAttachment[];
  getAttachmentParts: () => Promise<any[]>;
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
  const selectedAgents = selectedAgentNames
    .filter(a => agents.some(z => z.name == a))
    .map(a => agents.find(z => z.name == a)!)

  const extractExif = useAppStore(a => a.extractExif)
  //const selectedAgents = useAppStore(a => a.selectedAgents)
  const workflowType = useAppStore(a => a.workflowType)
  const handoffs = useAppStore(a => a.handoffs)
  const structuredOutputs = useAppStore(a => a.structuredOutputs)
  const maximumIterationCount = useAppStore(a => a.maximumIterationCount)
  const providerMetadata = useActiveProviderMetadata();
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({
    getAttachmentParts,
    extractExif
  });
  /*
    const { metadata: anthropicData, filteredTools: anthropicTools } = useAnthropicNativeMcp({
      clients: undefined,
      tools,
      providerMetadata,
      finalTools,
      getMcpAccessToken,
    });
  
    const { metadata: openAiData, filteredTools: openAiTools } = useOpenAiNativeMcp({
      clients: undefined,
      tools,
      providerMetadata,
      finalTools,
      getMcpAccessToken,
    });*/
  /*
    const finalMetadata = currentModel?.publisher == "OpenAI"
      ? openAiData : currentModel?.publisher == "Anthropic" ?
        anthropicData : providerMetadata;
  
    const allFinalTools = currentModel?.publisher == "OpenAI"
      ? openAiTools : currentModel?.publisher == "Anthropic" ?
        anthropicTools : finalTools;*/

  const onPromptExecute = useCallback(
    async (prompt: PromptWithSource, args?: Record<string, string>) => {
      const userMsg = await buildFromPrompt(prompt, args);

      if (userMsg) {
        await addMessage(conversationId!, userMsg);
        await sendMessage(userMsg, {
          body: {
            model: selectedModel,
            tools: finalTools,
            temperature,
            providerMetadata,
            response_format: structuredOutputs,
          },
        });

        //clearAttachments();
        fileAttachmentRuntime.clear()
        mcpResourceRuntime.clear();
      }
    },
    [
      //      clients,
      //attachments,
      getAttachmentParts,
      addMessage,
      sendMessage,
      providerMetadata,
      temperature,
      //    clearAttachments,
      selectedModel,
      conversationId,
      finalTools,
    ]
  );


  const handleSend = useCallback(
    async (text: string) => {
      const userMsg = await buildFromText(text);

      /*   var urls = Object.keys(clients ?? {});
         const metadata = {
           ...providerMetadata,
           anthropic: {
             ...providerMetadata.anthropic,
             mcp_servers: urls.map(r => ({
               url: r.replace("http://localhost:3001", "https://mcp.fakton.com"),
               name: clients![r].getServerVersion()?.name,
               authorization_token: getMcpAccessToken(r),
               tool_configuration: {
                 enabled: true,
                 allowed_tools: tools[r].map(r => r.name)
               }
             }))
           }
         }
         const mcpToolNames = new Set(
           metadata?.anthropic?.mcp_servers?.flatMap((s: any) =>
             s?.tool_configuration?.enabled
               ? (s.tool_configuration?.allowed_tools ?? [])
               : []
           ) ?? []
         );
   
         // If your tool specs sometimes nest the name (e.g. OpenAI function tools), normalize it
         const finalToolsFiltered = (finalTools ?? []).filter(t => {
           const name = t?.function?.name ?? t?.name;
           return name && !mcpToolNames.has(name);
         });*/

      if (userMsg) {
        //const toolsMcp = useAnthropicNativeMcp()
        await addMessage(conversationId!, userMsg);
        await sendMessage(userMsg, {
          body: {
            model: selectedModel,
            agents: selectedAgents,
            workflowType,
            tools: finalTools,
            temperature,
            providerMetadata,
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
        //clearAttachments();
        fileAttachmentRuntime.clear()
        mcpResourceRuntime.clear();

      }
    },
    [
      //  attachments,
      getAttachmentParts,
      addMessage,
      sendMessage,
      temperature,
      selectedAgents,
      workflowType,
      providerMetadata,
      //   clearAttachments,
      selectedModel,
      conversationId,
      finalTools,
    ]
  );

  return { onPromptExecute, handleSend };
}
