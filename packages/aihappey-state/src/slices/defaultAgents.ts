import { Agent } from "aihappey-types";

export const defaultAgents: Agent[] = [{
    name: "OpenAIAgent",
    description: "Agent with all OpenAI capabilities",
    instructions: "",
    model: {
        id: "openai/gpt-5.2",
        options: {
            temperature: 1
        },
        providerMetadata: {
            "include":
                [
                    "web_search_call.action.sources",
                    "reasoning.encrypted_content",
                    "code_interpreter_call.outputs",
                    "file_search_call.results"
                ],
            "parallel_tool_calls": true,
            "file_search": undefined,
            "native_mcp": false,
            "code_interpreter": {

            },
            "reasoning": {
                "effort": "low",
                "summary": "auto"
            },
            "web_search": {
                "search_context_size": "medium",
                "user_location": {
                    "type": "approximate",
                    "city": null,
                    "region": null,
                    "country": null,
                    "timezone ": null
                }
            },
            "image_generation": {
                "model": "gpt-image-1",
                "partial_images": 3,
                "quality": "auto",
                "background": "auto",
                "input_fidelity": "low",
                "size": "auto"
            }
        }
    }
}]