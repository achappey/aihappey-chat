import type { Provider } from "aihappey-types";

export const upstage: Provider = {
  name: "Upstage",
  description:
    "Upstage builds powerful large language models and document processing engines to transform workflows and empower leading businesses like yours.",
  icons: [
    {
      src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/upstage-color.png",
    },
  ],
  urls: {
    homepage: "https://www.upstage.ai",
    pricing: "https://www.upstage.ai/pricing/api",
    docs: "https://console.upstage.ai/docs/getting-started",
    termsOfService: "https://www.upstage.ai/terms-of-service",
    privacyPolicy: "https://www.upstage.ai/privacy-policy",
    console: "https://console.upstage.ai"
  },
  providerCountry: "KR",
  category: "model_provider",
  inferenceRegions: ["World"]

};

