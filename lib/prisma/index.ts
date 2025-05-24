import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Explicitly provide the DATABASE_URL to ensure it's used correctly
const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Log the database URL (with credentials masked) to help with debugging
const dbUrl = process.env.DATABASE_URL || '';
console.log('Prisma initialized with database:', {
  defined: !!dbUrl,
  valid: dbUrl.startsWith('postgresql://'),
  prefix: dbUrl.substring(0, 15) + '...',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;