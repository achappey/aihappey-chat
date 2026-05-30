import type { Provider } from "aihappey-types";

export const astica: Provider = {
  name: "Astica",
  description: "Cognitive Intelligence API: See, Speak, and Hear with astica.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTSxd9KGqn33rj8VDcizegh6D5cW346_x0Ng&s"
    }
  ],
  urls: {
    homepage: "https://astica.ai",
    termsOfService: "https://astica.ai/permitted-use",
    privacyPolicy: "https://astica.ai/privacy"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]
};

