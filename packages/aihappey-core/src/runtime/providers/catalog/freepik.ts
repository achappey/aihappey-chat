import type { Provider } from "aihappey-types";

export const freepik: Provider = {
  name: "Freepik",
  description:
    "The only creative suite you need—AI tools, smart features, and high-quality stock assets to design and create without ever leaving Freepik.",
  icons: [
    {
      src: "https://cdn.freebiesupply.com/logos/large/2x/freepik-logo-png-transparent.png",
    },
  ],
  urls: {
    homepage: "https://www.freepik.com",
    pricing: "https://www.freepik.com/api/pricing",
    docs: "https://www.freepik.com/api",
    privacyPolicy: "https://www.freepikcompany.com/privacy",
    termsOfService: "https://www.freepikcompany.com/legal"
  },
  providerCountry: "ES",
  inferenceRegions: ["World"]

};

