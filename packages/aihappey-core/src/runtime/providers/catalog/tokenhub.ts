import type { Provider } from "aihappey-types";

export const tokenhub: Provider = {
  name: "TokenHub",
  description: "TokenHub — Access 100+ AI models with one OpenAI-compatible API. Fast, cost-effective global inference.",
  icons: [{
    src: "https://www.tokenhub.link/icon.jpg"
  }],
  urls: {
    homepage: "https://www.tokenhub.link",
    docs: "https://www.tokenhub.link/docs",
    pricing: "https://www.tokenhub.link/pricing.html",
    privacyPolicy: "https://www.tokenhub.link/privacy.html",
    termsOfService: "https://www.tokenhub.link/terms.html"
  },
  providerCountry: "CN",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

