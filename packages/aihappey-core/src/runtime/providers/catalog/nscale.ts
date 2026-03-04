import type { Provider } from "aihappey-types";

export const nscale: Provider = {
  name: "Nscale",
  description:
    "Nscale provides cost-effective, high-performance infrastructure for AI. Access thousands of GPUs tailored to your requirements using our AI cloud platform.",
  icons: [
    {
      src: "https://startuprise.co.uk/wp-content/uploads/2025/04/nscale_cloud_logo.jpg",
    },
  ],
  urls: {
    homepage: "https://www.nscale.com",
    docs: "https://docs.nscale.com",
    pricing: "https://www.nscale.com/product/serverless",
    privacyPolicy: "https://www.nscale.com/policies/privacy-policy",
    termsOfService: "https://www.nscale.com/policies/terms-conditions",
    console: "https://console.nscale.com"
  },
  providerCountry: "GB",
  inferenceRegions: ["World"]
};

