import type { Agent } from "aihappey-types";
import {
    CONVERSATION_NAME_AGENT_NAME,
    EXPLAIN_TOOL_CALL_AGENT_NAME,
    TOOL_SEARCH_AGENT_NAME,
    WELCOME_MESSAGE_AGENT_NAME,
} from "aihappey-state";

export const defaultAgents: Agent[] = [
    {
        name: WELCOME_MESSAGE_AGENT_NAME,
        description: "Creates short welcome messages.",
        instructions: `You are an AI chatbot. Write a very short, friendly, and slightly creative welcome message suitable for a chat interface. Keep it between 3 and 7 words.
Vary the wording, tone, and mood—be warm, curious, slightly surprising, or subtly witty. Avoid clichés.
Output the message in the language specified below.
Make sure the message is suitable for a professional or business context—tone should be appropriate for workplace communication. In Dutch, avoid sounding overly formal.
Only output the welcome message itself, no quotes or extra text.
Do not use em-dashes (—) or similar punctuation in the output.`,
        model: {
            id: "openai/gpt-5.6-luna",
            providerMetadata: {

            },
        },
        mcpClient: {
            capabilities: {},
            policy: {
                readOnlyHint: true,
                openWorldHint: false,
                idempotentHint: true,
                destructiveHint: false,
            },
        },
    },
    {
        name: CONVERSATION_NAME_AGENT_NAME,
        description: "Creates conversation names.",
        instructions:
            "Analyze the user message very well. Come up with a name for this conversation. Max 3-6 words. The name should be in the conversation locale. Answer with the name of the conversation only. Don't include quotes.",
        model: {
            id: "openai/gpt-5.4-mini",
            providerMetadata: {

            },
        },
        mcpClient: {
            capabilities: {},
            policy: {
                readOnlyHint: true,
                openWorldHint: false,
                idempotentHint: true,
                destructiveHint: false,
            },
        },
    },
    {
        name: EXPLAIN_TOOL_CALL_AGENT_NAME,
        description: "Explains tool calls for non technical end users",
        instructions:
            "Explain in clear, factual terms what this tool call did and what the result means. Focus only on what happened and what the outcome is, without unnecessary context or friendly language. Use short, concise sentences or bullet points if that improves clarity. The explanation must be straightforward, objective, and easy to understand for any end user. Avoid fluff and stick to the core facts.",
        model: {
            id: "openai/gpt-5.4-mini",
            providerMetadata: {

            },
        },
        mcpClient: {
            capabilities: {},
            policy: {
                readOnlyHint: true,
                openWorldHint: false,
                idempotentHint: false,
                destructiveHint: false,
            },
        },
    },
    {
        name: TOOL_SEARCH_AGENT_NAME,
        description: "Search tools",
        instructions:
            "Select the tools that best satisfy the supplied search goal from the supplied tool catalog. Return exactly one JSON object with the shape {\"selectedToolNames\":[\"exact_tool_name\"]}. Use only exact names present in the catalog, preserve relevance order, include no duplicates, select at most 10 tools, and include no markdown or text outside the JSON object.",
        model: {
            id: "openai/gpt-5.6-luna",
            providerMetadata: {

            },
        },
        mcpClient: {
            capabilities: {},
            policy: {
                readOnlyHint: true,
                openWorldHint: false,
                idempotentHint: false,
                destructiveHint: false,
            },
        },
    }
];
