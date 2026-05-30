import type { Provider } from "aihappey-types";

export const tencenthunyuan: Provider = {
  name: "TencentHunyuan",
  description:
    "Based on Tencent Hunyuan 3D Generate Large Model, it is the industry's first one-stop 3D content AI creation platform. It supports functions such as text-based 3D, image-based 3D, 3D animation generation, and texture generation.",
  icons: [
    {
      src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/hunyuan-color.png"
    }
  ],
  urls: {
    homepage: "https://hunyuan.tencent.com",
  },
  providerCountry: "CN",
  category: "gateway_router",
  inferenceRegions: ["World"]
};