import { PrismaClient } from "@prisma/client";
import { CodeforcesService } from "../services/codeforces";
import { LeetCodeService } from "../services/leetcode";

const prisma = new PrismaClient();

export const syncProfile = async (userId: string, platform: string, handle: string) => {
  console.log(`Starting sync for ${handle} on ${platform}...`);

  let currentRating = 0;
  let maxRating = 0;

  try {
    if (platform === "Codeforces") {
      const userInfo = await CodeforcesService.getUserInfo(handle);
      currentRating = userInfo.rating || 0;
      maxRating = userInfo.maxRating || 0;
      
      let profile = await prisma.platformProfile.findUnique({
        where: { userId_platform: { userId, platform } }
      });
      
      if (profile && profile.handle !== handle) {
         await prisma.submission.deleteMany({ where: { profileId: profile.id } });
         await prisma.contestResult.deleteMany({ where: { profileId: profile.id } });
      }
      
      profile = await prisma.platformProfile.upsert({
        where: { userId_platform: { userId, platform } },
        update: { handle, currentRating, maxRating, lastSynced: new Date() },
        create: { userId, platform, handle, currentRating, maxRating }
      });

      // Fetch Submissions (Fetch all history)
      try {
        const submissions = await CodeforcesService.getUserSubmissions(handle, 10000);
        
        // 1. Fetch existing submissions to prevent redundant upserts
        const existingSubs = await prisma.submission.findMany({
          where: { profileId: profile.id },
          select: { id: true }
        });
        const existingSubIds = new Set(existingSubs.map(s => s.id));
        
        const processedProblems = new Map<string, string>();
        const newSubmissionsToInsert: any[] = [];
        const seenSubmissions = new Set<number>();

        for (const sub of submissions) {
          if (!sub.problem || !sub.problem.name) continue;
          if (seenSubmissions.has(sub.id)) continue;
          seenSubmissions.add(sub.id);
          
          const platformProblemId = String(sub.problem.contestId) + String(sub.problem.index);
          let dbProblemId = processedProblems.get(platformProblemId);
          
          if (!dbProblemId) {
            // Upsert Problem only ONCE per unique problem
            const problem = await prisma.problem.upsert({
              where: { platform_platformProblemId: { platform: 'Codeforces', platformProblemId } },
              update: {},
              create: {
                platform: 'Codeforces',
                platformProblemId,
                name: sub.problem.name,
                difficultyRating: sub.problem.rating || 1000
              }
            });
            dbProblemId = problem.id;
            processedProblems.set(platformProblemId, dbProblemId);

            // Link Topics only ONCE per unique problem
            if (sub.problem.tags && Array.isArray(sub.problem.tags)) {
              for (const tagName of sub.problem.tags) {
                await prisma.topic.upsert({
                  where: { name: tagName },
                  update: { problems: { connect: { id: dbProblemId } } },
                  create: { name: tagName, problems: { connect: { id: dbProblemId } } }
                });
              }
            }
          }

          // Prepare Submission for Batch Insert
          const subIdStr = `CF-${sub.id}`;
          if (!existingSubIds.has(subIdStr)) {
            newSubmissionsToInsert.push({
              id: subIdStr,
              profileId: profile.id,
              problemId: dbProblemId,
              verdict: sub.verdict === 'OK' ? 'AC' : 'WA',
              submittedAt: new Date(sub.creationTimeSeconds * 1000),
            });
            existingSubIds.add(subIdStr);
          }
        }

        // Batch Insert in chunks of 500 for SQLite
        for (let i = 0; i < newSubmissionsToInsert.length; i += 500) {
          await prisma.submission.createMany({
            data: newSubmissionsToInsert.slice(i, i + 500)
          });
        }
      } catch (err) {
        console.error("Failed to sync Codeforces submissions", err);
      }

      // Fetch Rating History
      try {
        const history = await CodeforcesService.getUserRatingHistory(handle);
        for (const rating of history) {
          // Upsert Contest
          const contest = await prisma.contest.upsert({
            where: { id: `CF-${rating.contestId}` },
            update: {},
            create: {
              id: `CF-${rating.contestId}`,
              platform: 'Codeforces',
              name: rating.contestName,
              startTime: new Date(rating.ratingUpdateTimeSeconds * 1000)
            }
          });

          // Insert Result
          await prisma.contestResult.create({
            data: {
              profileId: profile.id,
              contestId: contest.id,
              rank: rating.rank,
              ratingChange: rating.newRating - rating.oldRating,
              newRating: rating.newRating
            }
          });
        }
      } catch (err) {
        console.error("Failed to sync Codeforces rating history", err);
      }

    } else if (platform === "LeetCode") {
      const data = await LeetCodeService.getUserProfile(handle);
      if (data.userContestRanking) {
        currentRating = Math.round(data.userContestRanking.rating);
        maxRating = currentRating;
      }
      
      let profile = await prisma.platformProfile.findUnique({
        where: { userId_platform: { userId, platform } }
      });
      
      if (profile && profile.handle !== handle) {
         await prisma.submission.deleteMany({ where: { profileId: profile.id } });
         await prisma.contestResult.deleteMany({ where: { profileId: profile.id } });
      }
      
      profile = await prisma.platformProfile.upsert({
        where: { userId_platform: { userId, platform } },
        update: { handle, currentRating, maxRating, lastSynced: new Date() },
        create: { userId, platform, handle, currentRating, maxRating }
      });

      // Save real LeetCode Contest History for accurate charts
      try {
        if (data.userContestRankingHistory) {
          let lastRating = 1500;
          for (const contestResult of data.userContestRankingHistory) {
            if (!contestResult.attended) continue;
            
            const newRating = Math.round(contestResult.rating);
            const ratingChange = newRating - lastRating;
            lastRating = newRating;

            const contest = await prisma.contest.upsert({
              where: { id: `LC-${contestResult.contest.title}` },
              update: {},
              create: {
                id: `LC-${contestResult.contest.title}`,
                platform: 'LeetCode',
                name: contestResult.contest.title,
                startTime: new Date(contestResult.contest.startTime * 1000)
              }
            });

            await prisma.contestResult.create({
              data: {
                profileId: profile.id,
                contestId: contest.id,
                rank: 0,
                ratingChange,
                newRating
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync LC contest history", err);
      }

      // LeetCode Recent Submissions
      try {
        const lcData = await LeetCodeService.getUserRecentSubmissions(handle, 50);
        for (const sub of lcData.recentAcSubmissionList) {
          const problem = await prisma.problem.upsert({
            where: { platform_platformProblemId: { platform: 'LeetCode', platformProblemId: sub.titleSlug } },
            update: {},
            create: {
              platform: 'LeetCode',
              platformProblemId: sub.titleSlug,
              name: sub.title,
              difficultyRating: 1500
            }
          });

          await prisma.submission.create({
            data: {
              profileId: profile.id,
              problemId: problem.id,
              verdict: 'AC',
              submittedAt: new Date(parseInt(sub.timestamp) * 1000),
            }
          });
        }
      } catch (err) {
         console.error("Failed to sync LC submissions", err);
      }
    }

    console.log(`Successfully synced ${handle} on ${platform}`);
  } catch (error) {
    console.error(`Error syncing ${handle} on ${platform}:`, error);
    throw error;
  }
};
