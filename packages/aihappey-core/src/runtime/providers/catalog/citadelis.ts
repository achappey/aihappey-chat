import type { Provider } from "aihappey-types";

export const citadelis: Provider = {
  name: "Citadelis",
  description: "Powerful AI assistance with uncompromising privacy. Your conversations are encrypted, never stored, and processed exclusively on European servers. GDPR compliant.",
  icons: [{
    src: "https://citadelis.eu/icon-152x152.png"
  }],
  urls: {
    homepage: "https://citadelis.eu",
    docs: "https://citadelis.eu/docs/api",
    pricing: "https://citadelis.eu/#pricing",
    privacyPolicy: "https://citadelis.eu/privacy",
    termsOfService: "https://citadelis.eu/terms"
  },
  providerCountry: "FR",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

