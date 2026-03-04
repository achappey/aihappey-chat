import type { Provider } from "aihappey-types";

export const fishaudio: Provider = {
  name: "FishAudio",
  description: "Studio-grade AI text-to-speech and voice cloning. Start using free industry-leading voice generator today with emotion control and 2m+ voices in 8 languages.",
  icons: [
    {
      src: "https://fish.audio/apple-touch-icon.png"
    }
  ],
  urls: {
    homepage: "https://fish.audio",
    docs: "https://docs.fish.audio",
    pricing: "https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits",
    termsOfService: "https://fish.audio/terms",
    privacyPolicy: "https://fish.audio/privacy"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

