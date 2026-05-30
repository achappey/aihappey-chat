import type { Provider } from "aihappey-types";

export const speechify: Provider = {
  name: "Speechify",
  description: "Speechify reads anything aloud to you. Listen to books, PDFs, or web pages anytime with natural voices.",
  icons: [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Speechify-logo.svg/250px-Speechify-logo.svg.png"
    }
  ],
  urls: {
    homepage: "https://speechify.com",
    console: "https://console.speechify.ai",
    privacyPolicy: "https://speechify.com/privacy",
    termsOfService: "https://speechify.com/terms"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

