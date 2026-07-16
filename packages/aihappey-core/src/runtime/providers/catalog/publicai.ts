import type { Provider } from "aihappey-types";

export const publicai: Provider = {
  name: "PublicAI",
  description:
    "A nonprofit, open-source service to make public and sovereign AI models more accessible.",
  icons: [
    {
      src: "https://substackcdn.com/image/fetch/$s_!c8nI!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F741518ed-a7e5-4054-a0b5-c1faeceb2f09_551x551.png",
    },
  ],
  urls: {
    homepage: "https://publicai.co",
    docs: "https://platform.publicai.co/docs",
    pricing: "https://platform.publicai.co/billing",
    termsOfService: "https://publicai.co/tc"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

