import type { Provider } from "aihappey-types";

export const trustedrouter: Provider = {
  name: "TrustedRouter",
  description: "One OpenAI-compatible API for hundreds of models, routed through attested infrastructure with ZDR options, provider failover, BYOK, and no prompt or output logs by default.",
  urls: {
    homepage: "https://trustedrouter.com",
    docs: "https://trustedrouter.com/docs",
    pricing:"https://trustedrouter.com/pricing",
    termsOfService: "https://trustedrouter.com/terms",
    privacyPolicy: "https://trustedrouter.com/privacy"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World", "Europe"]
};

