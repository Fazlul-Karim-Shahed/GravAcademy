import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';

const FREE_TIER_BYTES = 512 * 1024 * 1024;

export const getDatabaseUsage = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(503).json({ success: false, message: 'Database connection is not ready.' });
    const stats = await db.stats();
    const collections = [];
    for (const item of await db.listCollections().toArray()) {
      const collectionStats = await db.command({ collStats: item.name });
      collections.push({
        name: item.name,
        documents: collectionStats.count || 0,
        dataSize: collectionStats.size || 0,
        storageSize: collectionStats.storageSize || 0,
        indexSize: collectionStats.totalIndexSize || 0,
        totalSize: (collectionStats.storageSize || 0) + (collectionStats.totalIndexSize || 0),
      });
    }
    collections.sort((a, b) => b.totalSize - a.totalSize);
    const usedBytes = (stats.storageSize || 0) + (stats.indexSize || 0);
    return res.json({ success: true, data: {
      database: stats.db,
      collections,
      documents: stats.objects || 0,
      dataSize: stats.dataSize || 0,
      storageSize: stats.storageSize || 0,
      indexSize: stats.indexSize || 0,
      usedBytes,
      capacityBytes: FREE_TIER_BYTES,
      usagePercent: Number(((usedBytes / FREE_TIER_BYTES) * 100).toFixed(2)),
      checkedAt: new Date().toISOString(),
    } });
  } catch (error) {
    console.error('getDatabaseUsage error:', error);
    return res.status(500).json({ success: false, message: 'Database usage load করা যায়নি।' });
  }
};
