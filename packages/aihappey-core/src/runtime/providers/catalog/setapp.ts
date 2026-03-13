import type { Provider } from "aihappey-types";

export const setapp: Provider = {
  name: "Setapp",
  description: "Setapp is a large collection of powerful Mac apps available by subscription.",
  icons: [{
    src: "https://setapp.com/_next/static/media/favicon.84fdedaf.png"
  }],
  urls: {
    homepage: "https://setapp.com",
    docs: "https://docs.setapp.com/docs/ai-gateway",
    privacyPolicy: "https://setapp.com/privacy-policy",
    termsOfService: "https://setapp.com/terms-of-use"
  },
  providerCountry: "CY",
  inferenceRegions: ["World"]

};

