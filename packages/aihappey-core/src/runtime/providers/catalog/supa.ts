import type { Provider } from "aihappey-types";

export const supa: Provider = {
  name: "SUPA",
  description: "Host powerful LLMs on German Servers. 100% GDPR Compliant. Drop-in OpenAI replacement for Agencies.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYuRgMhcHBkM7NhX8H11NZsGc5CXNPoNVldw&s"
    }
  ],
  urls: {
    homepage: "https://supa.works",
    privacyPolicy: "https://supa.works/privacy",
    termsOfService: "https://supa.works/imprint"
  },
  providerCountry: "DE",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

