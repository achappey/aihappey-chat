import type { Provider } from "aihappey-types";

export const slancha: Provider = {
  name: "Slancha",
  description: "AI inference that improves itself. One OpenAI-compatible endpoint routes across your providers, fine-tunes task-specific models on your real traffic, and redeploys the upgrade automatically. 15.9× cheaper at quality parity on the agent task we measure. BYOK — your provider keys, your bill, your audit chain.",
  icons: [{
    src: "https://slancha.ai/favicon.svg"
  }],
  urls: {
    homepage: "https://slancha.ai",
    docs: "https://slancha.ai/docs",
    pricing: "https://slancha.ai/pricing",
    termsOfService: "https://slancha.ai/terms",
    privacyPolicy: "https://slancha.ai/privacy"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

