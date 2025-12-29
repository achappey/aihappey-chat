export type FileItem = {
  id: string;
  name: string;
  createdAt: number;
};

export type StoredFile = FileItem & {
  data: Blob;
};

export interface FileStore {
  readonly kind: "indexeddb";
  list(): Promise<FileItem[]>;
  read(id: string): Promise<StoredFile | undefined>;
  create(file: {
    name: string;
    mimeType: string;
    data: Blob;
  }): Promise<FileItem>;
  delete(id: string): Promise<void>;
}
