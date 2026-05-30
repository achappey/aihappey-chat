import type { Provider } from "aihappey-types";

export const perplexity: Provider = {
  name: "Perplexity",
  description:
    "Build with the best AI answer engine API, created by Perplexity. Power your products with the fastest, cheapest offering out there. Delivering unparalleled real-time, web-wide research and Q&A capabilities.",
  icons: [
    {
      src: "https://brandlogos.net/wp-content/uploads/2025/05/perplexity_icon-logo_brandlogos.net_a9d3e-512x591.png",
    },
  ],
  urls: {
    homepage: "https://www.perplexity.ai/api-platform",
    docs: "https://docs.perplexity.ai",
    privacyPolicy: "https://www.perplexity.ai/hub/legal/privacy-policy",
    termsOfService: "https://www.perplexity.ai/hub/legal/perplexity-api-terms-of-service",
    console: "https://www.perplexity.ai/settings/api"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

