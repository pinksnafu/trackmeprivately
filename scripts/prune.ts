import { PrismaClient } from '@prisma/client';

export async function main() {
  const prisma = new PrismaClient();
  const rawRetention = process.env.ANALYTICS_RETENTION_DAYS;

  if (!rawRetention) {
    console.log('[MAINTENANCE] ANALYTICS_RETENTION_DAYS is not set. Data retention pruning is disabled.');
    await prisma.$disconnect();
    return;
  }

  const days = Number(rawRetention);
  if (!Number.isInteger(days) || days <= 0) {
    console.error(`[MAINTENANCE] ERROR: Invalid ANALYTICS_RETENTION_DAYS value "${rawRetention}". Must be a positive integer.`);
    process.exit(1);
  }

  console.log(`[MAINTENANCE] Starting analytics cleanup. Retention window: ${days} days.`);

  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    
    // 1. Delete old events
    const deleteResult = await prisma.event.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });

    console.log(`[MAINTENANCE] Deleted ${deleteResult.count} events older than ${cutoff.toISOString()}.`);

    // 2. Perform SQLite vacuum to free up disk space
    console.log('[MAINTENANCE] Running VACUUM to reclaim disk space...');
    await prisma.$executeRawUnsafe('VACUUM;');
    console.log('[MAINTENANCE] Database size optimization completed successfully.');
  } catch (error) {
    console.error('[MAINTENANCE] ERROR executing cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
