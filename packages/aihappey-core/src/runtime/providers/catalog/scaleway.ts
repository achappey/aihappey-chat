import type { Provider } from "aihappey-types";

export const scaleway: Provider = {
  name: "Scaleway",
  description:
    "Build, train, deploy and scale AI models and intelligent applications on a resilient and sustainable cloud ecosystem.",
  icons: [{
    src: "https://www-uploads.scaleway.com/Scaleway_3_D_Logo_57e7fb833f.png"
  }],
  urls: {
    homepage: "https://www.scaleway.com",
    docs: "https://www.scaleway.com/en/docs",
    privacyPolicy: "https://www.scaleway.com/en/privacy-policy",
    termsOfService: "https://www.scaleway.com/en/legal-notice",
    console: "https://console.scaleway.com"
  },
  providerCountry: "FR",
  inferenceRegions: ["Europe"]

};

