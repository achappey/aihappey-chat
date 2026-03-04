import type { Provider } from "aihappey-types";

export const aihubmix: Provider = {
  name: "AIHubMix",
  description: "Access every major LLM through a single, unified interface. Connect to ChatGPT, Claude, Gemini, DeepSeek, Doubao, Qwen and more with unlimited concurrency. Build smarter, faster.",
  icons: [{
    src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/aihubmix-color.png"
  }],
  urls: {
    homepage: "https://aihubmix.com",
    docs: "https://docs.aihubmix.com",
    pricing: "https://aihubmix.com/models",
    privacyPolicy: "https://docs.aihubmix.com/en/terms-and-privacy/Privacy",
    termsOfService: "https://docs.aihubmix.com/en/terms-and-privacy/Terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

