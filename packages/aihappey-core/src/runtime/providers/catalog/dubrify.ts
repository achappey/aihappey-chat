import type { Provider } from "aihappey-types";

export const dubrify: Provider = {
  name: "Dubrify",
  description: "Dubrify 是一站式 AI API 聚合管理平台，支持 OpenAI、Claude、Gemini 等多种 AI 服务商，提供统一 API 接口，简化 AI 应用开发流程，降低接入成本。",
  icons: [{
    src: "https://dubrify.com/favicon-32x32.png"
  }],
  urls: {
    homepage: "https://dubrify.com",
    docs: "https://doc.dubrify.com",
    privacyPolicy: "https://dubrify.com/privacy-policy",
    termsOfService: "https://dubrify.com/user-agreement"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

