import type { VideoResponse } from "aihappey-ai";

export type VideoStorageKind = "local" | "indexeddb";

export interface VideoItem {
  /** Client-generated id (backend does not provide one). */
  id: string;
  /** Raw VideoResponse payload (“straight json”). */
  videoResponse: VideoResponse;
}

export interface VideoStore {
  readonly kind: VideoStorageKind;

  /**
   * Adds a video response to the store.
   * Returns the created stored item (including generated id).
   */
  add(videoResponse: VideoResponse): Promise<VideoItem>;

  /** Lists all video items. */
  list(): Promise<VideoItem[]>;

  /**
   * Updates an existing stored video response.
   * Intended to support operations like deleting a single video from a multi-video response.
   */
  update(id: string, videoResponse: VideoResponse): Promise<VideoItem>;

  /**
   * Deletes by id.
   * The second parameter exists to match the requested signature but is optional.
   */
  delete(id: string, videoItem?: unknown): Promise<void>;
}
