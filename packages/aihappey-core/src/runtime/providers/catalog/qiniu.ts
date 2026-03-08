import type { Provider } from "aihappey-types";

export const qiniu: Provider = {
  name: "Qiniu",
  description: "2011 年成立以来，七牛云致力于成为全球领先的一站式中立音视频云 + AI 服务商，围绕数字化浪潮下的在线音视频需求，基于强大的云边一体化能力和低代码能力，持续在视频点播、互动直播、实时音视频、摄像头上云等领域，进行深度技术投入，提供面向业务场景的视频云解决方案。截至目前，有超过 100 万企业客户和开发者长期使用七牛云服务，包括 OPPO 、爱奇艺、平安银行、招商银行、上汽集团、芒果 TV 等知名企业。",
  icons: [{
    src: "https://avatars.githubusercontent.com/u/1563636?s=280&v=4"
  }],
  urls: {
    homepage: "https://www.qiniu.com",
    docs: "https://developer.qiniu.com",
    pricing: "https://www.qiniu.com/ai/models",
    privacyPolicy: "https://www.qiniu.com/agreements/privacy-right",
    termsOfService: "https://www.qiniu.com/user-agreement"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

