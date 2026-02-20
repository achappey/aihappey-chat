import type { Provider } from "aihappey-types";

export const amazonbedrock: Provider = {
  name: "AmazonBedrock",
  description: "The platform for building generative AI applications and agents at production scale.",
  icons: [{
    src: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/bedrock-color.png"
  }],
  url: "https://aws.amazon.com/bedrock",
  providerCountry: "US",
  inferenceRegions: ["Europe", "Americas", "Asia", "Africa", "Oceania"]

};

