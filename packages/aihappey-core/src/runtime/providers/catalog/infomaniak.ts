import type { Provider } from "aihappey-types";

export const infomaniak: Provider = {
  name: "Infomaniak",
  description:
    "Control your data governance with an independent cloud. Solutions hosted in the heart of Europe, designed to protect your confidentiality.",
  icons: [
    {
      src: "https://i0.wp.com/news.infomaniak.com/wp-content/uploads/2015/05/avatar-infomaniak.jpg?fit=500%2C500&ssl=1",
    },
  ],
  urls: {
    homepage: "https://www.infomaniak.com",
    docs: "https://developer.infomaniak.com",
    pricing: "https://www.infomaniak.com/en/hosting/ai-services/prices",
    console: "https://manager.infomaniak.com",
    termsOfService: "https://www.infomaniak.com/en/legal/general-terms-and-conditions",
    privacyPolicy: "https://www.infomaniak.com/en/legal/confidentiality-policy"
  },
  providerCountry: "CH",
  category: "inference_compute",
  inferenceRegions: ["Europe"]
};

