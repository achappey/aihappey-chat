import type { Provider } from "aihappey-types";

export const aibadgr: Provider = {
  name: "AIBadgr",
  description: "Production AI execution layer and AI provider for OpenAI & Claude APIs. Run requests via passthrough or Badgr-managed models.",
  icons: [{
    src: "https://aibadgr.com/favicon.ico"
  }],
  urls: {
    homepage: "https://aibadgr.com",
    docs: "https://aibadgr.com/#docs",
    pricing: "https://aibadgr.com/#pricing",
    privacyPolicy: "https://aibadgr.com/privacy",
    termsOfService: "https://aibadgr.com/terms"
  },
  providerCountry: "AU",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

