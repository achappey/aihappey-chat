import type { Provider } from "aihappey-types";

export const simplismart: Provider = {
  name: "Simplismart",
  description:
    "Fine-tune and deploy GenAI models with Simplismart's fastest inference engine. Integrate with AWS/Azure/GCP and many more cloud providers for simple, scalable, cost-effective deployment.",
  icons: [
    {
      src: "https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/d54ab4fa20db4b0f887938e7a118d979?ik-sanitizeSvg=true",
    },
  ],
  urls: {
    homepage: "https://simplismart.ai",
    docs: "https://docs.simplismart.ai",
    console: "https://app.simplismart.ai",
    privacyPolicy: "https://simplismart.ai/privacy-policy",
    termsOfService: "https://simplismart.ai/terms-of-service"
  },
  providerCountry: "IN",
  inferenceRegions: ["World"]
};

