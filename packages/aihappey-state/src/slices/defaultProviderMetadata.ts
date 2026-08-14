export const defaultProviderMetadata = {
  "pollinations": {
    "reasoning_effort": "low"
  },
  "cerebras": {

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
          "model": "gpt-image-2",
          "partial_images": 3,
          "quality": "auto",
          "action": "auto",
          "moderation": "auto",
          "output_compression": 100,
          "background": "auto",
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
    "store": false,
    "service_tier": "auto",
    "context_management": [
      {
        "type": "compaction",
        "compact_threshold": 512000
      }
    ],
    "reasoning": {
      "effort": "medium",
      "context": "auto",
      "mode": "standard",
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
    "plugins": undefined
  },
  "requesty": {
    "requesty": {
      "auto_cache": true
    }
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
    "store": false,
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
    "service_tier": "auto",
    "cache_control": { "type": "ephemeral" },
    "tools": [
      {
        "name": "web_search",
        "type": "web_search_20260318",
        "max_uses": 5,
        "allowed_callers": ["direct"],
        "allowed_domains": null,
        "blocked_domains": null,
        "user_location": null
      },
      {
        "name": "web_fetch",
        "type": "web_fetch_20260318",
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
        "type": "code_execution_20260521"
      }
    ],
    "max_tokens": 64000,
    "thinking": {
      "type": "adaptive"
    },
    "output_config": {
      "effort": "medium"
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
  "zai": {
    "thinking": {
      "type": "enabled",
      "clear_thinking": true
    },
    "tool_stream": false,
    "tools": [
      {
        "type": "web_search",
        "web_search": {
          "enable": true,
          "search_engine": "search_pro_jina",
          "count": 10,
          "search_recency_filter": "noLimit",
          "content_size": "medium",
          "result_sequence": "after",
          "search_result": false,
          "require_search": false
        }
      }
    ]
  },
  "nscale": {
    "reasoning_effort": "medium"
  },
  "novita": {
    "separate_reasoning": undefined,
    "enable_thinking": true
  },
  "sambanova": {
    "reasoning": {
      "effort": "medium"
    },
    "truncation": "auto",
    "parallel_tool_calls": true,
  },
  "venice": {
    "reasoning": undefined,
    "seed": undefined,
    "venice_parameters": {
      "enable_e2ee": true,
      "include_venice_system_prompt": true,
      "enable_web_search": "off",
      "enable_web_scraping": false,
      "enable_web_citations": false,
      "include_search_results_in_stream": false,
      "return_search_results_as_documents": false,
      "strip_thinking_response": false,
      "disable_thinking": false,
      "character_slug": undefined,
      "enable_x_search": false
    },
    "tools": []
  },
  "spacexai": {
    "store": false,
    "service_tier": "default",
    "tools": [{
      "type": "web_search",
      "allowed_domains": [],
      "excluded_domains": [],
      "enable_image_understanding": true,
      "enable_image_search": true
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
  "copilot": {
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
      ]
  },
  "poolside": {
    "reasoning": {
      "effort": "medium"
    }
  },
  "linkup": {
    "includeImages": false,
    "mode": "Auto",
    "reasoningDepth": "L"
  },
  "ninjachat": {
    "group": "web",
    "max_results": 10,
    "search_depth": "basic",
    "include_images": false,
    "topic": "general"
  },
  "webcrawlerapi": {
    "max_spend_usd": 0.5,
    "urls": undefined,
    "seed_urls_only": undefined
  },

  "murfai": {},
  "tinyfish": {},
  "depaza": {
    "mode": "standard",
    "depaza_events": true
  },
  "cortecs": {
    "preference": "balanced",
    "eu_native": false,
    "allow_zero_data_retention": false,
    "enable_model_fallback": true,
    "parallel_tool_calls": true
  },
};
