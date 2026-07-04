export const allowedVideoAttachmentTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const isValidVideoAttachment = (file: File) =>
  allowedVideoAttachmentTypes.has(file.type);

export const pickFirstValidVideoAttachment = (files: File[]) =>
  files.find(isValidVideoAttachment);

export const toSingleVideoAttachment = (files: File[]) =>
  pickFirstValidVideoAttachment(files) ?? null;

export const isValidVideoImageAttachment = (file: File | Blob) =>
  !!file.type && file.type.startsWith("image/");

export const VIDEO_INPUT_REFERENCE_PREFIX = "video_input_reference_";
export const VIDEO_FRAME_IMAGE_PREFIX = "video_frame_image_";

export const videoFrameTypes = ["first_frame", "last_frame"] as const;
export type VideoFrameType = (typeof videoFrameTypes)[number];

export const videoFrameImageNamePrefix = (frameType: VideoFrameType) =>
  `${VIDEO_FRAME_IMAGE_PREFIX}${frameType}_`;

export const stripVideoInputReferencePrefix = (name: string) =>
  name.replace(new RegExp(`^${VIDEO_INPUT_REFERENCE_PREFIX}\\d+_`), "");

export const stripVideoFrameImagePrefix = (name: string, frameType: VideoFrameType) =>
  name.replace(new RegExp(`^${videoFrameImageNamePrefix(frameType)}`), "");

