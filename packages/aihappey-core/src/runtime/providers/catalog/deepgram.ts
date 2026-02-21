import type { Provider } from "aihappey-types";

export const deepgram: Provider = {
  name: "Deepgram",
  description:
    "Power enterprise voice solutions with Deepgram’s Speech-to-Text, Text-to-Speech, and Voice Agent APIs. Real-time, accurate, and built for scale.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/17422641?s=280&v=4"
  }],
  urls: {
    homepage: "https://deepgram.com",
    docs: "https://developers.deepgram.com",
    privacyPolicy: "https://deepgram.com/privacy",
    termsOfService: "https://deepgram.com/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

