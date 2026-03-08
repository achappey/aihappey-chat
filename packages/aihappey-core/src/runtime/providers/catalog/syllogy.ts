import type { Provider } from "aihappey-types";

export const syllogy: Provider = {
  name: "Syllogy",
  description:
    "Large Language Model API and chat service.",
  icons: [
    {
      src: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://syllogy.ai&size=128"
    }
  ],
  urls: {
    homepage: "https://syllogy.ai",
    docs: "https://syllogy.ai/docs"
  },
  experimental: true,
  providerCountry: "US",
  inferenceRegions: ["World"]

};

