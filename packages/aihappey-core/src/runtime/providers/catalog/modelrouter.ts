import type { Provider } from "aihappey-types";

export const modelrouter: Provider = {
  name: "ModelRouter",
  description: "ModelRouter is a unified AI model API that lets you access 100+ models through a single endpoint. Chat with GPT-5, Claude, Gemini, Grok. Generate images with FLUX, Ideogram. Create videos with Kling, Veo, Sora. Synthesize speech with ElevenLabs and Qwen TTS. OpenAI-compatible, pay-as-you-go.",
  icons: [{
    src: "https://app.modelrouter.io/favicon.ico?favicon.d6953a31.ico"
  }],
  urls: {
    homepage: "https://app.modelrouter.io",
    docs: "https://docs.modelrouter.io",
    pricing: "https://app.modelrouter.io/models"
  },
  inferenceRegions: ["World"]

};

