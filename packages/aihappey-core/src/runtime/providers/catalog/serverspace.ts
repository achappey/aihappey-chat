import type { Provider } from "aihappey-types";

export const serverspace: Provider = {
  name: "Serverspace",
  description: "European cloud IT infrastructure rental service: powerful hardware, 99,9% SLA, pay-as-you-go, data centers worldwide, 24/7 support.",
  icons: [{
    src: "https://serverspace.io/assets/favicon/favicon.ico"
  }],
  urls: {
    homepage: "https://serverspace.io",
    pricing: "https://serverspace.io/pricing",
    privacyPolicy: "https://serverspace.io/conditions/privacy-policy",
    termsOfService: "https://serverspace.io/conditions/terms-of-service"
  },
  providerCountry: "NL",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

