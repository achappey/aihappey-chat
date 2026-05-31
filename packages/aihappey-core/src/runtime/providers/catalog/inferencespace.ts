import type { Provider } from "aihappey-types";

export const inferencespace: Provider = {
  name: "InferenceSpace",
  description: "Ultra-fast, cost-effective AI inference powered by TensorFusion.",
  icons: [
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      theme: "dark",
    },
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://inf.space",
    docs: "https://inf.space/docs",
    pricing: "https://inf.space/pricing",
    privacyPolicy: "https://inf.space/privacy",
    termsOfService: "https://inf.space/terms"
  },
  providerCountry: "SG",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

