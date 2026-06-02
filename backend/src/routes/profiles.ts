import { Router } from "express";
import { syncProfile } from "../workers/syncWorker";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/sync", async (req, res) => {
  try {
    const { userId, platform, handle } = req.body;

    if (!userId || !platform || !handle) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Process synchronously so the frontend can wait for completion
    await syncProfile(userId, platform, handle);

    return res.status(200).json({
      message: "Sync completed successfully",
      status: "Success"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
