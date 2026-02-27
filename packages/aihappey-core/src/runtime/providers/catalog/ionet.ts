import type { Provider } from "aihappey-types";

export const ionet: Provider = {
  name: "IOnet",
  description: "The Open Source AI Infrastructure Platform. Deploy your AI workloads today with instant access to 30,000+ GPUs and leading open source models at up to 70% lower cost than AWS.",
  icons: [
    {
      src: "https://io.net/images/share-card.png"
    }
  ],
  urls: {
    homepage: "https://io.net",
    console: "https://ai.io.net",
    docs: "https://io.net/docs",
    privacyPolicy: "https://io.net/privacy",
    termsOfService: "https://io.net/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

