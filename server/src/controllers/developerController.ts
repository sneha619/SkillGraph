import { Request, Response, NextFunction } from 'express';
import { GraphService } from '../services/graphService';
import { runReadQuery } from '../config/database';
import { CYPHER_QUERIES } from '../queries/cypherQueries';

export async function listDevelopers(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const records = await runReadQuery<any>(CYPHER_QUERIES.LIST_ALL_DEVELOPERS);

    interface DevItem {
      id: string;
      name: string;
      title: string;
      experienceYears: number;
      avatar?: string;
      skills: Array<{
        id: string;
        name: string;
        level?: string;
        years?: number;
        category?: string;
        difficulty?: string;
      }>;
    }

    const devMap = new Map<string, DevItem>();

    for (const r of records) {
      if (!r.name) continue;
      if (!devMap.has(r.name)) {
        devMap.set(r.name, {
          id: r.id,
          name: r.name,
          title: r.title,
          experienceYears: r.experienceYears,
          avatar: r.avatar,
          skills: [],
        });
      }

      if (r.skillId) {
        devMap.get(r.name)!.skills.push({
          id: r.skillId,
          name: r.skillName,
          level: r.skillLevel,
          years: r.skillYears,
          category: r.skillCategory,
          difficulty: r.skillDifficulty,
        });
      }
    }

    res.json({
      success: true,
      count: devMap.size,
      data: Array.from(devMap.values()),
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeveloperByName(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, error: 'Developer name parameter is required.' });
      return;
    }

    const developer = await GraphService.getDeveloperByName(name.trim());

    if (!developer) {
      res.status(404).json({
        success: false,
        error: `Developer '${name}' not found in CognoDB graph.`,
      });
      return;
    }

    res.json({
      success: true,
      data: developer,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRelatedDevelopers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, error: 'Developer name parameter is required.' });
      return;
    }

    // Verify developer exists
    const developer = await GraphService.getDeveloperByName(name.trim());
    if (!developer) {
      res.status(404).json({
        success: false,
        error: `Developer '${name}' not found in CognoDB graph.`,
      });
      return;
    }

    const related = await GraphService.getRelatedDevelopers(name.trim());

    res.json({
      success: true,
      targetDeveloper: developer.name,
      count: related.length,
      data: related,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeveloperProjectSkills(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, error: 'Developer name parameter is required.' });
      return;
    }

    const traversal = await GraphService.getDeveloperProjectSkillsTraversal(name.trim());

    res.json({
      success: true,
      developer: name.trim(),
      count: traversal.length,
      data: traversal,
    });
  } catch (error) {
    next(error);
  }
}
