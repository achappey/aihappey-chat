import type { Provider } from "aihappey-types";

export const unrealspeech: Provider = {
  name: "UnrealSpeech",
  description: "Cut text-to-speech costs. 11x cheaper than 11Labs. Production-ready. Stream in 300ms. Generate 10-hr audio. 48 voices. 8 languages. Per-word timestamps.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D560BAQETnkv3rb41Bw/company-logo_200_200/company-logo_200_200/0/1663606553324?e=2147483647&v=beta&t=M6L9owNcAFghDwHNpzbt5cvl4buCJ824838zV-aLcos"
    }
  ],
  urls: {
    homepage: "https://unrealspeech.com",
    docs: "https://docs.v8.unrealspeech.com",
    console: "https://unrealspeech.com/dashboard",
    termsOfService: "https://unrealspeech.com/terms",
    privacyPolicy: "https://unrealspeech.com/privacy"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

