import type { Provider } from "aihappey-types";

export const standardcompute: Provider = {
  name: "StandardCompute",
  description: "Flat-rate LLM subscription for coding agents — OpenAI-compatible API for OpenCode, Cline, Aider, Codex, Kilo, Claude Code and always-on agents like OpenClaw and Hermes. Frontier models, smart routing for the most intelligence per dollar, no 5-hour usage windows, no per-token billing.",
  urls: {
    homepage: "https://standardcompute.com",
    docs: "https://standardcompute.com/dashboard/documentation",
    console: "https://standardcompute.com/dashboard",
    pricing: "https://standardcompute.com/pricing",
    termsOfService: "https://standardcompute.com/terms",
    privacyPolicy: "https://standardcompute.com/privacy"
  },
  providerCountry: "NO",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

