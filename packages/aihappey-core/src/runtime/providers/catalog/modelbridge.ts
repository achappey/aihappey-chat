import type { Provider } from "aihappey-types";

export const modelbridge: Provider = {
  name: "ModelBridge",
  description: "统一的 AI 模型聚合与分发网关，支持将各类大语言模型跨格式转换为 OpenAI、Claude、Gemini 兼容接口，为个人与企业提供集中式模型管理与网关服务。",
  icons: [{
    src: "https://openclaw-api.net/logo.png"
  }],
  urls: {
    homepage: "https://openclaw-api.net"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

