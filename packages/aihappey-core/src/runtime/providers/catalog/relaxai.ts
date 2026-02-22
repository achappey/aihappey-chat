import type { Provider } from "aihappey-types";

export const relaxai: Provider = {
  name: "RelaxAI",
  description:
    "Get the benefits of AI without compromising on data privacy. relaxAI offers a secure, transparent, and compliant solution. Find out more and start using relaxAI today.",
  icons: [
    {
      src: "https://relax.ai/images/home/pricing/relaxai-logomark.svg",
    },
  ],
  urls: {
    homepage: "https://relax.ai",
    docs: "https://relax.ai/docs",
    console: "https://dashboard.relax.ai",
    privacyPolicy: "https://relax.ai/privacy-policy",
    termsOfService: "https://relax.ai/terms-of-service"
  },
  providerCountry: "GB",
  inferenceRegions: ["Europe"]

};

