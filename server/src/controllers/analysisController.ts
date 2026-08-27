import { Request, Response } from 'express';
import { runReadQuery } from '../config/database';

export async function analyzeSkillGap(req: Request, res: Response): Promise<void> {
  try {
    const { developerId, roleId } = req.query;

    if (!developerId || !roleId) {
      res.status(400).json({
        success: false,
        error: 'Both developerId and roleId query parameters are required.',
      });
      return;
    }

    const devParam = String(developerId).trim();
    const roleParam = String(roleId).trim();

    // 1. Fetch developer info
    const devQuery = `
      MATCH (dev:Developer)
      WHERE dev.id = $devParam OR toLower(dev.name) = toLower($devParam)
      RETURN coalesce(dev.id, dev.name) AS id, dev.name AS name, dev.title AS title
      LIMIT 1;
    `;

    // 2. Fetch role info
    const roleQuery = `
      MATCH (role)
      WHERE (role:Role OR role:JobRole) AND (role.id = $roleParam OR toLower(role.title) = toLower($roleParam))
      RETURN coalesce(role.id, role.title) AS id, role.title AS title, role.department AS department
      LIMIT 1;
    `;

    // 3. Fetch skills needed for the role and check if developer is proficient
    const roleSkillsQuery = `
      MATCH (role)
      WHERE (role:Role OR role:JobRole) AND (role.id = $roleParam OR toLower(role.title) = toLower($roleParam))
      OPTIONAL MATCH (role)-[nr:NEEDS_SKILL]->(s:Skill)
      OPTIONAL MATCH (dev:Developer)-[p:PROFICIENT_IN|KNOWS_SKILL]->(s)
      WHERE dev.id = $devParam OR toLower(dev.name) = toLower($devParam)
      RETURN coalesce(s.id, s.name) AS id,
             s.name AS name,
             s.category AS category,
             s.difficulty AS difficulty,
             nr.importance AS importance,
             coalesce(p.level, p.proficiency) AS level;
    `;

    // 4. For missing skills, fetch unfulfilled prerequisites
    const prereqsQuery = `
      MATCH (role)
      WHERE (role:Role OR role:JobRole) AND (role.id = $roleParam OR toLower(role.title) = toLower($roleParam))
      MATCH (role)-[nr:NEEDS_SKILL]->(needed:Skill)
      WHERE NOT (:Developer {name: $devParam})-[:PROFICIENT_IN|KNOWS_SKILL]->(needed)
        AND NOT (:Developer {id: $devParam})-[:PROFICIENT_IN|KNOWS_SKILL]->(needed)
      OPTIONAL MATCH (needed)-[:REQUIRES*1..4]->(prereq:Skill)
      WHERE NOT (:Developer {name: $devParam})-[:PROFICIENT_IN|KNOWS_SKILL]->(prereq)
        AND NOT (:Developer {id: $devParam})-[:PROFICIENT_IN|KNOWS_SKILL]->(prereq)
      RETURN coalesce(needed.id, needed.name) AS neededId,
             coalesce(prereq.id, prereq.name) AS prereqId,
             prereq.name AS prereqName,
             prereq.category AS prereqCategory,
             prereq.difficulty AS prereqDifficulty;
    `;

    const [devRecords, roleRecords, roleSkillRecords, prereqRecords] = await Promise.all([
      runReadQuery<any>(devQuery, { devParam }),
      runReadQuery<any>(roleQuery, { roleParam }),
      runReadQuery<any>(roleSkillsQuery, { devParam, roleParam }),
      runReadQuery<any>(prereqsQuery, { devParam, roleParam }),
    ]);

    if (devRecords.length === 0 || roleRecords.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Could not perform gap analysis with the specified developerId and roleId.',
      });
      return;
    }

    const developer = devRecords[0];
    const role = roleRecords[0];

    // Group prerequisites by needed skill ID
    const prereqsByNeededId = new Map<string, Array<{
      id: string;
      name: string;
      category?: string;
      difficulty?: string;
    }>>();

    for (const p of prereqRecords) {
      if (!p.neededId) continue;
      if (!prereqsByNeededId.has(p.neededId)) {
        prereqsByNeededId.set(p.neededId, []);
      }
      if (p.prereqId) {
        const list = prereqsByNeededId.get(p.neededId)!;
        if (!list.some((item) => item.id === p.prereqId)) {
          list.push({
            id: p.prereqId,
            name: p.prereqName,
            category: p.prereqCategory,
            difficulty: p.prereqDifficulty,
          });
        }
      }
    }

    const possessedSkills: any[] = [];
    const missingSkillsWithRoadmap: any[] = [];

    for (const s of roleSkillRecords) {
      if (!s.name) continue;
      if (s.level !== null && s.level !== undefined) {
        possessedSkills.push({
          id: s.id,
          name: s.name,
          category: s.category,
          difficulty: s.difficulty,
          level: s.level,
        });
      } else {
        const missingPrerequisites = prereqsByNeededId.get(s.id) || [];
        missingSkillsWithRoadmap.push({
          targetSkillId: s.id,
          targetSkillName: s.name,
          category: s.category,
          difficulty: s.difficulty,
          importance: s.importance || 'Recommended',
          missingPrerequisites,
          blockerCount: missingPrerequisites.length,
        });
      }
    }

    const totalRequired = possessedSkills.length + missingSkillsWithRoadmap.length;
    const matchPercentage = totalRequired > 0 ? Math.round((possessedSkills.length / totalRequired) * 100) : 0;

    res.json({
      success: true,
      data: {
        developer,
        role,
        stats: {
          totalRequired,
          skillsPossessedCount: possessedSkills.length,
          skillsMissingCount: missingSkillsWithRoadmap.length,
          matchPercentage,
        },
        possessedSkills,
        missingSkillsWithRoadmap,
      },
    });
  } catch (error: any) {
    console.error('Error analyzing skill gap:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
