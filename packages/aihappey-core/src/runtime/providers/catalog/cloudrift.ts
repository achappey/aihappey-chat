import type { Provider } from "aihappey-types";

export const cloudrift: Provider = {
  name: "CloudRift",
  description:
    "Rent powerful GPUs like RTX 4090, RTX 5090, and RTX Pro 6000 for AI and ML. Fast, affordable hourly compute across cloud, on-prem, and edge infrastructure.",
  icons: [{
    src: "https://pbs.twimg.com/profile_images/1956487392204111872/IJ0Xu1b3_400x400.jpg"
  }],
  urls: {
    homepage: "https://www.cloudrift.ai",
    docs: "https://docs.cloudrift.ai",
    privacyPolicy: "https://www.cloudrift.ai/privacy",
    termsOfService: "https://www.cloudrift.ai/terms"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

