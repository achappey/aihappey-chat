import type { Provider } from "aihappey-types";

export const zyloapi: Provider = {
  name: "ZyloAPI",
  description: "Access GPT-5.2, Gemini 3 Pro, Claude 4.6 Opus and more through one unified, ultra-fast API. Simple pricing, massive scale.",
  icons: [{
    src: "https://8upload.com/image/054d4df0a6b77374/logo.png"
  }],
  urls: {
    homepage: "https://zyloai.net",
    docs: "https://console.zyloai.net/docs",
    pricing: "https://zyloai.net/#pricing",
    privacyPolicy: "https://zyloai.net/#privacy",
    termsOfService: "https://zyloai.net/#terms"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

