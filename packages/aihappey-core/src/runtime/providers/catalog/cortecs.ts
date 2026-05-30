import type { Provider } from "aihappey-types";

export const cortecs: Provider = {
  name: "Cortecs",
  description: "Cortecs is Europe's LLM router for cost, speed, and compliance. Dynamically route AI workloads to the best models, all hosted within the EU, ensuring full GDPR compliance.",
  icons: [
    {
      src: "https://media2.dev.to/dynamic/image/width=320,height=320,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Forganization%2Fprofile_image%2F10180%2F1e7ba1da-bc26-4910-95a9-2d5a30e47b55.png"
    }
  ],
  urls: {
    homepage: "https://cortecs.ai",
    docs: "https://docs.cortecs.ai",
    privacyPolicy: "https://cortecs.ai/privacyPolicy",
    termsOfService: "https://cortecs.ai/termsOfUse"
  },
  providerCountry: "DE",
  category: "gateway_router",
  inferenceRegions: ["Europe"]

};

