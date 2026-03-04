import type { Provider } from "aihappey-types";

export const aiml: Provider = {
  name: "AIML",
  description: "Access over 400 AI models with low latency and high scalability AI APIs.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D560BAQFF5cVF9c_cOw/company-logo_200_200/company-logo_200_200/0/1709201452469/aimlapi_logo?e=2147483647&v=beta&t=l2fmaW9qdhOZ9wR3sukZpFYETyNGEA5jatU66ECxdFQ",
      theme: "dark",
    },
    {
      src: "https://cdn.prod.website-files.com/65b8f36fa600366bc7cf9a67/67600ef9b7e887578cc772f0_aimlapi_logo_square_vector.png",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://aimlapi.com",
    docs: "https://docs.aimlapi.com",
    pricing: "https://aimlapi.com/ai-ml-api-pricing",
    privacyPolicy: "https://help.aimlapi.com/article/56-privacy-policy",
    termsOfService: "https://help.aimlapi.com/article/55-terms-of-service"
  },
  providerCountry: "EE",
  inferenceRegions: ["World"]

};

