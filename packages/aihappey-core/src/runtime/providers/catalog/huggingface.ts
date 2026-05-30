import type { Provider } from "aihappey-types";

export const huggingface: Provider = {
  name: "HuggingFace",
  description: "We’re on a journey to advance and democratize artificial intelligence through open source and open science.",
  icons: [{
    src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/huggingface-color.png"
  }],
  urls: {
    homepage: "https://huggingface.co",
    docs: "https://huggingface.co/docs",
    privacyPolicy: "https://huggingface.co/privacy",
    termsOfService: "https://huggingface.co/terms-of-service"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

