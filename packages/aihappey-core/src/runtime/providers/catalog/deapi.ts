import type { Provider } from "aihappey-types";

export const deapi: Provider = {
  name: "DeAPI",
  description:
    "Generate images, synthesize voice, and transcribe audio or video with one unified API. Access leading open-source AI models at a fraction of the cost.",
  icons: [
    {
      src: "https://s3-eu-west-1.amazonaws.com/tpd/logos/692038db2a6043b23f4df897/0x0.png",
    },
  ],
  urls: {
    homepage: "https://deapi.ai",
    docs: "https://docs.deapi.ai",
    console: "https://deapi.ai/dashboard",
    termsOfService: "https://deapi.ai/terms-of-service",
    privacyPolicy: "https://deapi.ai/privacy-policy"
  },
  providerCountry: "MT",
  category: "media_voice",
  inferenceRegions: ["World"]
};

