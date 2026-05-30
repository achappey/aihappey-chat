import type { Provider } from "aihappey-types";

export const jkaihub: Provider = {
  name: "JKAIHub",
  description: "Enterprise-grade AI API Gateway providing OpenAI-compatible API interface.",
  icons: [{
    src: "https://aihub.jk.hk/jk-logo.svg"
  }],
  urls: {
    homepage: "https://aihub.jk.hk",
    docs: "https://aihub.jk.hk/docs"
  },
  providerCountry: "HK",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

