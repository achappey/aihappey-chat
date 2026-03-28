import type { Provider } from "aihappey-types";

export const voiceai: Provider = {
  name: "VoiceAI",
  description: "Create lifelike speech using AI voice agents, voice changer, and text to speech from Voice.ai. Thousands of voices with secure, scalable APIs and SDKs.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://voice.ai&size=128"
  }],
  urls: {
    homepage: "https://voice.ai",
    docs: "https://voice.ai/docs",
    pricing: "https://voice.ai/pricing",
    privacyPolicy: "https://voice.ai/privacy",
    termsOfService: "https://voice.ai/tos"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

