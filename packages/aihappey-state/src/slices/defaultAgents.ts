import { Agent } from "aihappey-types";

export const defaultAgents: Agent[] = [{
    name: "OpenAIAgent",
    description: "Agent with all OpenAI capabilities",
    instructions: "You are an Agent with all OpenAI capabilities",
    model: {
        id: "openai/gpt-5.2",
        options: {
            temperature: 1
        },
        providerMetadata: {
            "tools": [{
                "type": "image_generation",
                "model": "gpt-image-1",
                "partial_images": 3,
                "quality": "auto",
                "background": "auto",
                "input_fidelity": "low",
                "size": "auto"
            }, {
                "type": "web_search",
                "search_context_size": "medium",
                "user_location": null
            }, {
                "type": "code_interpreter",
                "container": {
                    "type": "auto",
                }
            }],
            include:
                [
                    "web_search_call.action.sources",
                    "reasoning.encrypted_content",
                    "code_interpreter_call.outputs",
                    "file_search_call.results"
                ],
            parallel_tool_calls: true,
            reasoning: {
                effort: "low",
                summary: "auto"
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
            tools: [
                {
                    "type": "web_search",
                    "max_uses": 5,
                    "allowed_domains": null,
                    "blocked_domains": null,
                    "user_location": null
                },
                {
                    "type": "code_execution"
                }
            ],
            thinking: {
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
            }
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
            tools: [
                {
                    "type": "web_search",
                    "allowed_domains": [],
                    "excluded_domains": [],
                    "enable_image_understanding": true
                },
                {
                    "type": "x_search"
                },
                {
                    "type": "code_execution"
                }
            ],
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
    instructions: "You are an Agent with all Mistral capabilities",
    model: {
        id: "mistral/mistral-medium",
        options: {
            temperature: 1
        },
        providerMetadata: {
            tools: [
                {
                    "type": "web_search_premium"
                },
                {
                    "type": "code_interpreter"
                },
                {
                    "type": "image_generation"
                }
            ]
        }
    }
}]