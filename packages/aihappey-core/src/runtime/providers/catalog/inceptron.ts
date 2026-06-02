import type { Provider } from "aihappey-types";

export const inceptron: Provider = {
  name: "Inceptron",
  description: "Run and optimize LLMs on Inceptron’s compiler-accelerated platform. Launch serverless endpoints, use batched inference for throughput, and tap elastic GPUs across clouds. Bring your own model or our library. ISO 27001 certified and GDPR compliant.",
  icons: [{
    src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.inceptron.io&size=128"
  }],
  urls: {
    homepage: "https://www.inceptron.io",
    docs: "https://docs.inceptron.io",
    pricing: "https://www.inceptron.io/pricing",
    privacyPolicy: "https://www.inceptron.io/privacy",
    termsOfService: "https://www.inceptron.io/termsofservice"
  },
  providerCountry: "SE",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

