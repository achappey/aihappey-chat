import type { Provider } from "aihappey-types";

export const paraloncloud: Provider = {
  name: "ParalonCloud",
  description:
    "Access powerful LLMs through a single API. Drop-in OpenAI replacement with generous rate limits. Powered by a distributed network of high-performance GPUs.",
  urls: {
    homepage: "https://ai.paraloncloud.com",
    docs: "https://paraloncloud.com/docs",
    pricing: "https://ai.paraloncloud.com/#pricing",
    termsOfService: "https://paraloncloud.com/terms",
    console: "https://ai.paraloncloud.com/console"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};