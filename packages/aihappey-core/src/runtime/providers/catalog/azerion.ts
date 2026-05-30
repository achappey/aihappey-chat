import type { Provider } from "aihappey-types";

export const azerion: Provider = {
  name: "Azerion",
  description: "Deploy AI models with Azerion's serverless endpoints. Pay-per-use simplicity and automatic scaling for your applications.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D4D0BAQEvh-Otsqg93Q/company-logo_200_200/B4DZcQ_7UuGkAI-/0/1748336883414/azerion_logo?e=2147483647&v=beta&t=9_SBcLqsilOCTUFwFnWonWnglLgyhJnnLzkh6AIZBK4"
    }
  ],
  urls: {
    homepage: "https://www.azerion.com",
    docs: "https://docs.azerion.ai",
    termsOfService: "https://docs.azerion.ai/terms-and-policies/terms",
    privacyPolicy: "https://docs.azerion.ai/terms-and-policies/privacy",
    console: "https://app.azerion.ai"
  },
  providerCountry: "NL",
  category: "inference_compute",
  inferenceRegions: ["World"]
};

