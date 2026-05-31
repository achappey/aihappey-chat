import type { Provider } from "aihappey-types";

export const byteplus: Provider = {
  name: "BytePlus",
  description:
    "Build, deploy, and scale AI with BytePlus — cutting-edge models, tools, and infrastructure proven on global platforms.",
  icons: [{
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJpF-GaGgjh9vGom4cCE4O3c83d7YSogg-uQ&s"
  }],
  urls: {
    homepage: "https://www.byteplus.com",
    docs: "https://docs.byteplus.com",
    pricing: "https://docs.byteplus.com/en/docs/ModelArk/1544106",
    privacyPolicy: "https://docs.byteplus.com/en/legal/docs/privacy-policy",
    termsOfService: "https://docs.byteplus.com/en/legal/docs/terms-of-service",
    console: "https://console.byteplus.com"
  },
  providerCountry: "CN",
  category: "model_provider",
  inferenceRegions: ["World"]

};

