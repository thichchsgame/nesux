import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type UploadedReviewMedia = { url: string; type: "IMAGE" | "VIDEO" };

/** Upload a local image file for trusted server-side scripts such as demo seeds. */
export async function uploadImageFromPath(
  filePath: string,
  folder: string,
): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
}

export async function uploadReviewMedia(
  file: File,
  folder: string,
): Promise<UploadedReviewMedia> {
  const isImage = IMAGE_MIME_TYPES.has(file.type);
  const isVideo = VIDEO_MIME_TYPES.has(file.type);

  if (!isImage && !isVideo)
    throw new Error(
      "Chỉ chấp nhận ảnh (JPG/PNG/WebP) hoặc video (MP4/WebM/MOV).",
    );
  if (isImage && file.size > MAX_IMAGE_SIZE)
    throw new Error("Mỗi ảnh tối đa 5MB.");
  if (isVideo && file.size > MAX_VIDEO_SIZE)
    throw new Error("Mỗi video tối đa 20MB.");

  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: isVideo ? "video" : "image" },
        (error, result) => {
          if (error || !result)
            return reject(error ?? new Error("Upload thất bại."));
          resolve({
            url: result.secure_url,
            type: isVideo ? "VIDEO" : "IMAGE",
          });
        },
      )
      .end(buffer);
  });
}
