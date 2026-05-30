import type { Provider } from "aihappey-types";

export const brave: Provider = {
  name: "Brave",
  description: "The only search API with its own Web index at scale. Truly independent, lightning-fast, and built to power AI apps. Private and secure, your queries never leave Brave.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://brave.com&size=256"
  }],
  urls: {
    homepage: "https://brave.com/search/api",
    docs: "https://api-dashboard.search.brave.com/app/documentation",
    privacyPolicy: "https://search.brave.com/help/privacy-policy",
    termsOfService: "https://brave.com/terms-of-use"
  },
  providerCountry: "US",
  category: "search_data",
  inferenceRegions: ["World"]

};

