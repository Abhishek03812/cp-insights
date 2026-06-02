const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  const subs = await prisma.submission.count();
  console.log('Submissions:', subs);
  const results = await prisma.contestResult.count();
  console.log('Contest Results:', results);
}

main().finally(() => prisma.$disconnect());
