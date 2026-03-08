import type { Provider } from "aihappey-types";

export const klingai: Provider = {
  name: "KlingAI",
  description:
    "Kling AI, tools for creating imaginative images and videos, based on state-of-art generative AI methods.",
  icons: [
    {
      src: "https://cdn.prod.website-files.com/65b8f370a600366bc7cf9b20/6718d0e02f90eca5abe33eed_ddd.png",
    },
  ],
  urls: {
    homepage: "https://klingai.com",
    pricing: "https://klingai.com/global/dev/pricing",
    privacyPolicy: "https://klingai.com/privacy",
    termsOfService: "https://klingai.com/terms"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

