import type { Provider } from "aihappey-types";

export const shuttleai: Provider = {
  name: "ShuttleAI",
  description: "ShuttleAI provides a simple, scalable, and cost-effective solution for integrating AI models into your applications.",
  icons: [{
    src: "https://shuttleai.com/_next/image?url=%2Frocket.png&w=3840&q=75"
  }],
  urls: {
    homepage: "https://shuttleai.com",
    docs: "https://docs.shuttleai.com",
    pricing: "https://shuttleai.com/pricing",
    privacyPolicy: "https://shuttleai.com/privacy-policy",
    termsOfService: "https://shuttleai.com/terms-of-service"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

