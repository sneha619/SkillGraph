import { Request, Response, NextFunction } from 'express';
import { GraphService } from '../services/graphService';

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query.q;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required and must not be empty. Example: /api/search?q=react",
      });
      return;
    }

    const results = await GraphService.searchAll(q.trim());

    res.json({
      success: true,
      query: q.trim(),
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

