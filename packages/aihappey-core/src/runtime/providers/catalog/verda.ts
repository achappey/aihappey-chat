import type { Provider } from "aihappey-types";

export const verda: Provider = {
  name: "Verda",
  description: "Discover Verda – European ISO-certified cloud provider offering on-demand GPU clusters, AI model hosting, and autoscaling containers with 100% renewable energy. Optimize your AI projects with our low-cost deployment solutions.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLDvVEuW0laXWa1GuUxB6U9Of-yhQiXJ3bLw&s"
    }
  ],
  urls: {
    homepage: "https://verda.com",
    docs: "https://docs.verda.com",
    pricing: "https://verda.com/managed-endpoints",
    privacyPolicy: "https://verda.com/privacy-policy",
    termsOfService: "https://verda.com/terms-and-conditions",
    console: "https://console.verda.com"
  },
  providerCountry: "FI",
  inferenceRegions: ["Europe"]

};

