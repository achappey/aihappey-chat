import type { Provider } from "aihappey-types";

export const opengateway: Provider = {
  name: "OpenGateway",
  description: "AI Infrastructure Console",
  icons: [{
    src: "https://opengateway.ai/icon.svg?07de003a1a421a3a"
  }],
  urls: {
    homepage: "https://opengateway.ai",
    docs: "https://opengateway.ai/api-docs"
  },
  inferenceRegions: ["World"]

};

