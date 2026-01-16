export const defaultProviderSpeechMetadata = {
  "openai": {
    "voice": "alloy",
    "speed": 1,
  },
  "groq": {
  },
  "elevenlabs": {
  },
  "minimax": {
    "language_boost": "auto",
    "voice_setting": {
      "voice_id": "English_Graceful_Lady",
      "speed": 1,
      "vol": 1,
      "pitch": 0
    },
    "audio_setting": {
      "format": "mp3",
      "sample_rate": 32000,
      "bitrate": 128000,
      "channel": 1
    }
  },
  "sarvam": {
    "target_language_code": "en-IN"
  },
  "novita": {
    "minimax": {
      "voice": "Wise_Woman",
      "volume": 1.0,
      "speed": 1.0
    },
    "glm": {
      "voice": "tongtong",
      "volume": 1.0,
      "speed": 1.0
    },
    "txt2speech": {
      "voice": "Emily",
      "volume": 1.0,
      "speed": 1.0
    }
  },
  "together": {
    "cartesia": {
      "voice": "john"
    },
    "hexgrad": {
      "voice": "af_alloy"
    },
    "canopylabs": {
      "voice": "tara"
    }
  },
  "audixa": {
    "voice": "af_bella",
    "speed": 1,
    "emotion": "neutral",
    "temperature": 0.9,
    "top_p": 0.9
  }
};
