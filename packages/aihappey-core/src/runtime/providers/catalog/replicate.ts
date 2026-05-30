import type { Provider } from "aihappey-types";

export const replicate: Provider = {
  name: "Replicate",
  description: "Run open-source machine learning models with a cloud API.",
  icons: [
    {
      src: "https://media.licdn.com/dms/image/v2/D560BAQGbWdPmxf-NMA/company-logo_200_200/company-logo_200_200/0/1701798584156/replicate_logo?e=2147483647&v=beta&t=_xwx0D-qYlw-CzeBbHT7DDFoaxHp9WPen28-FTvoZak",
    },
  ],
  urls: {
    homepage: "https://replicate.com",
    docs: "https://replicate.com/docs",
    privacyPolicy: "https://replicate.com/privacy",
    termsOfService: "https://replicate.com/terms",
    console: "https://replicate.com/account/api-tokens"
  },
  providerCountry: "US",
  category: "inference_compute",
  inferenceRegions: ["World"]

};

