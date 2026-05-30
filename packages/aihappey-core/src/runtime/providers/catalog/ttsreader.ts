import type { Provider } from "aihappey-types";

export const ttsreader: Provider = {
  name: "TTSReader",
  description: "Online Text To Speech Reader. Accurate with natural voices, multilingual. Listen online, download speech & publish. Unlimited characters.",
  icons: [
    {
      src: "https://ttsreader.com/android-chrome-512x512.png"
    }
  ],
  urls: {
    homepage: "https://ttsreader.com",
    privacyPolicy: "https://ttsreader.com/docs/legal/privacy",
    termsOfService: "https://ttsreader.com/docs/legal/terms"
  },
  providerCountry: "IL",
  category: "media_voice",
  inferenceRegions: ["World"]

};

