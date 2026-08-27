import { Request, Response } from 'express';
import { runReadQuery } from '../config/database';

export async function listRoles(_req: Request, res: Response): Promise<void> {
  try {
    const cypher = `
      MATCH (r)
      WHERE r:Role OR r:JobRole
      OPTIONAL MATCH (r)-[n:NEEDS_SKILL]->(s:Skill)
      RETURN coalesce(r.id, r.title) AS id,
             r.title AS title,
             r.department AS department,
             coalesce(r.targetLevel, r.level) AS targetLevel,
             coalesce(s.id, s.name) AS skillId,
             s.name AS skillName,
             n.importance AS importance,
             s.category AS skillCategory,
             s.difficulty AS skillDifficulty
      ORDER BY r.title ASC;
    `;
    const records = await runReadQuery<any>(cypher);

    interface RoleData {
      id: string;
      title: string;
      department?: string;
      targetLevel?: string;
      requiredSkills: Array<{
        id: string;
        name: string;
        importance?: string;
        category?: string;
        difficulty?: string;
      }>;
    }

    const roleMap = new Map<string, RoleData>();

    for (const r of records) {
      if (!r.title && !r.id) continue;
      const key = r.id || r.title;
      if (!roleMap.has(key)) {
        roleMap.set(key, {
          id: key,
          title: r.title,
          department: r.department,
          targetLevel: r.targetLevel,
          requiredSkills: [],
        });
      }

      if (r.skillName) {
        roleMap.get(key)!.requiredSkills.push({
          id: r.skillId || r.skillName,
          name: r.skillName,
          importance: r.importance,
          category: r.skillCategory,
          difficulty: r.skillDifficulty,
        });
      }
    }

    res.json({ success: true, count: roleMap.size, data: Array.from(roleMap.values()) });
  } catch (error: any) {
    console.error('Error listing roles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getRoleById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const cypher = `
      MATCH (r)
      WHERE (r:Role OR r:JobRole) AND (r.id = $id OR toLower(r.title) = toLower($id))
      OPTIONAL MATCH (r)-[n:NEEDS_SKILL]->(s:Skill)
      RETURN coalesce(r.id, r.title) AS id,
             r.title AS title,
             r.department AS department,
             coalesce(r.targetLevel, r.level) AS targetLevel,
             coalesce(s.id, s.name) AS skillId,
             s.name AS skillName,
             n.importance AS importance,
             s.category AS skillCategory,
             s.difficulty AS skillDifficulty;
    `;
    const records = await runReadQuery<any>(cypher, { id });
    if (!records || records.length === 0) {
      res.status(404).json({ success: false, error: `Job Role '${id}' not found` });
      return;
    }

    const first = records[0];
    const requiredSkills: Array<{
      id: string;
      name: string;
      importance?: string;
      category?: string;
      difficulty?: string;
    }> = [];

    for (const r of records) {
      if (r.skillName) {
        requiredSkills.push({
          id: r.skillId || r.skillName,
          name: r.skillName,
          importance: r.importance,
          category: r.skillCategory,
          difficulty: r.skillDifficulty,
        });
      }
    }

    res.json({
      success: true,
      data: {
        id: first.id,
        title: first.title,
        department: first.department,
        targetLevel: first.targetLevel,
        requiredSkills,
      },
    });
  } catch (error: any) {
    console.error('Error fetching role:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
