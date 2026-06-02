const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '6e915bdd-457c-486c-89f1-acb5db418bd7';
  
  const unique = await prisma.submission.groupBy({
    by: ['problemId'],
    where: { profile: { userId }, verdict: 'AC' }
  });
  
  const all = await prisma.submission.count({
    where: { profile: { userId }, verdict: 'AC' }
  });
  
  console.log('Unique:', unique.length, 'Total AC:', all);
}

main().finally(() => prisma.$disconnect());
