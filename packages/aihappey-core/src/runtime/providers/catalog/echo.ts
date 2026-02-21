import type { Provider } from "aihappey-types";

export const echo: Provider = {
  name: "Echo",
  experimental: true,
  description: "The server sends back an identical copy of the data it received.",
  icons: [
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
      theme: "dark",
    },
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
      theme: "light",
    },
  ],
  urls: {
    homepage: "https://en.wikipedia.org/wiki/Echo_Protocol"
  },
};

