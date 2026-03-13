import type { Provider } from "aihappey-types";

export const dreamgen: Provider = {
  name: "DreamGen",
  description: "You define the world, steer the plot, and our AI will do as you say. The only limit is your imagination.",
  icons: [{
    src: "https://cdn-1.webcatalog.io/catalog/dreamgen/dreamgen-icon-filled-256.webp?v=1724922116529"
  }],
  urls: {
    homepage: "https://dreamgen.com",
    docs: "https://dreamgen.com/docs",
    pricing: "https://dreamgen.com/pricing",
    privacyPolicy: "https://dreamgen.com/privacy",
    termsOfService: "https://dreamgen.com/terms"
  },
  providerCountry: "CZ",
  inferenceRegions: ["World"]

};

