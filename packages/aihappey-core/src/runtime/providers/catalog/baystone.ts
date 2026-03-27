import type { Provider } from "aihappey-types";

export const baystone: Provider = {
  name: "BayStone",
  description: "DeepSeek API 不限量 即开即用 从32B到671B，DeepSeek全家桶，热血上线",
  icons: [{
    src: "https://www.baystoneai.com/images/baystone-logo.png"
  }],
  urls: {
    homepage: "https://www.baystoneai.com",
    docs: "https://dsdocs.baystoneai.com/docs",
    termsOfService: "https://www.baystoneai.com/legal"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

