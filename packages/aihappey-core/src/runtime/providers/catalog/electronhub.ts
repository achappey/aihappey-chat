import type { Provider } from "aihappey-types";

export const electronhub: Provider = {
  name: "ElectronHub",
  description:
    "Electron Hub provides unified access to the world's leading AI technologies in one seamless platform.",
  icons: [{
    src: "https://www.electronhub.ai/electron.png"
  }],
  urls: {
    homepage: "https://www.electronhub.ai",
    docs: "https://docs.electronhub.ai",
    pricing: "https://www.electronhub.ai/pricing",
    privacyPolicy: "https://privacy.electronhub.ai",
    termsOfService: "https://tos.electronhub.ai"
  },
  category: "gateway_router",
  inferenceRegions: ["World"]

};

