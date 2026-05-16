import type { Provider } from "aihappey-types";

export const stepfun: Provider = {
  name: "StepFun",
  description:
    "StepFun AI is your smart and reliable personal assistant, here to help you acquire knowledge, find information, learn languages, unleash creativity in writing, and even write code. Whether you’re working, studying, or just navigating everyday life, it’s designed to solve your problems and help you discover and understand the world around you.",
  icons: [
    {
      src: "https://avatars.githubusercontent.com/u/178004800?s=200&v=4"
    }
  ],
  urls: {
    homepage: "https://platform.stepfun.ai",
    pricing: "https://platform.stepfun.ai/docs/pricing/details",
    docs: "https://platform.stepfun.ai/docs/en/overview/concept",
    privacyPolicy: "https://platform.stepfun.com/legal/privacy-policy.html"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]
};