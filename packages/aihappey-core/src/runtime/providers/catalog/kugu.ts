import type { Provider } from "aihappey-types";

export const kugu: Provider = {
  name: "Kugu",
  description: "Unified API for 200+ text-to-speech, speech-to-text, and voice cloning models from ElevenLabs, OpenAI, Deepgram, and more. One API key, one bill, zero vendor lock-in.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvhGSZCJ7DBCio2F9Vbtpmhb2VGL2-IVgApw&s"
    }
  ],
  urls: {
    homepage: "https://kugu.ai",
    docs: "https://kugu.ai/docs",
    termsOfService: "https://kugu.ai/terms",
    privacyPolicy: "https://kugu.ai/privacy"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

