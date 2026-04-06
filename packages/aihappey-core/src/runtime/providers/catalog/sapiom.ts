import type { Provider } from "aihappey-types";

export const sapiom: Provider = {
  name: "Sapiom",
  description: "Intelligence is here. Access is not. The execution engine that converts your agent's intent into outcomes.",
  icons: [{
    src: "https://www.sapiom.ai/favicon.png"
  }],
  urls: {
    homepage: "https://www.sapiom.ai",
    docs: "https://docs.sapiom.ai",
    privacyPolicy: "https://docs.sapiom.ai/privacy-policy",
    termsOfService: "https://docs.sapiom.ai/terms-of-use"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

