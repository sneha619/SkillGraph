import { Request, Response, NextFunction } from 'express';
import { GraphService } from '../services/graphService';
import { runReadQuery } from '../config/database';
import { CYPHER_QUERIES } from '../queries/cypherQueries';

export async function listSkills(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const records = await runReadQuery(CYPHER_QUERIES.LIST_ALL_SKILLS);
    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSkillByName(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, error: 'Skill name parameter is required.' });
      return;
    }

    const skill = await GraphService.getSkillByName(name.trim());

    if (!skill) {
      res.status(404).json({
        success: false,
        error: `Skill '${name}' not found in CognoDB graph.`,
      });
      return;
    }

    res.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSkillDevelopers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.params;

    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, error: 'Skill name parameter is required.' });
      return;
    }

    const developers = await GraphService.getDevelopersBySkill(name.trim());

    res.json({
      success: true,
      skillName: name.trim(),
      count: developers.length,
      data: developers,
    });
  } catch (error) {
    next(error);
  }
}
