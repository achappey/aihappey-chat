import type { Provider } from "aihappey-types";

export const pinecone: Provider = {
  name: "Pinecone",
  description: "Search through billions of items for similar matches to any object, in milliseconds. It’s the next generation of search, an API call away.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpSbtuc0QVk1KuqDSweEzC0NcGnTYWHDJtKA&s"
    }
  ],
  urls: {
    homepage: "https://www.pinecone.io",
    docs: "https://docs.pinecone.io",
    console: "https://app.pinecone.io",
    privacyPolicy: "https://www.pinecone.io/privacy",
    termsOfService: "https://www.pinecone.io/legal"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]

};

