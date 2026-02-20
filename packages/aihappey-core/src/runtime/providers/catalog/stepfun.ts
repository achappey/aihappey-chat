import type { Provider } from "aihappey-types";

export const stepfun: Provider = {
  name: "StepFun",
  description:
    "StepFun AI is your smart and reliable personal assistant, here to help you acquire knowledge, find information, learn languages, unleash creativity in writing, and even write code. Whether you’re working, studying, or just navigating everyday life, it’s designed to solve your problems and help you discover and understand the world around you.",
  icons: [
    {
      src: "https://pbs.twimg.com/profile_images/1888792150437203968/6U_6SM6S.jpg"
    }
  ],
  urls: {
    homepage: "https://stepfun.ai",
    docs: "https://platform.stepfun.ai/docs/en/overview/concept",
    console: "https://platform.stepfun.ai"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]
};