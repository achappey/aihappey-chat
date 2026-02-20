import type { Provider } from "aihappey-types";

export const digitalocean: Provider = {
  name: "DigitalOcean",
  description: "Build on DigitalOcean's unified agentic AI cloud infrastructure. AI-powered development, instant deployment, easy management. Simple and affordable.",
  icons: [
    {
      src: "https://icon-icons.com/download-file?file=https%3A%2F%2Fimages.icon-icons.com%2F2699%2FPNG%2F512%2Fdigitalocean_logo_icon_169273.png&id=169273&pack_or_individual=pack"
    }
  ],
  urls: {
    homepage: "https://www.digitalocean.com",
    docs: "https://docs.digitalocean.com",
    console: "https://cloud.digitalocean.com"
  },
  providerCountry: "US",
  inferenceRegions: ["World"]
};

