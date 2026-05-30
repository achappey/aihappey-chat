import type { Provider } from "aihappey-types";

export const neuralwatt: Provider = {
  name: "Neuralwatt",
  description: "Neuralwatt Cloud is the first AI inference service with energy-based pricing. Run inference with real visibility into power, cost, and efficiency. Use as a hosted service or deploy on your own infrastructure with Neuralwatt Deploy.",
  icons: [{
    src: "https://portal.neuralwatt.com/static/images/og-default.png"
  }],
  urls: {
    homepage: "https://portal.neuralwatt.com",
    docs: "https://portal.neuralwatt.com/docs",
    pricing: "https://portal.neuralwatt.com/pricing",
    privacyPolicy: "https://portal.neuralwatt.com/privacy",
    termsOfService: "https://portal.neuralwatt.com/terms"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

