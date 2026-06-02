import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  
  // Create Demo User
  const user = await prisma.user.upsert({
    where: { email: 'demo@cpinsight.com' },
    update: {},
    create: {
      id: 'demo',
      email: 'demo@cpinsight.com',
      passwordHash: 'hashed',
      name: 'Demo User',
    },
  });

  // Create Codeforces Profile
  await prisma.platformProfile.upsert({
    where: { userId_platform: { userId: user.id, platform: 'Codeforces' } },
    update: {},
    create: {
      userId: user.id,
      platform: 'Codeforces',
      handle: 'tourist_lite',
      currentRating: 1600,
      maxRating: 1850,
    }
  });

  // Create LeetCode Profile
  await prisma.platformProfile.upsert({
    where: { userId_platform: { userId: user.id, platform: 'LeetCode' } },
    update: {},
    create: {
      userId: user.id,
      platform: 'LeetCode',
      handle: 'algo_master',
      currentRating: 2100,
      maxRating: 2150,
    }
  });

  // Create some fake submissions for the demo user
  const profile = await prisma.platformProfile.findFirst({ where: { userId: 'demo', platform: 'Codeforces' }});
  
  if (profile) {
    // Add 100 fake submissions
    for (let i = 0; i < 100; i++) {
      const problem = await prisma.problem.create({
        data: {
          platform: 'Codeforces',
          platformProblemId: `PROB-${i}`,
          name: `Problem ${i}`,
          difficultyRating: 1000 + (Math.floor(Math.random() * 10) * 100)
        }
      });

      await prisma.submission.create({
        data: {
          profileId: profile.id,
          problemId: problem.id,
          verdict: Math.random() > 0.3 ? 'AC' : 'WA',
          submittedAt: new Date(),
        }
      });
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
