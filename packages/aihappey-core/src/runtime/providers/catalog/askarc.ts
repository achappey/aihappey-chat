import type { Provider } from "aihappey-types";

export const askarc: Provider = {
  name: "AskARC",
  description: "One API. Intelligent Routing. Your Rules. Define your routing logic. AskARC selects the best AI model for every request, optimizing for cost, privacy, performance, or any combination you configure. One endpoint, every model, complete control.",
  icons: [{
    src: "https://askarc.app/assets/images/fenx_head.png"
  }],
  urls: {
    homepage: "https://askarc.app",
    docs: "https://askarc.app/api-docs",
    pricing: "https://askarc.app/pricing",
    console: "https://api.askarc.app/portal",
    privacyPolicy: "https://askarc.app/privacy",
    termsOfService: "https://askarc.app/terms"
  },
  providerCountry: "NL",
  inferenceRegions: ["World"]

};

