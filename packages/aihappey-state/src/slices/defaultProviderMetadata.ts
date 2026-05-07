export const defaultProviderMetadata = {
  "pollinations": {
    "reasoning_effort": "low"
  },
  "openai": {
    "tools":
      [
        {
          "type": "web_search",
          "user_location": null
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
    "truncation": "auto",
    "service_tier": "auto",
    "context_management": undefined,
    "reasoning": {
      "effort": "medium",
      "summary": "auto"
    },
    "parallel_tool_calls": true,
  },
  "openrouter": {
    "tools": [
      {
        "type": "openrouter:web_search"
      },
      {
        "type": "openrouter:datetime"
      }
    ],
    "provider": {
      "zdr": undefined
    },
    "plugins": undefined,
    "headers": undefined
  },
  "requesty": {
    "requesty": {
      "auto_cache": true
    },
    "headers": undefined
  },
  "blackbox": {
    "reasoning": {
      "effort": "medium",
      "summary": undefined,
      "max_tokens": undefined,
      "exclude": undefined,
      "enabled": undefined
    },
    "provider": {
      "zdr": undefined
    }
  },
  "brave": {
    "web_search_options": {
      "search_context_size": "medium"
    },
    "enable_entities": true,
    "enable_citations": true,
    "enable_research": false
  },
  "google": {
    "service_tier": "standard",
    "response_modalities": ["text"],
    "generation_config": {
      "thinking_level": "low",
      "thinking_summaries": "auto",
    },
    "tools": [{
      "type": "url_context"
    }, {
      "type": "google_search",
      "search_types": ["web_search"]
    }]
  },
  "anthropic": {
    "tools": [
      {
        "name": "web_search",
        "type": "web_search_20260209",
        "max_uses": 5,
        "allowed_callers": ["direct"],
        "allowed_domains": null,
        "blocked_domains": null,
        "user_location": null
      },
      {
        "name": "web_fetch",
        "type": "web_fetch_20260309",
        "max_uses": 5,
        "allowed_callers": ["direct"],
        "allowed_domains": null,
        "blocked_domains": null,
        "citations": {
          "enabled": true,
        },
      },
      {
        "name": "code_execution",
        "allowed_callers": ["direct"],
        "type": "code_execution_20260120"
      }
    ],
    "anthropic-beta": "",
    "max_tokens": 64000,
    "thinking": {
      "type": "adaptive"
    },
    "container": undefined
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
    ]
  },
  "groq": {
    "tools": [
    ],
    "truncation": "auto",
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
    "include":
      [
        "web_search_call.action.sources",
        "reasoning.encrypted_content"
      ],
    "reasoning": {
    },
    "parallel_tool_calls": true
  },
  "microsoft": {
    "locationHint": {
      "timeZone": "Europe/Amsterdam"
    }
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
            "search_recency_filter": undefined
          },
          "max_tokens": undefined,
          "max_tokens_per_page": undefined,
          "user_location": {
            "city": "",
            "country": "",
            "latitude": undefined,
            "longitude": undefined,
            "region": ""
          }
        },
        {
          "type": "fetch_url",
          "max_urls": 5
        }
      ],
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
    "return_images": true,
    "return_related_questions": false,
    "enable_search_classifier": false,
    "disable_search": false
  }
  ,
  "murfai": {}
};
