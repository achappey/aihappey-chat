import type { Provider } from "aihappey-types";

export const linkup: Provider = {
  name: "Linkup",
  description: "The production-grade Web Search API for AI. Used by McKinsey, SNCF, Cohere, Legora, Polymarket, and Artisan AI. #1 on OpenAI's SimpleQA",
  icons: [{
    src: "https://www.linkup.so/_next/static/media/favicon-dark.a8d985c0.png",
    theme: "dark",
  }, {
    src: "https://www.linkup.so/_next/static/media/favicon.9f4258b0.png",
    theme: "light",
  }],
  urls: {
    homepage: "https://www.linkup.so",
    docs: "https://docs.linkup.so",
    pricing: "https://www.linkup.so/pricing",
    privacyPolicy: "https://www.linkup.so/privacy-policy",
    termsOfService: "https://www.linkup.so/terms-of-use"
  },
  providerCountry: "FR",
  inferenceRegions: ["World"]

};

