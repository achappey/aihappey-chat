import type { Provider } from "aihappey-types";

export const async: Provider = {
  name: "Async",
  description:
    "Low-latency text-to-speech API built for next-gen voice apps and agents. 24/7 SLA, 15 languages, integrations: Pipecat, n8n, LiveKit. From $0.50/hour.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D4E0BAQH8IAPHkrLBIA/company-logo_200_200/company-logo_200_200/0/1738686836840/async_ai_logo?e=2147483647&v=beta&t=xzU-nIDFl9Fvyye-7Ki46HPuZyq1ZKxbnFjexRjFbK4",
    },
  ],
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"],
  urls: {
    homepage: "https://www.async.com",
    termsOfService: "https://async.com/terms",
    privacyPolicy: "https://async.com/privacy",
    docs: "https://docs.async.com",
    pricing: "https://async.com/async-voice-api/pricing",
    console: "https://async.com/developer"
  },
};

