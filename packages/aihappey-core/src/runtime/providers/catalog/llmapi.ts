import type { Provider } from "aihappey-types";

export const llmapi: Provider = {
  name: "LLMAPI",
  description:
    "Get not the cheapest LLM API - get it FREE! LLM API offers 100+ large language models API for free now.",
  icons: [
    {
      src: "https://llmapi.ai/wp-content/uploads/2026/01/Frame-2085662993.png",
    },
  ],
  urls: {
    homepage: "https://llmapi.ai",
    docs: "https://docs.llmapi.ai",
    console: "https://app.llmapi.ai",
    privacyPolicy: "https://llmapi.ai/policy",
    termsOfService: "https://llmapi.ai/terms"
  },
  providerCountry: "GB",
  inferenceRegions: ["World"]
};

