import type { Provider } from "aihappey-types";

export const cheapgrok: Provider = {
  name: "CheapGrok",
  description: "CheapGrok delivers production Grok inference with elastic capacity, zero queueing, and pricing tuned for real usage. Keep your latency low and your bill 50% lower than typical providers.",
  icons: [{
    src: "https://www.cheapgrok.com/favicon.ico"
  }],
  urls: {
    homepage: "https://www.cheapgrok.com",
    docs: "https://www.cheapgrok.com/#docs",
    pricing: "https://www.cheapgrok.com/#pricing",
    privacyPolicy: "https://www.cheapgrok.com/privacy.html",
    termsOfService: "https://www.cheapgrok.com/terms.html"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

