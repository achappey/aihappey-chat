import type { Provider } from "aihappey-types";

export const asione: Provider = {
  name: "ASIOne",
  description:
    "ASI:One is a customizable personal AI designed to learn, socialize, and take action with everyday tasks. Users can personalize their AI through direct interaction, shaping its behavior and capabilities over time. Once configured, AIs can connect with others, enabling social interactions, shared planning, and collaborative experiences like coordinating events or group activities.",
  icons: [
    {
      src: "https://storage.googleapis.com/aiagents_1/agent-logos/asi-one-logo.png",
    },
  ],
  urls: {
    homepage: "https://asi1.ai",
    docs: "https://docs.asi1.ai",
    termsOfService: "https://asi1.ai/legal/terms",
    privacyPolicy: "https://asi1.ai/legal/privacy"
  },
  providerCountry: "GB",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

