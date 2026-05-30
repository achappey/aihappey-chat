import type { Provider } from "aihappey-types";

export const herma: Provider = {
  name: "Herma",
  description: "Herma AI is an intelligent LLM router that routes API queries to the optimal AI model for each task. OpenAI-compatible API with 60-90% cost savings versus frontier models.",
  icons: [{
    src: "https://hermaai.com/apple-touch-icon.png"
  }],
  urls: {
    homepage: "https://hermaai.com",
    docs: "https://hermaai.com/docs",
    pricing: "https://hermaai.com/upgrade",
    privacyPolicy: "https://hermaai.com/privacy-policy",
    termsOfService: "https://hermaai.com/terms-of-service"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

