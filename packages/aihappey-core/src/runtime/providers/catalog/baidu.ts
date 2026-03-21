import type { Provider } from "aihappey-types";

export const baidu: Provider = {
  name: "Baidu",
  description: "飞桨星河社区是面向AI学习者的人工智能学习与实训社区。飞桨星河社区集成了丰富的免费AI课程，大模型社区及模型应用，深度学习样例项目，各领域经典数据集，云端超强GPU算力及存储资源，更有新手练习赛、精英算法大赛等你参与。",
  icons: [{
    src: "https://paddlepaddle-org-cn.cdn.bcebos.com/paddle-site-front/favicon-128.png"
  }],
  urls: {
    homepage: "https://aistudio.baidu.com",
    docs: "https://ai.baidu.com/docs",
    termsOfService: "https://www.baidu.com/duty"
  },
  providerCountry: "CN",
  inferenceRegions: ["World"]

};

