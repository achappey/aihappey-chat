import type { Provider } from "aihappey-types";

export const elkapi: Provider = {
  name: "ElkAPI",
  description: "A unified AI model hub for aggregation & distribution. It supports cross-converting various LLMs into OpenAI-compatible, Claude-compatible, or Gemini-compatible formats. A centralized gateway for personal and enterprise model management.",
  icons: [{
    src: "https://api.elkapi.com/logo.png"
  }],
  urls: {
    homepage: "https://api.elkapi.com",
    docs: "https://apidoc.elkapi.com",
    pricing: "https://wisdom-gate.juheapi.com/pricing",
    privacyPolicy: "https://apidoc.elkapi.com/doc-1807431",
    termsOfService: "https://apidoc.elkapi.com/doc-1807432"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

