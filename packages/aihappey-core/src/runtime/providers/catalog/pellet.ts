import type { Provider } from "aihappey-types";

export const pellet: Provider = {
  name: "Pellet",
  description: "Pellet AI routes each request to the smallest capable open-source model — same quality, 87% less cost. OpenAI-compatible API with 12 models, intelligent auto-routing, and full analytics.",
  icons: [{
    src: "https://getpellet.io/favicon.svg"
  }],
  urls: {
    homepage: "https://getpellet.io",
    pricing: "https://getpellet.io/#pricing",
    privacyPolicy: "https://getpellet.io/privacy",
    termsOfService: "https://getpellet.io/terms"
  },
  inferenceRegions: ["World"]
};

