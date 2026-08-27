import { Request, Response } from 'express';
import { runReadQuery } from '../config/database';
import { CYPHER_QUERIES } from '../queries/cypherQueries';

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
             d.color AS color;
    `;

    const reqEdgesCypher = `
      MATCH (s:Skill)-[r:REQUIRES]->(s2:Skill)
      RETURN s.id AS source, s2.id AS target, 'REQUIRES' AS type, 'Requires' AS label;
    `;

    const relEdgesCypher = `
      MATCH (s:Skill)-[r:RELATED_TO]->(s3:Skill)
      RETURN s.id AS source, s3.id AS target, 'RELATED_TO' AS type, 'Related' AS label;
    `;

    const [nodes, reqEdges, relEdges] = await Promise.all([
      runReadQuery<any>(skillsCypher),
      runReadQuery<any>(reqEdgesCypher),
      runReadQuery<any>(relEdgesCypher),
    ]);

    const linkMap = new Map<string, any>();
    for (const e of [...reqEdges, ...relEdges]) {
      if (e.source && e.target) {
        const key = `${e.source}->${e.target}:${e.type}`;
        linkMap.set(key, e);
      }
    }

    res.json({
      success: true,
      data: {
        nodes,
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
