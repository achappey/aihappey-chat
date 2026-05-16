import type { Provider } from "aihappey-types";

export const igpt: Provider = {
  name: "IGPT",
  description: "iGPT turns company data, tools, and knowledge into reasoning-ready context for AI systems, workflows, and teams.",
  icons: [{
    src: "https://www.igpt.ai/wp-content/uploads/2026/04/favicon-512-2127bab8-b02e-4d96-bd7b-3f9013cb222c-150x150.png"
  }],
  urls: {
    homepage: "https://www.igpt.ai",
    docs: "https://www.igpt.ai/pricing",
    pricing: "https://wisdom-gate.juheapi.com/pricing",
    privacyPolicy: "https://www.igpt.ai/privacy-policy",
    termsOfService: "https://www.igpt.ai/terms-and-conditions"
  },
  providerCountry: "GB",
  inferenceRegions: ["World"]

};

