import type { ImageResponse } from "aihappey-ai";

export type ImageStorageKind = "local" | "indexeddb";

export interface ImageItem {
  /** Client-generated id (backend does not provide one). */
  id: string;
  /** Raw ImageResponse payload (“straight json”). */
  imageResponse: ImageResponse;
}

export interface ImageStore {
  readonly kind: ImageStorageKind;

  /**
   * Adds an image response to the store.
   * Returns the created stored item (including generated id).
   */
  add(imageResponse: ImageResponse): Promise<ImageItem>;

  /** Lists all image items. */
  list(): Promise<ImageItem[]>;

  /**
   * Deletes by id.
   * The second parameter exists to match the requested signature but is optional.
   */
  delete(id: string, imageItem?: unknown): Promise<void>;
}

