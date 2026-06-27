import type { Provider } from "aihappey-types";

export const groq: Provider = {
  name: "Groq",
  description: "The Groq LPU delivers inference with the speed and cost developers need.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnze6t-thGVKlIKNKF9zeiTfaoxLdYdVzX0g&s",
    },
  ],
  urls: {
    homepage: "https://groq.com",
    docs: "https://console.groq.com/docs",
    privacyPolicy: "https://groq.com/privacy-policy",
    termsOfService: "https://groq.com/terms-of-use",
    console: "https://console.groq.com"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"],
  apiBaseUrl: "https://api.groq.com/openai",
  chatEndpoints: ["/v1/chat/completions", "/v1/responses"],
};

