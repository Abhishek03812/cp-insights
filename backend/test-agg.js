const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '6e915bdd-457c-486c-89f1-acb5db418bd7';
  
  const contestResults = await prisma.contestResult.findMany({
    where: { profile: { userId } },
    include: { contest: true, profile: true },
    orderBy: { contest: { startTime: 'asc' } }
  });

  const ratingData = [];
  let currentCF = null;
  let currentLC = null;

  contestResults.forEach(cr => {
    const date = cr.contest.startTime;
    const monthStr = date.toLocaleString('default', { month: 'short' });
    const yearStr = date.getFullYear().toString().substring(2);
    const label = `${monthStr} '${yearStr}`;

    if (cr.profile.platform === 'Codeforces') {
      currentCF = Math.round(cr.newRating);
    } else if (cr.profile.platform === 'LeetCode') {
      currentLC = Math.round(cr.newRating);
    }

    ratingData.push({
      label,
      timestamp: date.getTime(),
      codeforces: currentCF,
      leetcode: currentLC
    });
  });

  console.log(JSON.stringify(ratingData.slice(0, 5), null, 2));
  console.log('Total Rating Data Points:', ratingData.length);
}

main().finally(() => prisma.$disconnect());
