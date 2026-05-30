import type { Provider } from "aihappey-types";

export const jigsawstack: Provider = {
  name: "JigsawStack",
  description: "Custom small models trained for specialized use cases powered by scalable infrastructure",
  icons: [{
    src: "https://jigsawstack.com/jigsaw_app_icon.svg"
  }],
  urls: {
    homepage: "https://jigsawstack.com",
    docs: "https://jigsawstack.com/docs",
    pricing: "https://jigsawstack.com/pricing",
    privacyPolicy: "https://jigsawstack.com/legal/privacy",
    termsOfService: "https://jigsawstack.com/legal/terms"
  },
  providerCountry: "SG",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

