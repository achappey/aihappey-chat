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
},
{
    name: "AnthropicAgent",
    description: "Agent with all Anthropic capabilities",
    instructions: "",
    model: {
        id: "anthropic/claude-sonnet-4-5-20250929",
        options: {
            temperature: 1
        },
        providerMetadata: {
            "thinking": {
                "budget_tokens": 8192
            },
            "container": {
                "skills": [{
                    "skill_id": "xlsx",
                    "version": "latest",
                    "type": "anthropic",

                }, {
                    "skill_id": "pptx",
                    "version": "latest",
                    "type": "anthropic",

                }, {
                    "skill_id": "docx",
                    "version": "latest",
                    "type": "anthropic",

                }, {
                    "skill_id": "pdf",
                    "version": "latest",
                    "type": "anthropic",
                }]
            },
            "code_execution": {},
            "memory": undefined,
            "native_mcp": false,
            "web_search": {
                "max_uses": 5,
                "allowed_domains": [],
                "blocked_domains": [],
                "user_location": {
                    "timezone": null,
                    "country": null,
                    "region": null,
                    "city": null,
                }
            },
            "web_fetch": undefined
        }
    }
},
{
    name: "xAIAgent",
    description: "Agent with all xAI capabilities",
    instructions: "",
    model: {
        id: "xai/grok-4-1-fast-reasoning",
        options: {
            temperature: 1
        },
        providerMetadata: {
            "web_search": {
                "allowed_domains": [],
                "excluded_domains": [],
                "enable_image_understanding": true
            },
            "x_search": {},
            "code_execution": {},
            "reasoning": {},
            "parallel_tool_calls": true
        }
    }
},
{
    name: "GoogleAgent",
    description: "Agent with all Google Gemini capabilities",
    instructions: "",
    model: {
        id: "google/gemini-3-pro-preview",
        options: {
            temperature: 1
        },
        providerMetadata: {
            "enableEnhancedCivicAnswers": false,
            "code_execution": {},
            "url_context": {},
            "googleMaps": undefined,
            "google_search": {
                "timeRangeFilter": {
                    "startTime": undefined,
                    "endTime": undefined,
                },
                "excludeDomains": []
            },
            "mediaResolution": "MediaResolutionUnspecified",
            "thinkingConfig": {
                "thinkingBudget": -1,
                "includeThoughts": true,
                "thinkingLevel": "ThinkingLevelUnspecified"
            },
        }
    }
},
{
    name: "MistralAgent",
    description: "Agent with all Mistral capabilities",
    instructions: "",
    model: {
        id: "mistral/mistral-medium",
        options: {
            temperature: 1
        },
        providerMetadata: {
            "web_search_premium": {
                "type": "web_search_premium"
            },
            "code_interpreter": {
                "type": "code_interpreter"
            },
            "image_generation": {
                "type": "image_generation"
            },
        }
    }
}]