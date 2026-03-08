import type { Provider } from "aihappey-types";

export const verbatik: Provider = {
  name: "Verbatik",
  description: "Create unlimited AI voiceovers and clone any voice in 37+ languages with Verbatik. 1600+ natural voices, sound effects, music, and video generation.",
  icons: [
    {
      src: "https://docs.verbatik.com/images/logo.png"
    }
  ],
  urls: {
    homepage: "https://verbatik.com",
    docs: "https://docs.verbatik.com",
    pricing: "https://verbatik.com/pricing",
    console: "https://api.verbatik.com",
    termsOfService: "https://verbatik.com/terms",
    privacyPolicy: "https://verbatik.com/privacy"
  },
  providerCountry: "GB",
  inferenceRegions: ["World"]
};

