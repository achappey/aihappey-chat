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

