import type { Provider } from "aihappey-types";

export const widnai: Provider = {
  name: "WidnAI",
  description: "Built on TowerLLM - the award-winning GenAI model created by the team at Unbabel. Enterprise-ready, trusted by prosumers and global teams.",
  icons: [{
    src: "https://media.licdn.com/dms/image/v2/D4E0BAQG5XHQsbluo8A/company-logo_200_200/company-logo_200_200/0/1730978102811/widn_ai_logo?e=2147483647&v=beta&t=5q8f8yOrx6Co7UEAQiIDJN0qbKwZ-GpvR67ZtpucL9o"
  }],
  urls: {
    homepage: "https://www.widn.ai",
    docs: "https://www.widn.ai/api-docs",
    privacyPolicy: "https://www.widn.ai/nl/privacy",
    termsOfService: "https://www.widn.ai/nl/terms-and-conditions"
  },
  providerCountry: "PT",
  inferenceRegions: ["World"]

};

