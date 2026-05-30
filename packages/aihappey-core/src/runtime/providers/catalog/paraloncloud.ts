import type { Provider } from "aihappey-types";

export const paraloncloud: Provider = {
  name: "ParalonCloud",
  description:
    "Access powerful LLMs through a single API. Drop-in OpenAI replacement with generous rate limits. Powered by a distributed network of high-performance GPUs.",
  icons: [
    {
      src: "https://paraloncloud.com/logo-400.png"
    }
  ],
  urls: {
    homepage: "https://ai.paraloncloud.com",
    pricing: "https://ai.paraloncloud.com/#pricing",
    console: "https://ai.paraloncloud.com/console"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};