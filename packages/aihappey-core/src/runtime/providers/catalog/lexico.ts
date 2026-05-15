import type { Provider } from "aihappey-types";

export const lexico: Provider = {
  name: "LexiCo",
  description: "Lower AI costs. Change one URL. Pay less per request.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://lexisaas.com&size=128"
  }],
  urls: {
    homepage: "https://lexisaas.com",
    docs: "https://lexisaas.com/docs",
    pricing: "https://lexisaas.com/pricing",
    privacyPolicy: "https://lexisaas.com/privacy",
    termsOfService: "https://lexisaas.com/terms"
  },
  providerCountry: "NO",
  inferenceRegions: ["World"]

};

