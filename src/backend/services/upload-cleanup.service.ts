import { prisma } from "../config/db";
import { cloudinary } from "../config/cloudinary";

export class UploadCleanupService {
  static async cleanupExpiredReviewUploads() {
    console.log("[UploadCleanup] Starting cleanup of expired PENDING uploads...");
    const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredTrackers = await prisma.uploadTracker.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: thresholdDate }
      },
      take: 100
    });
    if (expiredTrackers.length === 0) {
      console.log("[UploadCleanup] No expired uploads found.");
      return { success: true, deleted: 0 };
    }
    let deletedCount = 0;
    for (const tracker of expiredTrackers) {
      try {
        if (tracker.publicId) {
          await cloudinary.uploader.destroy(tracker.publicId);
        }
        await prisma.uploadTracker.delete({ where: { id: tracker.id } });
        deletedCount++;
      } catch (error: any) {
        if (error?.http_code === 404) {
          await prisma.uploadTracker.delete({ where: { id: tracker.id } }).catch(() => {});
          deletedCount++;
        } else {
          console.error("[UploadCleanup] Failed to clean up tracker " + tracker.id + " (" + tracker.publicId + "):", error.message);
        }
      }
    }
    console.log("[UploadCleanup] Cleanup complete. Deleted " + deletedCount + " orphaned uploads.");
    return { success: true, deleted: deletedCount };
  }
}
