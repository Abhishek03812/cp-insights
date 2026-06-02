import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/dashboard", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    const profiles = await prisma.platformProfile.findMany({
      where: { userId }
    });

    const totalSubmissions = await prisma.submission.count({
      where: { profile: { userId } }
    });

    // 1. Precise Total Solved Calculation
    // Codeforces (from full DB history)
    const cfUniqueSolved = await prisma.submission.groupBy({
      by: ['problemId'],
      where: { profile: { userId, platform: 'Codeforces' }, verdict: 'AC' }
    });
    let totalProblemsSolved = cfUniqueSolved.length;
    let lcTotalSolved = 0;

    // 2. Fetch Codeforces Topics
    const cfSolvedProblems = await prisma.submission.findMany({
      where: { profile: { userId, platform: 'Codeforces' }, verdict: 'AC' },
      select: { problem: { include: { topics: true } } },
      distinct: ['problemId']
    });

    const unifiedTopicCounts: Record<string, { total: number, cf: number, lc: number }> = {};
    cfSolvedProblems.forEach(sub => {
      sub.problem.topics.forEach(t => {
        let name = t.name.toLowerCase();
        if (name === "hash table") name = "hashing";
        if (name === "dynamic programming") name = "dp";
        if (name === "math") name = "math";
        
        if (!unifiedTopicCounts[name]) unifiedTopicCounts[name] = { total: 0, cf: 0, lc: 0 };
        unifiedTopicCounts[name].cf += 1;
        unifiedTopicCounts[name].total += 1;
      });
    });

    // 3. Fetch Live LeetCode Data (Topics + Total Solved)
    let topicData: any[] = [];
    let detailedTopics: any[] = [];
    const lcProfile = profiles.find(p => p.platform === 'LeetCode');
    const cfProfile = profiles.find(p => p.platform === 'Codeforces');

    if (lcProfile) {
      try {
        const { LeetCodeService } = require("../services/leetcode");
        const lcData = await LeetCodeService.getUserProfile(lcProfile.handle);
        
        // Exact LC Total Solved
        if (lcData?.matchedUser?.submitStatsGlobal?.acSubmissionNum) {
           const allObj = lcData.matchedUser.submitStatsGlobal.acSubmissionNum.find((x: any) => x.difficulty === 'All');
           lcTotalSolved = allObj ? allObj.count : 0;
           totalProblemsSolved += lcTotalSolved;
        }

        // Merge LC Topics
        if (lcData?.matchedUser?.tagProblemCounts) {
          const lcTags = [
            ...(lcData.matchedUser.tagProblemCounts.advanced || []),
            ...(lcData.matchedUser.tagProblemCounts.intermediate || []),
            ...(lcData.matchedUser.tagProblemCounts.fundamental || [])
          ];
          lcTags.forEach((t: any) => {
            // Unify names
            let name = t.tagName.toLowerCase();
            if (name === "hash table") name = "hashing";
            if (name === "dynamic programming") name = "dp";
            if (name === "math") name = "math";
            
            if (!unifiedTopicCounts[name]) unifiedTopicCounts[name] = { total: 0, cf: 0, lc: 0 };
            unifiedTopicCounts[name].lc += t.problemsSolved;
            unifiedTopicCounts[name].total += t.problemsSolved;
          });
        }
      } catch (err) {
        console.error("Failed to fetch live LC data", err);
      }
    }

    // Finalize Topic Radar Data
    const sortedTopics = Object.entries(unifiedTopicCounts)
      .map(([subject, counts]) => ({ subject, A: counts.total, cf: counts.cf, lc: counts.lc }))
      .sort((a, b) => b.A - a.A);

    const topTopics = sortedTopics.slice(0, 6);
    const maxSolved = topTopics.length > 0 ? topTopics[0].A : 150;
    const fullMark = Math.max(150, Math.ceil(maxSolved * 1.2));

    topicData = topTopics.map(t => ({ ...t, fullMark }));
    detailedTopics = sortedTopics;

    // 4. Actionable Insights Engine (Brute Force Rules)
    const feedback: string[] = [];
    const cfRating = cfProfile?.currentRating || 0;
    const lcRating = lcProfile?.currentRating || 0;
    const peak = Math.max(cfRating, lcRating);

    // Rating-based suggestions
    if (peak < 1200) {
      feedback.push("You are in the absolute beginner phase. Don't worry about advanced topics right now. Focus strictly on mastering Implementation, basic Math, and Brute Force loops. Aim to comfortably solve 800-1000 rated CF problems.");
    } else if (peak < 1400) {
      feedback.push("You're stuck in the Pupil range. You have the basics down, but you need to improve your speed and start recognizing Greedy patterns and Sorting reductions. Practice 1200-1300 rated problems.");
    } else if (peak < 1600) {
      feedback.push("You're at the Specialist level. To push to Expert, you MUST master fundamental Dynamic Programming, Graph Traversal (DFS/BFS), and Number Theory. Speed on the first 2-3 questions in contests is critical.");
    } else {
      feedback.push("You are highly advanced. To continue climbing, focus heavily on advanced Trees, Segment Trees, complex DP state optimizations, and Combinatorics.");
    }

    // Weakness-based suggestions (Rating-Specific Topic Pools)
    const beginnerPool = ['implementation', 'math', 'greedy', 'brute force', 'strings', 'sorting', 'two pointers'];
    const intermediatePool = ['dp', 'graphs', 'dfs and similar', 'binary search', 'number theory', 'constructive algorithms', 'data structures'];
    const advancedPool = ['trees', 'segment tree', 'combinatorics', 'bitmasks', 'shortest paths', 'dsu', 'geometry'];

    let activePool: string[] = [];
    if (peak < 1200) {
      activePool = beginnerPool;
    } else if (peak < 1600) {
      activePool = intermediatePool;
    } else {
      activePool = advancedPool;
    }

    const relevantTopics = sortedTopics.filter(t => activePool.includes(t.subject.toLowerCase()));

    if (relevantTopics.length > 0) {
      const weakest = relevantTopics.slice(-3).map(t => t.subject);
      feedback.push(`Based on your rating, your weakest core topics are ${weakest.join(', ')}. Allocate 2 days a week to drill these exclusively to break into the next tier.`);
    } else {
      feedback.push(`Focus on practicing fundamental topics like ${activePool.slice(0, 3).join(', ')} to build a strong foundation.`);
    }

    // Cross-platform sync suggestion
    if (cfRating > 0 && lcRating === 0) {
      feedback.push("You are active on Codeforces but missing out on LeetCode. Link your LeetCode account to practice interview-style DSA patterns.");
    }

    const contestCount = await prisma.contestResult.count({
      where: { profile: { userId } }
    });

    // Fetch Contest Results to build Rating Chart
    const contestResults = await prisma.contestResult.findMany({
      where: { profile: { userId } },
      include: { contest: true, profile: true },
      orderBy: { contest: { startTime: 'asc' } }
    });

    // Plot chronologically from the start of the account
    const ratingData: any[] = [];
    let currentCF: number | null = null;
    let currentLC: number | null = null;

    // Deduplicate contest results by contestId to handle multiple syncs
    const uniqueContestsMap = new Map();
    contestResults.forEach(cr => {
      uniqueContestsMap.set(cr.contestId, cr);
    });
    
    // Sort the deduplicated contests by startTime
    const uniqueContests = Array.from(uniqueContestsMap.values()).sort(
      (a: any, b: any) => a.contest.startTime.getTime() - b.contest.startTime.getTime()
    );

    uniqueContests.forEach((cr: any) => {
      const date = cr.contest.startTime;
      
      const point: any = {
        timestamp: date.getTime(),
        contestName: cr.contest.name
      };

      if (cr.profile.platform === 'Codeforces') {
        point.codeforces = Math.round(cr.newRating);
      } else if (cr.profile.platform === 'LeetCode') {
        point.leetcode = Math.round(cr.newRating);
      }

      ratingData.push(point);
    });

    const dashboardData = {
      overall: {
        totalProblemsSolved,
        totalSubmissions,
        acceptanceRate: totalSubmissions > 0 ? (cfUniqueSolved.length / totalSubmissions) * 100 : 0,
        totalContests: contestCount,
        streak: totalProblemsSolved > 0 ? 1 : 0, 
      },
      platforms: profiles.map(p => ({
        platform: p.platform,
        handle: p.handle,
        currentRating: p.currentRating,
        maxRating: p.maxRating,
        lastSynced: p.lastSynced
      })),
      ratingData,
      topicData,
      detailedTopics,
      feedback
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/topics", async (req, res) => {
  return res.status(200).json({
    strong: ["Graphs", "Dynamic Programming", "Trees"],
    weak: ["Strings", "Number Theory", "Segment Trees"],
    needsImprovement: ["Geometry", "Bit Manipulation"]
  });
});

export default router;
