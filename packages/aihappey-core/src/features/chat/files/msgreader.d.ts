declare module "msgreader" {
  export class MSGReader {
    constructor(buffer: ArrayBuffer);
    getFileData(): {
      body?: string;
      bodyHTML?: string;
      attachments?: any[];
      [key: string]: any;
    };
  }
}
