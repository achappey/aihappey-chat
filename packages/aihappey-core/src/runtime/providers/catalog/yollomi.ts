import type { Provider } from "aihappey-types";

export const yollomi: Provider = {
  name: "Yollomi",
  description: "Create high-quality images and videos from text, images or videos with Yollomi, an all-in-one AI creation platform built for modern creators.",
  icons: [{
    src: "https://yollomi.com/logo.svg"
  }],
  urls: {
    homepage: "https://yollomi.com",
    docs: "https://yollomi.com/api-docs",
    pricing: "https://yollomi.com/en/pricing",
    privacyPolicy: "https://yollomi.com/en/privacy",
    termsOfService: "https://yollomi.com/en/terms"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

