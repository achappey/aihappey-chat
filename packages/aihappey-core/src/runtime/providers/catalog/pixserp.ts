import type { Provider } from "aihappey-types";

export const pixserp: Provider = {
  name: "Pixserp",
  description: "Fast SERP and webpage scraping API. Search, Maps, Images, News, Lens, full content extraction.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://pixserp.com&size=128"
  }],
  urls: {
    homepage: "https://pixserp.com",
    docs: "https://pixserp.com/docs",
    pricing: "https://pixserp.com/#pricing",
    privacyPolicy: "https://pixserp.com/privacy",
    termsOfService: "https://pixserp.com/terms"
  },
  providerCountry: "US",
  category: "app_tools",
  inferenceRegions: ["World"]

};

