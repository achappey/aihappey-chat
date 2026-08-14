import type { Provider } from "aihappey-types";

export const heygen: Provider = {
  name: "HeyGen",
  description: "Generate AI videos from your ideas using HeyGen. Input text, image, or audio to create complete videos with narration, captions, visuals, and animations.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZmrChHtfnAtTZb13JfQBUeFHHxZM6ARBhwA&s"
    }
  ],
  urls: {
    homepage: "https://www.heygen.com",
    docs: "https://developers.heygen.com",
    pricing: "https://www.heygen.com/pricing",
    console: "https://app.heygen.com",
    termsOfService: "https://www.heygen.com/terms",
    privacyPolicy: "https://www.heygen.com/privacy"
  },
  providerCountry: "US",
  category: "media_voice",
  inferenceRegions: ["World"]
};

