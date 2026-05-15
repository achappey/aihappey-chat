import type { Provider } from "aihappey-types";

export const agentphone: Provider = {
  name: "AgentPhone",
  description: "AgentPhone gives your AI its own phone number. Handle voice and messages through one unified webhook.",
  icons: [{
    src: "https://agentphone.ai/favicon.png?v=3"
  }],
  urls: {
    homepage: "https://agentphone.ai",
    docs: "https://docs.agentphone.ai/",
    pricing: "https://agentphone.ai/pricing",
    privacyPolicy: "https://agentphone.ai/privacy",
    termsOfService: "https://agentphone.ai/terms"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

