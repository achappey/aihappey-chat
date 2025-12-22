//export const defaultProviders = ["OpenAI", "Anthropic", "Google", "xAI"];

export const defaultProviderMetadata = {
  "pollinations": {
    "reasoning_effort": "low"
  },
  "openai": {
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
    "code_interpreter": undefined,
    "reasoning": {
      "effort": "none",
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
  },
  "google": {
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
  },
  "anthropic": {
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
  },
  "mistral": {
    "web_search_premium": {
      "type": "web_search_premium"
    },
    "code_interpreter": {
      "type": "code_interpreter"
    },
    "image_generation": {
      "type": "image_generation"
    },
  },
  "groq": {
    "browser_search": undefined,
    "code_interpreter": undefined,
    "reasoning": {
      "effort": "medium"
    },
    "parallel_tool_calls": true,
  },
  "cohere": {
    "thinking": {
      "budget_tokens": 2048
    },
    "citation_options": {
      "mode": "enabled"
    }
  },
  "together": {
    "reasoning_effort": "medium"
  },
  "jina": {
    "reasoning_effort": "medium"
  },
  "xai": {
    "web_search": {
      "allowed_domains": [],
      "excluded_domains": [],
      "enable_image_understanding": true
    },
    "x_search": undefined,
    "code_execution": undefined,
    "reasoning": {},
    "parallel_tool_calls": true
  },
  "perplexity": {
    "web_search_options": {
      "search_context_size": "medium",
      "image_search_relevance_enhanced": false,
      "user_location": {
        "latitude": null,
        "longitude": null,
        "country": null
      }
    },
    "search_mode": "web",
    "reasoning_effort": "medium",
    "return_images": false,
    "return_related_questions": false,
    "enable_search_classifier": false,
    "disable_search": false
  }
};