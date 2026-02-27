import type { Provider } from "aihappey-types";

export const github: Provider = {
  name: "GitHub",
  description:
    "Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDfC1lHYN3oYb9YGTDCqnPeOaaw2Pqlr96CA&s",
    },
  ],
  urls: {
    homepage: "https://github.com",
    docs: "https://docs.github.com/en/rest/models",
    privacyPolicy: "https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement",
    termsOfService: "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

