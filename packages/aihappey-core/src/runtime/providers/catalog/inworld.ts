import type { Provider } from "aihappey-types";

export const inworld: Provider = {
  name: "Inworld",
  description: "#1 ranked TTS with under 200ms latency, voice cloning, and 25x lower cost. Realtime agents built for scale.",
  icons: [
    {
      src: "https://inworld.ai/favicon.ico"
    }
  ],
  urls: {
    homepage: "https://inworld.ai",
    docs: "https://docs.inworld.ai",
    pricing: "https://inworld.ai/pricing",
    privacyPolicy: "https://inworld.ai/privacy",
    termsOfService: "https://inworld.ai/terms",
    console: "https://studio.inworld.ai"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

