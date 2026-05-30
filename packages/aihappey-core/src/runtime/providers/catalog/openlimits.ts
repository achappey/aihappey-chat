import type { Provider } from "aihappey-types";

export const openlimits: Provider = {
  name: "OpenLimits",
  description: "Unlimited Claude + Codex for $200/month. Both providers, one key. No rate limits, no token caps. Drop-in API proxy with real-time usage analytics.",
  icons: [{
    src: "https://openlimits.app/favicon.ico"
  }],
  urls: {
    homepage: "https://openlimits.app",
    docs: "https://openlimits.app/docs",
    pricing: "https://openlimits.app/pricing",
    privacyPolicy: "https://openlimits.app/privacy",
    termsOfService: "https://openlimits.app/terms"
  },
  providerCountry: "DE",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

