import type { Provider } from "aihappey-types";

export const ltx: Provider = {
  name: "LTX",
  description: "LTX brings together open video models, a full creative studio, and a developer API, everything you need to build and ship AI video at scale.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ltx.io&size=128"
  }],
  urls: {
    homepage: "https://ltx.io",
    docs: "https://docs.ltx.video",
    pricing: "https://ltx.io/model/api/pricing",
    privacyPolicy: "https://static.lightricks.com/legal/Privacy%20Policy%20-%20LTX%20Platform.pdf",
    termsOfService: "https://static.lightricks.com/legal/terms-of-use.pdf"
  },
  providerCountry: "IL",
  category: "model_provider",
  inferenceRegions: ["World"]

};

