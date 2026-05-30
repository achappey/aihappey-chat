import type { Provider } from "aihappey-types";

export const privatemode: Provider = {
  name: "Privatemode",
  description: "Privatemode is the first AI service that protects the confidentiality of your data end-to-end. Use AI without security and privacy worries.",
  icons: [{
    src: "https://cdn-1.webcatalog.io/catalog/privatemode-ai/privatemode-ai-icon-filled-256.png?v=1745551566709"
  }],
  urls: {
    homepage: "https://www.privatemode.ai",
    docs: "https://docs.privatemode.ai",
    pricing: "https://www.privatemode.ai/pricing",
    privacyPolicy: "https://www.privatemode.ai/privacy-policy",
    termsOfService: "https://www.privatemode.ai/terms-of-service"
  },
  providerCountry: "DE",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

