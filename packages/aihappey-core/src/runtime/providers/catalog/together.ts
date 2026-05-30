import type { Provider } from "aihappey-types";

export const together: Provider = {
  name: "Together",
  description:
    "Reliably build, deploy, and scale AI native apps — benefit from cutting-edge research, complete developer experience, and unmatched price-performance.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D560BAQHe__yU45OuCQ/company-logo_200_200/B56Zy0qe7rIcAI-/0/1772557561927/togethercomputer_logo?e=2147483647&v=beta&t=fDi1CeF0dyF1w0_wZXhr-DkRGjgNFj0YXMFals7KN18"
    }
  ],
  urls: {
    homepage: "https://www.together.ai",
    docs: "https://docs.together.ai",
    pricing: "https://www.together.ai/pricing",
    privacyPolicy: "https://www.together.ai/privacy",
    termsOfService: "https://www.together.ai/terms-of-service",
    console: "https://api.together.ai"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]
};