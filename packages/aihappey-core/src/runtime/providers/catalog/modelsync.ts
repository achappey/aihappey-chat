import type { Provider } from "aihappey-types";

export const modelsync: Provider = {
  name: "ModelSync",
  description: "Easily use open-source AI models, in the cloud, with our user-friendly API",
  icons: [{
    src: "https://modelsync.ai/favicon.ico"
  }],
  urls: {
    homepage: "https://modelsync.ai",
    docs: "https://modelsync.ai/docs",
    pricing: "https://modelsync.ai/#pricing",
    privacyPolicy: "https://modelsync.ai/privacy",
    termsOfService: "https://modelsync.ai/terms"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

