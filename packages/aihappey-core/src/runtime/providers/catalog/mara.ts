import type { Provider } from "aihappey-types";

export const mara: Provider = {
  name: "MARA",
  description: "Discover how MARA deploys digital energy technologies to advance the world's energy systems.",
  icons: [{
    src: "https://media.licdn.com/dms/image/v2/D4E0BAQHozkwYKPFMoA/company-logo_200_200/company-logo_200_200/0/1720738348079/marathon_digital_holdings_logo?e=2147483647&v=beta&t=-YaFT7YvwhbN6_h2PtV-foWFHtwY09tGMaqXZ9P_U9w"
  }],
  urls: {
    homepage: "https://www.mara.com/",
    docs: "https://mara-cloud-docs-qa.vercel.app",
    console: "https://cloud.mara.com/dashboard",
    pricing: "https://cloud.mara.com/plans/pricing",
    privacyPolicy: "https://www.mara.com/mara-legals/ai-policies#cloud-pp",
    termsOfService: "https://www.mara.com/mara-legals/ai-policies#cloud-toc"
  },
  providerCountry: "US",
  category: "gateway_router",
  inferenceRegions: ["World"]

};

