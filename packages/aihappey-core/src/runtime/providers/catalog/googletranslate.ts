import type { Provider } from "aihappey-types";

export const googletranslate: Provider = {
  name: "GoogleTranslate",
  description: "Google's service, instantly translates words, phrases, and web pages between English and over 100 other languages.",
  icons: [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/960px-Google_Translate_logo.svg.png"
    }
  ],
  urls: {
    homepage: "https://translate.google.com",
    docs: "https://cloud.google.com/translate/docs",
    privacyPolicy: "https://policies.google.com/privacy",
    termsOfService: "https://policies.google.com/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

