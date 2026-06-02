// In-memory mock queue to replace BullMQ and Redis for local execution without Docker
import { syncProfile } from "../workers/syncWorker";

export const addSyncJob = async (userId: string, platform: string, handle: string) => {
  console.log(`[Queue] Added job for ${handle} on ${platform}`);
  
  // Process asynchronously without blocking the request
  setTimeout(async () => {
    try {
      await syncProfile(userId, platform, handle);
    } catch (err) {
      console.error(`[Queue] Failed to process job for ${handle}:`, err);
    }
  }, 1000);
};
