import { Request, Response } from 'express';
import { verifyConnection } from '../config/database';
import { seedGraphDatabase } from '../services/seedService';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const conn = await verifyConnection();

  if (conn.connected) {
    res.json({
      status: 'healthy',
      database: 'CognoDB',
      connected: true,
      uri: conn.uri,
      serverAgent: conn.serverAgent,
      protocolVersion: conn.protocolVersion,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'unreachable',
      database: 'CognoDB',
      connected: false,
      uri: conn.uri,
      error: conn.error,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function seedDatabase(_req: Request, res: Response): Promise<void> {
  try {
    const result = await seedGraphDatabase();
    res.json({
      success: true,
      message: result.message,
      stats: result.stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to seed CognoDB graph database.',
    });
  }
}

