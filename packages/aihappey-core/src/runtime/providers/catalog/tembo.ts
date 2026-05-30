import type { Provider } from "aihappey-types";

export const tembo: Provider = {
  name: "Tembo",
  description: "The platform for every coding agent. Orchestrate Claude Code, Cursor, Codex and any agent across your repos, tools, and teams. Run in our cloud or self-host in your own VPC.",
  icons: [{
    src: "https://www.tembo.io/favicon.ico"
  }],
  urls: {
    homepage: "https://www.tembo.io",
    docs: "https://docs.tembo.io",
    pricing: "https://www.tembo.io/pricing",
    privacyPolicy: "https://www.tembo.io/privacy",
    termsOfService: "https://www.tembo.io/terms"
  },
  providerCountry: "US",
  category: "app_tools",
  inferenceRegions: ["World"]

};

