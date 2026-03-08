import type { Provider } from "aihappey-types";

export const deepl: Provider = {
  name: "DeepL",
  description:
    "Translate texts & full document files instantly. Accurate translations for individuals and Teams. Millions translate with DeepL every day.",
  icons: [
    {
      src: "https://hel1.your-objectstorage.com/ztudium-cms/deepl_7baa54aa02.jpeg",
    },
  ],
  urls: {
    homepage: "https://www.deepl.com",
    pricing: "https://www.deepl.com/en/pro#api",
    docs: "https://developers.deepl.com",
    privacyPolicy: "https://www.deepl.com/privacy",
    termsOfService: "https://www.deepl.com/terms"
  },
  providerCountry: "DE",
  inferenceRegions: ["Europe"]
};

