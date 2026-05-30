import type { Provider } from "aihappey-types";

export const orqagentruntime: Provider = {
  name: "OrqAgentRuntime",
  description: "Launch and manage autonomous agents with memory, tools, and real-time execution without managing infrastructure. Build multi-step agents with human-in-the-loop control and full observability built in.",
  icons: [
    {
      src: "https://avatars.githubusercontent.com/u/92824965?s=280&v=4"
    }
  ],
  urls: {
    homepage: "https://orq.ai/platform/agent-runtime",
    docs: "https://docs.orq.ai",
    console: "https://my.orq.ai",
    pricing: "https://orq.ai/pricing",
    termsOfService: "https://orq.ai/legal/terms-of-service",
    privacyPolicy: "https://orq.ai/legal/privacy"
  },
  providerCountry: "NL",
  category: "inference_compute",
  inferenceRegions: ["World"]
};

