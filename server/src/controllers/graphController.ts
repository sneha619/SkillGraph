import { Request, Response } from 'express';
import { runReadQuery } from '../config/database';
import { CYPHER_QUERIES } from '../queries/cypherQueries';

export async function listCompanies(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const records = await runReadQuery<any>(CYPHER_QUERIES.LIST_ALL_COMPANIES);
    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error: any) {
    console.error('Error listing companies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function listProjects(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const records = await runReadQuery<any>(CYPHER_QUERIES.LIST_ALL_PROJECTS);

    interface ProjectItem {
      name: string;
      description?: string;
      status?: string;
      skills: Array<{
        name: string;
        category?: string;
        difficulty?: string;
      }>;
      contributors: Array<{
        developerName: string;
        roleOnProject: string;
      }>;
    }

    const projMap = new Map<string, ProjectItem>();

    for (const r of records) {
      if (!r.name) continue;
      if (!projMap.has(r.name)) {
        projMap.set(r.name, {
          name: r.name,
          description: r.description || undefined,
          status: r.status || undefined,
          skills: [],
          contributors: [],
        });
      }

      if (r.skillName) {
        const existing = projMap.get(r.name)!.skills.find((s) => s.name === r.skillName);
        if (!existing) {
          projMap.get(r.name)!.skills.push({
            name: r.skillName,
            category: r.skillCategory || undefined,
            difficulty: r.skillDifficulty || undefined,
          });
        }
      }

      if (r.developerName) {
        const existing = projMap.get(r.name)!.contributors.find(
          (c) => c.developerName === r.developerName
        );
        if (!existing) {
          projMap.get(r.name)!.contributors.push({
            developerName: r.developerName,
            roleOnProject: r.roleOnProject || 'Contributor',
          });
        }
      }
    }

    res.json({
      success: true,
      count: projMap.size,
      data: Array.from(projMap.values()),
    });
  } catch (error: any) {
    console.error('Error listing projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getGraphOverview(req: Request, res: Response): Promise<void> {
  try {
    const { domain } = req.query;

    if (domain && typeof domain === 'string' && domain.trim() !== '') {
      const domainId = domain.trim();

      const currentNodesCypher = `
        MATCH (s:Skill)-[:BELONGS_TO]->(d:Domain {id: $domainId})
        RETURN s.id AS id,
               s.name AS name,
               'Skill' AS type,
               s.category AS category,
               s.difficulty AS difficulty,
               d.color AS color;
      `;

      const connectedNodesCypher = `
        MATCH (s:Skill)-[:BELONGS_TO]->(d:Domain {id: $domainId})
        OPTIONAL MATCH (s)-[r:REQUIRES]->(s2:Skill)-[:BELONGS_TO]->(d2:Domain)
        OPTIONAL MATCH (s)-[rel:RELATED_TO]->(s3:Skill)-[:BELONGS_TO]->(d3:Domain)
        RETURN s2.id AS prereqId,
               s2.name AS prereqName,
               s2.category AS prereqCategory,
               s2.difficulty AS prereqDifficulty,
               d2.color AS prereqColor,
               s3.id AS relId,
               s3.name AS relName,
               s3.category AS relCategory,
               s3.difficulty AS relDifficulty,
               d3.color AS relColor;
      `;

      const edgesCypher = `
        MATCH (s:Skill)-[:BELONGS_TO]->(d:Domain {id: $domainId})
        OPTIONAL MATCH (s)-[r:REQUIRES]->(s2:Skill)
        OPTIONAL MATCH (s)-[rel:RELATED_TO]->(s3:Skill)
        RETURN s.id AS source, s2.id AS reqTarget, s3.id AS relTarget;
      `;

      const [currentRecords, connectedRecords, edgeRecords] = await Promise.all([
        runReadQuery<any>(currentNodesCypher, { domainId }),
        runReadQuery<any>(connectedNodesCypher, { domainId }),
        runReadQuery<any>(edgesCypher, { domainId }),
      ]);

      const nodeMap = new Map<string, any>();

      for (const n of currentRecords) {
        if (n.id) {
          nodeMap.set(n.id, n);
        }
      }

      for (const n of connectedRecords) {
        if (n.prereqId && !nodeMap.has(n.prereqId)) {
          nodeMap.set(n.prereqId, {
            id: n.prereqId,
            name: n.prereqName,
            type: 'Skill',
            category: n.prereqCategory,
            difficulty: n.prereqDifficulty,
            color: n.prereqColor,
          });
        }
        if (n.relId && !nodeMap.has(n.relId)) {
          nodeMap.set(n.relId, {
            id: n.relId,
            name: n.relName,
            type: 'Skill',
            category: n.relCategory,
            difficulty: n.relDifficulty,
            color: n.relColor,
          });
        }
      }

      const linkMap = new Map<string, any>();
      for (const e of edgeRecords) {
        if (e.source && e.reqTarget) {
          const key = `${e.source}->${e.reqTarget}:REQUIRES`;
          linkMap.set(key, {
            source: e.source,
            target: e.reqTarget,
            type: 'REQUIRES',
            label: 'Requires',
          });
        }
        if (e.source && e.relTarget) {
          const key = `${e.source}->${e.relTarget}:RELATED_TO`;
          linkMap.set(key, {
            source: e.source,
            target: e.relTarget,
            type: 'RELATED_TO',
            label: 'Related',
          });
        }
      }

      res.json({
        success: true,
        data: {
          nodes: Array.from(nodeMap.values()),
          links: Array.from(linkMap.values()),
        },
      });
      return;
    }

    const skillsCypher = `
      MATCH (s:Skill)
      OPTIONAL MATCH (s)-[:BELONGS_TO]->(d:Domain)
      RETURN s.id AS id,
             s.name AS name,
             'Skill' AS type,
             s.category AS category,
             s.difficulty AS difficulty,
             d.color AS color
      ORDER BY s.popularity DESC NULLS LAST
      LIMIT 20;
    `;

    const developersCypher = `
      MATCH (dev:Developer)
      RETURN dev.id AS id,
             dev.name AS name,
             'Developer' AS type,
             dev.title AS category
      ORDER BY dev.experienceYears DESC NULLS LAST
      LIMIT 10;
    `;

    const companiesCypher = `
      MATCH (c:Company)
      RETURN c.name AS id,
             c.name AS name,
             'Company' AS type,
             c.industry AS category
      LIMIT 6;
    `;

    const projectsCypher = `
      MATCH (p:Project)
      RETURN p.name AS id,
             p.name AS name,
             'Project' AS type,
             p.status AS category
      LIMIT 8;
    `;

    const reqEdgesCypher = `
      MATCH (s:Skill)-[r:REQUIRES]->(s2:Skill)
      RETURN s.id AS source, s2.id AS target, 'REQUIRES' AS type, 'Requires' AS label;
    `;

    const relEdgesCypher = `
      MATCH (s:Skill)-[r:RELATED_TO]->(s2:Skill)
      RETURN s.id AS source, s2.id AS target, 'RELATED_TO' AS type, 'Related' AS label;
    `;

    const devSkillEdgesCypher = `
      MATCH (dev:Developer)-[p:PROFICIENT_IN]->(s:Skill)
      WITH dev, s, p
      ORDER BY dev.experienceYears DESC NULLS LAST
      LIMIT 30
      RETURN dev.id AS source, s.id AS target, 'KNOWS_SKILL' AS type, p.level AS label;
    `;

    const devCompanyEdgesCypher = `
      MATCH (dev:Developer)-[:WORKS_AT]->(c:Company)
      WITH dev, c
      ORDER BY dev.experienceYears DESC NULLS LAST
      LIMIT 15
      RETURN dev.id AS source, c.name AS target, 'WORKS_AT' AS type, 'Works At' AS label;
    `;

    const devProjectEdgesCypher = `
      MATCH (dev:Developer)-[wo:WORKED_ON]->(p:Project)
      WITH dev, p, wo
      LIMIT 20
      RETURN dev.id AS source, p.name AS target, 'WORKED_ON' AS type, wo.role AS label;
    `;

    const projectSkillEdgesCypher = `
      MATCH (p:Project)-[:USES_SKILL]->(s:Skill)
      WITH p, s
      LIMIT 25
      RETURN p.name AS source, s.id AS target, 'USES_SKILL' AS type, 'Uses' AS label;
    `;

    const [
      skillNodes,
      devNodes,
      compNodes,
      projNodes,
      reqEdges,
      relEdges,
      devSkillEdges,
      devCompanyEdges,
      devProjectEdges,
      projectSkillEdges,
    ] = await Promise.all([
      runReadQuery<any>(skillsCypher),
      runReadQuery<any>(developersCypher),
      runReadQuery<any>(companiesCypher),
      runReadQuery<any>(projectsCypher),
      runReadQuery<any>(reqEdgesCypher),
      runReadQuery<any>(relEdgesCypher),
      runReadQuery<any>(devSkillEdgesCypher),
      runReadQuery<any>(devCompanyEdgesCypher),
      runReadQuery<any>(devProjectEdgesCypher),
      runReadQuery<any>(projectSkillEdgesCypher),
    ]);

    const nodeMap = new Map<string, any>();
    for (const n of [...skillNodes, ...devNodes, ...compNodes, ...projNodes]) {
      if (n.id && !nodeMap.has(n.id)) nodeMap.set(n.id, n);
    }

    const linkMap = new Map<string, any>();
    const allEdges = [
      ...reqEdges,
      ...relEdges,
      ...devSkillEdges,
      ...devCompanyEdges,
      ...devProjectEdges,
      ...projectSkillEdges,
    ];
    for (const e of allEdges) {
      if (e.source && e.target && nodeMap.has(e.source) && nodeMap.has(e.target)) {
        const key = `${e.source}->${e.target}:${e.type}`;
        if (!linkMap.has(key)) linkMap.set(key, e);
      }
    }

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodeMap.values()),
        links: Array.from(linkMap.values()),
      },
    });
  } catch (error: any) {
    console.error('Error fetching graph data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function listDomains(req: Request, res: Response): Promise<void> {
  try {
    const records = await runReadQuery(CYPHER_QUERIES.LIST_ALL_DOMAINS);
    res.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error listing domains:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
