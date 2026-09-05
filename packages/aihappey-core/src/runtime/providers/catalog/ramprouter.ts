import type { Provider } from "aihappey-types";

export const ramprouter: Provider = {
  name: "RampRouter",
  description: "An LLM gateway that cuts inference costs by 40% on average. One endpoint for OpenAI, Anthropic, and open models – routed automatically.",
  urls: {
    homepage: "https://router.com",
    docs: "https://docs.router.com",
    termsOfService: "https://ramp.com/legal/developer-terms/developer-terms/router-terms-of-service",
    privacyPolicy: "https://ramp.com/legal/privacy-terms/privacy-terms/router-privacy-notice"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

