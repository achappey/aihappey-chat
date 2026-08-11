import type { Provider } from "aihappey-types";

export const llmhubifs: Provider = {
  name: "LLMHubIFS",
  description: "Access LLMs hosted by IFS. LLMHub is a platform to access and test out different LLMs over an API.",
  urls: {
    homepage: "https://llmhub.infs.ai",
    docs: "https://llmhub.infs.ai/docs",
    privacyPolicy: "https://llmhub.infs.ai/about",
    termsOfService: "https://llmhub.infs.ai/about"
  },
  experimental: true,
  providerCountry: "CH",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

