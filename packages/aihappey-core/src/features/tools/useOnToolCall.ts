import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import { CallToolResult } from "aihappey-mcp";
import { useTranslation } from "aihappey-i18n";
import { memoryStore } from "../../runtime/memory/memoryStore";
import { ConversationsContextType, useConversations } from "aihappey-conversations";
import { readResource } from "../../runtime/mcp/readResource";
import { Agent } from "aihappey-types";

function isValidAbsoluteUri(uri: string): boolean {
  try {
    new URL(uri); // throws if not absolute
    return true;
  } catch {
    return false;
  }
}

export function useOnToolCall({ callTool }: {
  //  conversations?: ConversationsContextType,
  callTool: (toolCallId: string, toolName: string, input: any, locale?: string, signal?: AbortSignal) => Promise<any>
}) {
  const enableApps = useAppStore(a => a.enableApps)
  const allAgents = useAppStore(a => a.agents)
  const enableUserLocation = useAppStore(a => a.enableUserLocation)
  const setEnableUserLocation = useAppStore(a => a.setEnableUserLocation)
  const setMcpTimeout = useAppStore(a => a.setMcpTimeout)
  const toolTimeout = useAppStore(a => a.toolTimeout)
  const deleteAgent = useAppStore(a => a.deleteAgent)
  const conversations = useConversations();
  const mcpServerContent = useAppStore(a => a.mcpServerContent)
  const resetTimeoutOnProgress = useAppStore(a => a.resetTimeoutOnProgress)
  const mcpServers = useAppStore(a => a.mcpServers)
  const experimentalThrottle = useAppStore(a => a.experimentalThrottle)
  const setThrottle = useAppStore(a => a.setThrottle)
  const temperature = useAppStore(a => a.temperature)
  const setAllAgents = useAppStore(a => a.setAgents)
  const { t, i18n } = useTranslation(); // Uncomment when i18n is ready
  // callback die altijd dezelfde is (dependencies alleen bij init)
  const onToolCall = useCallback(
    async ({ toolCall, signal }: any) => {
      try {

        switch (toolCall.toolName) {
          case "memory": {
            const { command } = toolCall.input;

            const normalize = (p: string): string => {
              if (!p.startsWith("/memories")) {
                throw new Error("Invalid path. All memory files must be under /memories.");
              }
              return p.replace(/\\/g, "/");
            };

            switch (command) {
              case "view": {
                const path = normalize(toolCall.input.path);
                const viewRange = toolCall.input.view_range;

                const result = await memoryStore.view(path, viewRange);

                return {
                  isError: false,
                  content: [{ type: "text", text: result }]
                };
              }

              case "create": {
                const path = normalize(toolCall.input.path);
                const fileText = toolCall.input.file_text ?? "";
                await memoryStore.create(path, fileText);

                return {
                  isError: false,
                  content: [{ type: "text", text: "OK" }]
                };
              }

              case "str_replace": {
                const path = normalize(toolCall.input.path);
                const { old_str, new_str } = toolCall.input;
                await memoryStore.replace(path, old_str, new_str);

                return {
                  isError: false,
                  content: [{ type: "text", text: "OK" }]
                };
              }

              case "insert": {
                const path = normalize(toolCall.input.path);
                const { insert_line, insert_text } = toolCall.input;
                await memoryStore.insert(path, insert_line, insert_text);

                return {
                  isError: false,
                  content: [{ type: "text", text: "OK" }]
                };
              }

              case "delete": {
                const path = normalize(toolCall.input.path);
                await memoryStore.delete(path);

                return {
                  isError: false,
                  content: [{ type: "text", text: "OK" }]
                };
              }

              case "rename": {
                const oldPath = normalize(toolCall.input.old_path);
                const newPath = normalize(toolCall.input.new_path);
                await memoryStore.rename(oldPath, newPath);

                return {
                  isError: false,
                  content: [{ type: "text", text: "OK" }]
                };
              }

              default:
                throw new Error(`Unknown memory command: ${command}`);
            }

          }

          case "local_agents_list":
            return {
              isError: false,
              content: [{
                type: "text",
                text: JSON.stringify(allAgents)
              }],
            };

          case "local_conversations_list_all":
            return {
              isError: false,
              content: [{
                type: "text",
                text: JSON.stringify(conversations?.items?.map(a => ({
                  id: a.id,
                  metadata: a.metadata,
                  messageCount: a.messages?.length
                })))
              }],
            };

          case "local_conversations_get_conversation":
            const { conversationId } = toolCall.input;

            return {
              isError: false,
              content: [{
                type: "text",
                text: JSON.stringify(conversations?.items?.find(a => a.id == conversationId))
              }],
            };
          case "local_settings_get":
            return {
              isError: false,
              content: [{
                type: "text",
                text: JSON.stringify({
                  chatApp: {
                    enableUserLocation,
                    throttleInMs: experimentalThrottle,
                  },
                  ai: {
                    temperature
                  },
                  mcp: {
                    toolTimeoutInMs: toolTimeout,
                    resetTimeoutOnProgress
                  },
                })
              }],
            };

          case "local_settings_set":
            if (toolCall.input?.enableUserLocation == true
              || toolCall.input?.enableUserLocation == false
            ) {
              setEnableUserLocation(toolCall.input?.enableUserLocation)
            }

            if (toolCall.input?.throttle != undefined
            ) {
              setThrottle(toolCall.input?.throttle)
            }

            if (toolCall.input?.temperature != undefined
            ) {
              setThrottle(toolCall.input?.temperature)
            }

            if (toolCall.input?.mcpToolTimeout != undefined
            ) {
              setMcpTimeout(toolCall.input?.mcpToolTimeout,
                toolCall.input?.mcpResetTimeoutOnProgress ?? resetTimeoutOnProgress)
            } else {
              if (toolCall.input?.mcpResetTimeoutOnProgress != undefined
              ) {
                setMcpTimeout(toolTimeout, toolCall.input?.mcpResetTimeoutOnProgress)
              }
            }


            return {
              isError: false,
              content: [{
                type: "text",
                text: "Settings updated"
              }],
            };

          case "local_agents_delete": {
            const { agentName } = toolCall.input;

            deleteAgent(agentName);

            return {
              isError: false,
              content: [
                { type: "text", text: `Deleted local agent: ${agentName}` }
              ]
            };

          }

          case "local_agents_create": {

            const {
              agentName,
              agentDescription,
              agentInstructions,
              modelId,
              modelTemperature,
              modelProviderMetadataJson,
              mcpServerUrls,
              policyReadOnly,
              policyIdempotent,
              policyOpenWorld,
              policyDestructive,
              capabilitySampling,
              capabilityElicitation
            } = toolCall.input;

            if (allAgents.find(a => a.name == agentName))
              throw new Error(`Agent with name '${agentName} already exists.`)

            const toServerConfigRecord = (urls: string[]) =>
              urls.reduce<Record<string, any>>((acc, url) => {
                acc[url] = {
                  type: "streamable-http",
                  url
                }
                return acc
              }, {})


            // Build new agent object
            const newAgent: Agent = {
              name: agentName,
              description: agentDescription,
              instructions: agentInstructions,
              model: {
                id: modelId,
                options: {
                  temperature: modelTemperature ?? 0,
                },
                providerMetadata: {

                }
                //      providerMetadata: modelProviderMetadataJson
                //       ? JSON.parse(modelProviderMetadataJson)
                //      : undefined
              },
              mcpClient: {
                policy: {
                  readOnlyHint: policyReadOnly ?? false,
                  idempotentHint: policyIdempotent ?? false,
                  openWorldHint: policyOpenWorld ?? false,
                  destructiveHint: policyDestructive ?? false
                },
                capabilities: {
                  sampling: capabilitySampling ?? false,
                  elicitation: capabilityElicitation ?? false
                }
              },
              mcpServers: toServerConfigRecord(mcpServerUrls),

            };

            // Update store
            const updated = [...allAgents, newAgent];

            setAllAgents(updated);

            return {
              isError: false,
              content: [
                {
                  type: "text",
                  text: `Local agent created: ${agentName}`
                }
              ]
            };

          }

          case "read_resource":
            const connectedUrls = Object.keys(mcpServers)
              .filter(z => mcpServers[z].config.disabled !== true)
              .map(z => mcpServers[z].config.url)

            if (!connectedUrls.includes(toolCall.input.serverUrl))
              throw new Error("Invalid url. Connected servers: " + connectedUrls.join("\n"))

            if (!isValidAbsoluteUri(toolCall.input.uri))
              throw new Error(`Invalid URI: ${toolCall.input.uri}\n` +
                "Please provide an absolute URI with a scheme (e.g., 'https://', 'file:///', 'bot://').\n\n" +
                "Examples of valid URIs:\n" +
                "  - https://example.com/resource\n" +
                "  - file:///C:/folder/file.txt\n" +
                "  - bot://my-server/resource\n" +
                "  - ftp://myserver.com/file\n" +
                "  - custom-scheme://foo/bar\n\n" +
                "Relative paths like '/foo/bar' or 'folder/file.txt' are not accepted.")

            const serverName = Object.keys(mcpServers)
              .find(z => mcpServers[z].config?.url == toolCall.input.serverUrl)

            if (!serverName)
              throw new Error("Server not found")

            const resource = await readResource(serverName, toolCall.input?.uri);

            return {
              isError: false,
              content: resource?.contents?.map((z: any) => ({
                type: "resource",
                resource: z,
              })),
            };
          default:

            var toolResult: CallToolResult = await callTool(
              toolCall.toolCallId,
              toolCall.toolName,
              toolCall.input,
              i18n.language,
              signal
            );

            if (enableApps && toolResult?._meta?.["openai/outputTemplate"]) {

              const key = Object.entries(mcpServerContent)
                .find(([_, v]) => v.tools?.some(t => t.name === toolCall.toolName))
                ?.[0];

              if (!key)
                return toolResult;

              const widget = await readResource(key, toolResult._meta["openai/outputTemplate"] as string);

              if (!widget)
                return toolResult;

              const mimeType = widget?.contents?.[0]?.mimeType;

              if (mimeType !== "text/html+skybridge") {
                return toolResult;
              }

              const html = (widget?.contents?.[0] as any).text ?? null;
              const widgetName = widget?.contents?.[0]?.uri ?? null;
              const desc = widget?.contents?.[0]?._meta?.["openai/widgetDescription"];
              const modelText = `INJECTED BY CHAT APP: The chat app rendered a widget.\n\nUri: ${widgetName}\nDescription: ${desc}`

              return {
                ...toolResult,
                content: [...(toolResult.content ?? []), { type: "text", text: modelText }],
                _meta: {
                  ...toolResult._meta,
                  ["chat/html"]: html,
                  ...(desc ? { ["chat/widgetDescription"]: desc } : {}),
                },
              };
            }

            return toolResult;
        }


      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }
    },
    [callTool, enableApps]
  );

  return { onToolCall };
}
