import type { Provider } from "aihappey-types";

export const laozhang: Provider = {
  name: "LaoZhang",
  description: "Standard OpenAI/Gemini/Claude models API integration for enterprise system integration, business automation and internal tool development. High availability, pay-as-you-go, long-term stable service.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5SOrju0MYo7sEJuk8uZE4q35gwHfO10GcSw&s"
    }
  ],
  urls: {
    homepage: "https://laozhang.ai",
    docs: "https://docs.laozhang.ai",
    pricing: "https://lp.laozhang.ai/#pricing",
    privacyPolicy: "https://lp.laozhang.ai/privacyPolicy.html",
    termsOfService: "https://lp.laozhang.ai/serviceAgreement.html"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

