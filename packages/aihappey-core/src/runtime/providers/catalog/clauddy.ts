import type { Provider } from "aihappey-types";

export const clauddy: Provider = {
  name: "Clauddy",
  description: "统一的 AI 模型聚合与分发网关，支持将各类大语言模型跨格式转换为 OpenAI、Claude、Gemini 兼容接口，为个人与企业提供集中式模型管理与网关服务。",
  icons: [{
    src: "https://clauddy.com/favicon.ico"
  }],
  urls: {
    homepage: "https://clauddy.com",
    docs: "https://docs.clauddy.com",
    pricing: "https://clauddy.com/pricing",
    privacyPolicy: "https://docs.clauddy.com/en/terms/privacy-policy.html",
    termsOfService: "https://docs.clauddy.com/en/terms/user-agreement.html"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

