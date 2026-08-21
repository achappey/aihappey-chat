import type { Provider } from "aihappey-types";

export const horayai: Provider = {
  name: "HorayAI",
  description: "Horay.ai is a cutting-edge cloud service platform that primarily offers API calls for open-source large models. Our platform offers a diverse array of models, ensures fast updates, and provides services at competitive prices, enabling developers to easily integrate advanced natural language processing, image generation, and multimodal capabilities into their applications. By leveraging Horay.ai's infrastructure, developers can focus on innovation rather than the complexities of model deployment and management.",
  icons: [{ src: "https://www.horay.ai/favicon.ico" }],
  urls: {
    homepage: "https://www.horay.ai",
    docs: "https://www.horay.ai/docs",
    pricing: "https://www.horay.ai/pricing",
    privacyPolicy: "https://www.horay.ai/privacy-policy",
    termsOfService: "https://www.horay.ai/terms-of-service"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

