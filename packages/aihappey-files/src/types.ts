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
  list(): Promise<StoredFile[]>;
  read(id: string): Promise<StoredFile | undefined>;
  create(file: {
    name: string;
    mimeType: string;
    data: Blob;
  }): Promise<StoredFile>;
  rename(id: string, newName: string): Promise<StoredFile>;
  delete(id: string): Promise<void>;
}
