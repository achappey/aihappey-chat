import type { Provider } from "aihappey-types";

export const alibaba: Provider = {
  name: "Alibaba",
  description:
    "Discover Alibaba Cloud's reliable cloud computing services for businesses of all sizes. Improve security and performance with our advanced cloud technologies.",
  icons: [
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREXxWppPgNoDOukU_2RHGUnoU-_i664iBN5w&s",
    },
  ],
  urls: {
    homepage: "https://www.alibabacloud.com",
    privacyPolicy: "https://www.alibabacloud.com/help/en/legal/latest/alibaba-cloud-international-website-privacy-policy",  // internationale privacy policy van Alibaba Cloud :contentReference[oaicite:0]{index=0}
    termsOfService: "https://www.alibabacloud.com/help/en/legal/latest/alibaba-cloud-international-website-product-terms-of-service-v-3-8-0"
  },
  providerCountry: "CN",
  inferenceRegions: ["Asia", "Americas"]

};

