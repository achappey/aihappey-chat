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
  }
};
