import type { Provider } from "aihappey-types";

export const eugpt: Provider = {
  name: "EuGPT",
  description: "AI for organizations built on European values. Compliance with legislation is our starting point, not an afterthought.",
  urls: {
    homepage: "https://www.eugpt.ai",
    docs: "https://www.eugpt.ai/en/api",
    pricing:"https://eugpt.ai/pricing",
    privacyPolicy: "https://www.eugpt.ai/en/privacy",
    termsOfService: "https://www.eugpt.ai/en/terms"
  },
  providerCountry: "NL",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

