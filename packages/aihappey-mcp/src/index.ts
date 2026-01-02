export * from "./mcpTester";
export * from "./mcpConnector";
export {
    CreateMessageRequest,
    CreateMessageRequestSchema, LoggingMessageNotification,
    ProgressNotification,
    CreateMessageResult, CreateMessageResultSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { type Resource as BaseResource } from "@modelcontextprotocol/sdk/types.js";
export { Client } from "@modelcontextprotocol/sdk/client/index.js";

export type Resource = BaseResource & {
    size?: number;
};

export type ResourceAudience = "assistant" | "user";

export type {
    ResourceLink, Tool, ServerCapabilities,
    Prompt, ElicitResult, CallToolResult,
    ReadResourceResult, ElicitRequest, ToolAnnotations,
    ResourceTemplate, ResourceTemplateSchema,
    ImplementationSchema, LoggingLevel,
} from "@modelcontextprotocol/sdk/types";
