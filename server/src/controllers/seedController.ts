import { Request, Response } from 'express';
import { verifyConnection } from '../config/database';
import { runDatabaseSeed } from '../seed/seedRunner';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  try {
    const conn = await verifyConnection();
    res.json({
      status: conn.connected ? 'healthy' : 'degraded',
      database: 'CognoDB',
      details: conn,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'CognoDB',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function seedDatabase(_req: Request, res: Response): Promise<void> {
  try {
    const result = await runDatabaseSeed();
    res.json({
      success: true,
      message: result.message,
      stats: result.stats,
    });
  } catch (error: any) {
    console.error('Seeding error via API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to seed CognoDB graph database',
    });
  }
}

