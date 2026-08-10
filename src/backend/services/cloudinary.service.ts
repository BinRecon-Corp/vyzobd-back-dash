import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { AppError } from "../utils/AppError";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface CloudinaryUploadResult {
  imageUrl: string;
  publicId: string;
}

export class CloudinaryService {
  /**
   * Uploads an image buffer or string data to Cloudinary (or fallback base64 storage if Cloudinary keys are missing)
   */
  static async uploadImage(
    buffer: Buffer,
    mimetype: string,
    folder = "products"
  ): Promise<CloudinaryUploadResult> {
    // Validation
    if (!ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase())) {
      throw new AppError(
        "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.",
        400,
        "INVALID_FILE_TYPE"
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new AppError(
        "File size exceeds 5MB limit.",
        400,
        "FILE_TOO_LARGE"
      );
    }

    const isCloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL
    );

    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error || !result) {
              return reject(
                new AppError(
                  `Cloudinary upload failed: ${error?.message || "Unknown error"}`,
                  500,
                  "CLOUDINARY_UPLOAD_FAILED"
                )
              );
            }
            resolve({
              imageUrl: result.secure_url,
              publicId: result.public_id,
            });
          }
        );

        uploadStream.end(buffer);
      });
    }

    // Fallback if Cloudinary environment variables are not configured
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimetype};base64,${base64}`;
    const generatedPublicId = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return {
      imageUrl: dataUrl,
      publicId: generatedPublicId,
    };
  }

  /**
   * Deletes an image from Cloudinary
   */
  static async deleteImage(publicId?: string | null): Promise<boolean> {
    if (!publicId) return true;

    const isCloudinaryConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL
    );

    if (isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(publicId);
        return true;
      } catch (err) {
        console.error("Failed to delete image from Cloudinary:", err);
        return false;
      }
    }

    return true;
  }

  /**
   * Replaces an existing image on Cloudinary
   */
  static async replaceImage(
    oldPublicId: string | null | undefined,
    buffer: Buffer,
    mimetype: string,
    folder = "products"
  ): Promise<CloudinaryUploadResult> {
    if (oldPublicId) {
      await this.deleteImage(oldPublicId);
    }
    return this.uploadImage(buffer, mimetype, folder);
  }
}
