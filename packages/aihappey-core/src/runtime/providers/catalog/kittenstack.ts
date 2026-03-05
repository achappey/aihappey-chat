import type { Provider } from "aihappey-types";

export const kittenstack: Provider = {
  name: "KittenStack",
  description:
    "Generate stunning AI images with state-of-the-art models.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://kittenstack.com&size=128"
  }],
  urls: {
    homepage: "https://kittenstack.com",
    docs: "https://kittenstack.com/docs",
    pricing: "https://kittenstack.com/#pricing",
    privacyPolicy: "https://kittenstack.com/privacy",
    termsOfService: "https://kittenstack.com/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

