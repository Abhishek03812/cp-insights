import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { IntelligenceEngine } from "../services/intelligence";

const router = Router();
const prisma = new PrismaClient();

// GET /api/intelligence/prediction?userId=...
router.get("/prediction", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Fetch contest history
    const contests = await prisma.contestResult.findMany({
      where: { profile: { userId } },
      include: { contest: true },
      orderBy: { contest: { startTime: 'asc' } }
    });

    const contestHistory = contests.map(c => ({
      rating: c.newRating,
      timestamp: c.contest.startTime.getTime()
    }));

    const prediction = IntelligenceEngine.predictRating(contestHistory);

    return res.status(200).json(prediction);
  } catch (error) {
    console.error("Prediction Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/intelligence/plan?userId=...
router.get("/plan", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing userId" });
    }

    // In a full implementation, we'd query the DB to determine exact weak/strong topics dynamically.
    // For this milestone, we use placeholder topics for demonstration.
    const weakTopics = ["Strings", "Number Theory"];
    const strongTopics = ["Graphs", "Dynamic Programming"];
    
    // Assume user's current max rating across platforms is ~1400
    const plan = IntelligenceEngine.generateDailyPlan(weakTopics, strongTopics, 1400);

    return res.status(200).json(plan);
  } catch (error) {
    console.error("Plan Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
