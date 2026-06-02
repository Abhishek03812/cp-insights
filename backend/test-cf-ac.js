const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.submission.groupBy({
    by: ['problemId'],
    where: { profile: { platform: 'Codeforces' }, verdict: 'AC' }
  });
  console.log('CF ACs in DB:', u.length);
}

main().finally(() => prisma.$disconnect());
