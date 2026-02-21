import type { Provider } from "aihappey-types";

export const murfai: Provider = {
  name: "MurfAI",
  description:
    "Choose form 200+ AI voices and generate speech in 20+ languages. Murf's AI Voice Generator and Text to Speech APIs & SDKs lets you create ultra-realistic AI voiceovers in seconds.",
  icons: [
    {
      src: "https://website.cdn.speechify.com/murf-ai-app-logo.png?quality=95&width=2800",
    },
  ],
  urls: {
    homepage: "https://murf.ai",
    docs: "https://murf.ai/api/docs",
    privacyPolicy: "https://murf.ai/legal/privacy-policy",
    termsOfService: "https://murf.ai/legal/terms-of-service",
    console: "https://studio.murf.ai"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

