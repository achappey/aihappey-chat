export const defaultProviderRealtimeMetadata = {
  "openai": {
    "expires_after": {
      "anchor": "created_at",
      "seconds": 600
    },
    "session": {
      "type": "transcription",
      "audio": {
        "input": {
          "transcription": {
          }
        }
      }
    }
  },
  /**
   * ElevenLabs realtime (flat config mapped to WSS query params).
   *
   * Values are intentionally empty/undefined here; users can fill via UI.
   */
  "elevenlabs": {
    // Required by ElevenLabs handshake (derived from selectedModel at runtime): model_id
    // Optional:
    // audio_format: "pcm_16000" | "pcm_8000" | ...
    // sample_rate: 16000
    // language_code: "en"
    // include_timestamps: false
    // include_language_detection: false
    // commit_strategy: "manual" | "vad"
    // vad_silence_threshold_secs: 1.5
    // vad_threshold: 0.4
    // min_speech_duration_ms: 100
    // min_silence_duration_ms: 100
    // enable_logging: true
  }
  ,
  /**
   * Deepgram realtime (flat config mapped to WSS query params).
   *
   * Defaults are intentionally empty to support minimal/empty-config usage.
   * The only required param (`model`) is derived from the currently selected model at runtime.
   *
   * Common options (all optional):
   * - encoding: "linear16" | "mulaw" | ...
   * - sample_rate: 16000
   * - channels: 1
   * - interim_results: true
   * - punctuate: true
   * - endpointing: 200
   */
  "deepgram": {
    // Intentionally empty.
  }
  ,
  /**
   * Gladia realtime (v2/live WebSocket).
   *
   * Token handling: backend returns a full connectable WSS URL (including token).
   * Frontend uses this bucket only for optional audio/config overrides.
   */
  "gladia": {
    // Optional audio params (if you want to override defaults):
    // sample_rate: 16000
    // encoding: "wav/pcm" (not used by the browser WS sender)
    // bit_depth: 16 (not used by the browser WS sender)
    // channels: 1 (browser implementation is mono)
  }
  ,
  /**
   * AssemblyAI realtime (v3/ws WebSocket).
   *
   * The only strictly required query params are set in the client even when this config is empty:
   * - sample_rate (defaulted)
   * - vad_threshold (defaulted)
   * - speech_model (derived from selectedModel at runtime)
   */
  "assemblyai": {
    // Intentionally empty.
  },
  /**
   * Soniox realtime WebSocket configuration.
   *
   * The browser transport supplies the temporary API key and fixed raw-audio
   * settings (mono pcm_s16le at 16 kHz). This bucket deliberately remains
   * empty but accepts Soniox start-message options such as language_hints,
   * context, diarization, endpoint detection/tuning, and translation. That
   * keeps it ready for a dedicated realtime settings form later.
   *
   * Non-realtime Soniox transcription options should live independently in
   * defaultProviderTranscriptionMetadata when that capability is introduced.
   */
  "soniox": {
    // Intentionally empty.
  }
};

export const defaultProviderRealtimeConversationMetadata = {
  "openai": {
    "expires_after": {
      "anchor": "created_at",
      "seconds": 600
    },
    "session": {
      "type": "realtime",
      "output_modalities": ["audio"],
      "reasoning": {
        "effort": "low"
      },
      "audio": {
        "input": {
          "format": {
            "type": "audio/pcm",
            "rate": 24000
          },
          "noise_reduction": {
            "type": "near_field"
          },
          "transcription": {
            "model": "gpt-4o-mini-transcribe"
          },
          "turn_detection": {
            "type": "semantic_vad",
            "eagerness": "auto",
            "create_response": true,
            "interrupt_response": true
          }
        },
        "output": {
          "format": {
            "type": "audio/pcm",
            "rate": 24000
          },
          "voice": "marin",
          "speed": 1
        }
      },
      "tracing": null,
      "truncation": "auto"
    }
  },
  "spacexai": {
    "expires_after": {
      "anchor": "created_at",
      "seconds": 600
    },
    "session": {
      "voice": "eve",
      "turn_detection": {
        "type": "server_vad"
      },
      "audio": {
        "input": {
          "format": {
            "type": "audio/pcm",
            "rate": 24000
          }
        },
        "output": {
          "format": {
            "type": "audio/pcm",
            "rate": 24000
          }
        }
      }
    }
  },
  "assemblyai": {
    "expires_after": {
      "anchor": "created_at",
      "seconds": 300
    },
    "session": {
      "output": {
        "voice": "ivy",
        "format": {
          "encoding": "audio/pcm"
        }
      },
      "input": {
        "format": {
          "encoding": "audio/pcm"
        },
        "turn_detection": {
          "interrupt_response": true
        }
      }
    }
  },
  "agentphone": {
    "expires_after": {
      "anchor": "created_at",
      "seconds": 600
    },
    "session": {
      /** The runtime derives agentId from model ids shaped like agentphone/<agent-id>. */
      "sampleRate": 24000,
      "emitRawAudioSamples": false
    }
  }
};
