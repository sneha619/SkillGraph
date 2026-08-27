/**
 * Centralized Cypher Queries for CognoDB Graph Database
 * All queries use parameterized values to guarantee safety against Cypher injection.
 * Free of unsupported Cypher aggregation functions like collect().
 */

export const CYPHER_QUERIES = {
  /**
   * QUERY 1: Basic Relationship Query
   * Fetches skill metadata, associated domain, and immediate required prerequisites
   */
  GET_SKILL_BY_ID: `
    MATCH (s:Skill {id: $skillId})
    OPTIONAL MATCH (s)-[:BELONGS_TO]->(d:Domain)
    OPTIONAL MATCH (s)-[r:REQUIRES]->(prereq:Skill)
    OPTIONAL MATCH (dependent:Skill)-[rd:REQUIRES]->(s)
    RETURN s.id AS id,
           s.name AS name,
           s.category AS category,
           s.difficulty AS difficulty,
           s.description AS description,
           s.popularity AS popularity,
           d.name AS domain,
           d.id AS domainId,
           d.color AS domainColor,
           prereq.id AS prereqId,
           prereq.name AS prereqName,
           prereq.category AS prereqCategory,
           prereq.difficulty AS prereqDifficulty,
           r.isMandatory AS prereqIsMandatory,
           dependent.id AS dependentId,
           dependent.name AS dependentName,
           dependent.category AS dependentCategory,
           dependent.difficulty AS dependentDifficulty;
  `,

  /**
   * QUERY 2: Multi-Hop (2+ Hop) Variable-Length Prerequisite Traversal
   * Traverses recursive [:REQUIRES*1..5] relationships to build a full prerequisite dependency hierarchy
   */
  GET_PREREQUISITE_TREE: `
    MATCH path = (target:Skill {id: $skillId})-[:REQUIRES*1..5]->(prereq:Skill)
    RETURN DISTINCT prereq.id AS id,
           prereq.name AS name,
           prereq.category AS category,
           prereq.difficulty AS difficulty,
           prereq.description AS description,
           length(path) AS depth
    ORDER BY depth ASC;
  `,

  /**
   * QUERY 3: Contextual Search & Neighborhood Extraction
   * Searches by name/category and fetches connected skills
   */
  SEARCH_SKILLS_WITH_NEIGHBORHOOD: `
    MATCH (s:Skill)
    WHERE toLower(s.name) CONTAINS toLower($searchTerm) 
       OR toLower(s.category) CONTAINS toLower($searchTerm)
       OR toLower(s.description) CONTAINS toLower($searchTerm)
    OPTIONAL MATCH (s)-[:BELONGS_TO]->(d:Domain)
    OPTIONAL MATCH (s)-[r:REQUIRES|RELATED_TO]-(neighbor:Skill)
    RETURN s.id AS id,
           s.name AS name,
           s.category AS category,
           s.difficulty AS difficulty,
           s.description AS description,
           s.popularity AS popularity,
           d.name AS domain,
           d.color AS domainColor,
           neighbor.id AS neighborId,
           neighbor.name AS neighborName,
           type(r) AS relationship
    LIMIT 50;
  `,

  /**
   * QUERY 4: Collaborative Recommendation Query (Tripartite Co-occurrence)
   * Recommends skills frequently co-occurring across developers with similar tech stacks
   */
  RECOMMEND_RELATED_SKILLS: `
    MATCH (target:Skill {id: $skillId})<-[:PROFICIENT_IN]-(d:Developer)-[:PROFICIENT_IN]->(rec:Skill)
    WHERE rec.id <> $skillId
      AND NOT (target)-[:REQUIRES]->(rec)
    WITH rec, count(DISTINCT d) AS coOccurrenceScore
    ORDER BY coOccurrenceScore DESC, rec.popularity DESC
    RETURN rec.id AS id,
           rec.name AS name,
           rec.category AS category,
           rec.difficulty AS difficulty,
           coOccurrenceScore,
           "Developers with " + $skillId + " frequently also master " + rec.name AS reason
    LIMIT 6;
  `,

  /**
   * List all skills with domain metadata
   */
  LIST_ALL_SKILLS: `
    MATCH (s:Skill)
    OPTIONAL MATCH (s)-[:BELONGS_TO]->(d:Domain)
    RETURN s.id AS id,
           s.name AS name,
           s.category AS category,
           s.difficulty AS difficulty,
           s.description AS description,
           s.popularity AS popularity,
           d.name AS domain,
           d.color AS domainColor
    ORDER BY s.category ASC, s.name ASC;
  `,

  /**
   * List all developers with acquired skills (flat rows for TypeScript grouping)
   */
  LIST_ALL_DEVELOPERS: `
    MATCH (dev:Developer)
    OPTIONAL MATCH (dev)-[p:PROFICIENT_IN]->(s:Skill)
    RETURN dev.id AS id,
           dev.name AS name,
           dev.title AS title,
           dev.experienceYears AS experienceYears,
           dev.avatar AS avatar,
           s.id AS skillId,
           s.name AS skillName,
           p.level AS skillLevel,
           p.years AS skillYears,
           s.category AS skillCategory,
           s.difficulty AS skillDifficulty
    ORDER BY dev.name ASC;
  `,

  /**
   * List all job roles with needed skills (flat rows for TypeScript grouping)
   */
  LIST_ALL_ROLES: `
    MATCH (r:JobRole)
    OPTIONAL MATCH (r)-[n:NEEDS_SKILL]->(s:Skill)
    RETURN r.id AS id,
           r.title AS title,
           r.department AS department,
           r.targetLevel AS targetLevel,
           s.id AS skillId,
           s.name AS skillName,
           n.importance AS importance,
           s.category AS skillCategory,
           s.difficulty AS skillDifficulty
    ORDER BY r.title ASC;
  `,

  /**
   * List all domains
   */
  LIST_ALL_DOMAINS: `
    MATCH (d:Domain)
    OPTIONAL MATCH (s:Skill)-[:BELONGS_TO]->(d)
    RETURN d.id AS id,
           d.name AS name,
           d.description AS description,
           d.color AS color,
           count(s) AS skillCount
    ORDER BY d.name ASC;
  `
};
