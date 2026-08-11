import type { Provider } from "aihappey-types";

export const keymeai: Provider = {
  name: "KeyMeAI",
  description: "Access DeepSeek, Doubao, and Qwen through one OpenAI-compatible API. Auto failover. Singapore-based.",
  urls: {
    homepage: "https://keymeai.com",
    docs: "https://keymeai.com/docs",
    privacyPolicy: "https://keymeai.com/privacy",
    termsOfService: "https://keymeai.com/terms"
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

