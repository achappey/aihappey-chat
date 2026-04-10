export const defaultProviderMetadata = {
  "pollinations": {
    "reasoning_effort": "low"
  },
  "openai": {
    "tools":
      [
        {
          "type": "web_search",
          "user_location": {
            "type": "approximate",
            "city": null,
            "region": null,
            "country": null,
            "timezone ": null
          }
        },
        {
          "type": "image_generation",
          "model": "gpt-image-1.5",
          "partial_images": 3,
          "quality": "auto",
          "action": "auto",
          "moderation": "auto",
          "output_compression": 100,
          "background": "auto",
          "input_fidelity": "low",
          "size": "auto"
        }
      ],
    "include":
      [
        "web_search_call.action.sources",
        "reasoning.encrypted_content",
        "code_interpreter_call.outputs",
        "file_search_call.results"
      ],
    "parallel_tool_calls": true,
    "file_search": undefined,
    "truncation": "auto",
    "service_tier": "auto",
    "native_mcp": false,
    "imageInputDetail": "auto",
    "code_interpreter": undefined,
    "context_management": undefined,
    "reasoning": {
      "effort": "none",
      "summary": "auto"
    },
    "web_search": {
      "user_location": {
        "type": "approximate",
        "city": null,
        "region": null,
        "country": null,
        "timezone ": null
      }
    },
    "image_generation": {
      "model": "gpt-image-1.5",
      "partial_images": 3,
      "quality": "auto",
      "action": "auto",
      "moderation": "auto",
      "output_compression": 100,
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
    "tools": [
      {
        "name": "web_search",
        "type": "web_search_20260209",
        "max_uses": 5,
        "allowed_domains": null,
        "blocked_domains": null,
        "user_location": null
      },
      {
        "name": "code_execution",
        "type": "code_execution_20260120"
      }
    ],
    "anthropic-beta": [
      "code-execution-2025-08-25",
      "files-api-2025-04-14",
      "output-128k-2025-02-19",
      "interleaved-thinking-2025-05-14",
      "web-fetch-2025-09-10",
      "context-management-2025-06-27",
      "fine-grained-tool-streaming-2025-05-14",
      "mcp-client-2025-04-04",
      "skills-2025-10-02"
    ],
    "thinking": {
      "budget_tokens": 8192
    },
    "container": undefined,
    "native_mcp": false,
  },
  "mistral": {
    "tools": [
      {
        "type": "web_search_premium"
      },
      {
        "type": "code_interpreter"
      },
      {
        "type": "image_generation"
      }
    ],
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
  "nscale": {
    "reasoning_effort": "medium"
  },
  "novita": {
    "separate_reasoning": undefined,
    "enable_thinking": true
  },
  "sambanova": {
    "reasoning_effort": "medium",
    "parallel_tool_calls": true,
    "chat_template_kwargs": {
      "enable_thinking": true
    }
  },
  "xai": {
    "tools": [{
      "type": "web_search",
      "allowed_domains": [],
      "excluded_domains": [],
      "enable_image_understanding": true
    }],
    "web_search": {
      "allowed_domains": [],
      "excluded_domains": [],
      "enable_image_understanding": true
    },
    "include":
      [
        "reasoning.encrypted_content"
      ],
    "x_search": undefined,
    "code_execution": undefined,
    "reasoning": {
    },
    "parallel_tool_calls": true
  },
  "perplexity": {
    "tools":
      [
        {
          "type": "web_search",
          "filters": {
            "search_domain_filter": [],
            "last_updated_after_filter": "",
            "last_updated_before_filter": "",
            "search_after_date_filter": "",
            "search_before_date_filter": "",
            "search_recency_filter": ""
          },
          "max_tokens": "",
          "max_tokens_per_page": "",
          "user_location": {
            "city": "",
            "country": "",
            "latitude": "",
            "longitude": "",
            "region": ""
          }
        },
        {
          "type": "fetch_url",
          "max_urls": 5
        }
      ],
    "web_search": {
      "type": "web_search",
      "filters": {
        "search_domain_filter": [],
        "last_updated_after_filter": "",
        "last_updated_before_filter": "",
        "search_after_date_filter": "",
        "search_before_date_filter": "",
        "search_recency_filter": ""
      },
      "max_tokens": "",
      "max_tokens_per_page": "",
      "user_location": {
        "city": "",
        "country": "",
        "latitude": "",
        "longitude": "",
        "region": ""
      }
    },
    "fetch_url": {
      "type": "fetch_url",
      "max_urls": ""
    },
    "web_search_options": {
      "search_type": "auto",
      "search_context_size": "medium",
      "image_search_relevance_enhanced": false,
      "user_location": {
        "latitude": null,
        "longitude": null,
        "country": null,
        "region": null,
        "city": null,
      }
    },
    "search_mode": "web",
    "reasoning_effort": "medium",
    "return_images": false,
    "return_related_questions": false,
    "enable_search_classifier": false,
    "disable_search": false
  }
  ,
  "murfai": {}
};
