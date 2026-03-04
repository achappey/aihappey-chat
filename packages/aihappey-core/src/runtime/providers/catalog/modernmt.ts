import type { Provider } from "aihappey-types";

export const modernmt: Provider = {
  name: "ModernMT",
  description: "The world's leading enterprise translation AI. It improves from corrections and adapts to the context of the document. Like a human.",
  icons: [
    {
      src: "https://rws-prod-appstore-resources-eu-central-1.s3.amazonaws.com/ada56836-b958-4588-aab3-567b2ad727d0/Resources/ModernMT.png?dl=1"
    }
  ],
  urls: {
    homepage: "https://www.modernmt.com",
    docs: "https://www.modernmt.com/api",
    pricing: "https://www.modernmt.com/pricing",
    privacyPolicy: "https://www.modernmt.com/privacy",
    termsOfService: "https://www.modernmt.com/terms"
  },
  providerCountry: "IT",
  inferenceRegions: ["World"]

};

