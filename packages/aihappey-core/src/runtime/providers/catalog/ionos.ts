import type { Provider } from "aihappey-types";

export const ionos: Provider = {
  name: "IONOS",
  description:
    "IONOS Cloud supports businesses of all sizes with their digitalization.",
  icons: [
    {
      src: "https://avatars.githubusercontent.com/u/67323449?s=200&v=4",
    },
  ],
  urls: {
    homepage: "https://cloud.ionos.com",
    docs: "https://docs.ionos.com/cloud",
    privacyPolicy: "https://www.ionos.com/terms-gtc/privacy-policy",
    termsOfService: "https://www.ionos.com/terms-gtc"
  },
  providerCountry: "DE",
  category: "inference_compute",
  inferenceRegions: ["Europe"]

};

