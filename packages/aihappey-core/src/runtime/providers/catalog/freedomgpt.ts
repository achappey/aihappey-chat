import type { Provider } from "aihappey-types";

export const freedomgpt: Provider = {
  name: "FreedomGPT",
  description: "FreedomGPT is an uncensored AI app store providing access to the latest AIs. It is private, safe, secure and available on the browser and as native app on all major platforms.",
  icons: [{
    src: "https://mintcdn.com/freedomgpt/D4TIAfSjvcCKBtov/logo/icon.svg?w=2500&fit=max&auto=format&n=D4TIAfSjvcCKBtov&q=85&s=b4b918521d3a3291f1c48f1ab6ddc117"
  }],
  urls: {
    homepage: "https://www.freedomgpt.com",
    docs: "https://docs.freedomgpt.com",
    privacyPolicy: "https://www.freedomgpt.com/privacy-policy",
    termsOfService: "https://www.freedomgpt.com/terms-of-service"
  },
  experimental: true,
  inferenceRegions: ["World"]

};

