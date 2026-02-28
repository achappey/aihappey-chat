import type { Provider } from "aihappey-types";

export const longcat: Provider = {
  name: "LongCat",
  description: "LongCat is an open-source AI model family from Chinese tech giant Meituan.",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/229435942?s=200&v=4"
  }],
  urls: {
    homepage: "https://longcat.chat",
    docs: "https://longcat.chat/platform/docs",
    console: "https://longcat.chat/platform",
    privacyPolicy: "https://longcat.chat/platform/private/POLICY.html",
    termsOfService: "https://longcat.chat/platform/private"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

