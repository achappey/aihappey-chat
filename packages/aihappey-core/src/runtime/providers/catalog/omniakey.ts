import type { Provider } from "aihappey-types";

export const omniakey: Provider = {
  name: "OmniaKey",
  description: "OpenAI 接口聚合管理，支持多种渠道包括 Azure，可用于二次分发管理 key，仅单可执行文件，已打包好 Docker 镜像，一键部署，开箱即用",
  icons: [{
    src: "https://omniakey.com/logo.png"
  }],
  urls: {
    homepage: "https://omniakey.com",
    docs: "https://docs.omniakey.com",
    privacyPolicy: "https://omniakey.com/privacy",
    termsOfService: "https://omniakey.com/terms"
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

