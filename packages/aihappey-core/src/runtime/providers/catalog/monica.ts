import type { Provider } from "aihappey-types";

export const monica: Provider = {
  name: "Monica",
  description: "Access advanced Al models and exclusive APIs in one unified platform.",
  icons: [
    {
      src: "https://assets.monica.im/openapi-web/_next/static/media/monicaLogo.83e0ae18.png"
    }
  ],
  urls: {
    homepage: "https://platform.monica.im",
    console: "https://platform.monica.im/dashboard",
    pricing: "https://platform.monica.im/docs/en/models-and-pricing",
    docs: "https://platform.monica.im/docs",
    privacyPolicy: "https://monica.im/privacy",
    termsOfService: "https://monica.im/terms"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

