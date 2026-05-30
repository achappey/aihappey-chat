import type { Provider } from "aihappey-types";

export const llmcloud: Provider = {
  name: "LLMCloud",
  description: "Nền tảng cung cấp API Claude Code, Google Gemini và nhiều model LLM khác nhau với giá cả hợp lý. Tích hợp dễ dàng, hỗ trợ 24/7.",
  icons: [{
    src: "https://llmcloud.studio/logo.png"
  }],
  urls: {
    homepage: "https://llmcloud.studio",
    docs: "https://docs.llmcloud.studio",
    pricing: "https://llmcloud.studio/#pricing",
    privacyPolicy: "https://llmcloud.studio/privacy",
    termsOfService: "https://llmcloud.studio/terms"
  },
  providerCountry:"VN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

