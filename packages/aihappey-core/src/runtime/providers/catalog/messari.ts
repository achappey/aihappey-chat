import type { Provider } from "aihappey-types";

export const messari: Provider = {
  name: "Messari",
  description: "Access standardized crypto data trusted by leading exchanges, asset managers, and financial institutions. Get real-time market data, on-chain metrics, research insights, and more through our enterprise-grade API.",
  icons: [{
    src: "https://messari.io/apple-icon.png?e8e84c5ccf80b384"
  }],
  urls: {
    homepage: "https://messari.io",
    docs: "https://docs.messari.io",
    pricing: "https://messari.io/pricing",
    privacyPolicy: "https://messari.io/privacy-policy",
    termsOfService: "https://messari.io/terms-of-service"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

