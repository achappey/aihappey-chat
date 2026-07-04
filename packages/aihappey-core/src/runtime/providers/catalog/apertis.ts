import type { Provider } from "aihappey-types";

export const apertis: Provider = {
  name: "Apertis",
  description: "Access GPT-5.2, Claude Opus 4.5, Gemini 3 Pro and 480+ AI models with one API. Coding Plan for Claude Code, Cursor, Aider & OpenClaw. Free prompt cache included.",
  icons: [{
    src: "https://apertis.ai/logo.svg"
  }],
  urls: {
    homepage: "https://apertis.ai",
    docs: "https://docs.apertis.ai",
    pricing: "https://apertis.ai/models",
    privacyPolicy: "https://apertis.ai/privacy",
    termsOfService: "https://apertis.ai/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.apertis.ai",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses", "/v1/messages"],

};

