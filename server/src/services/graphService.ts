import { runReadQuery } from '../config/database';
import {
  DeveloperNode,
  SkillNode,
  SearchResult,
  RelatedDeveloper,
  DeveloperSkillTraversal,
} from '../types';

export class GraphService {
  /**
   * QUERY 1: Developer Full Profile Lookup
   * Traverses Developer -> Company, Role, Skills, and Projects -> Technologies
   * Without using collect() to maintain CognoDB Cypher compatibility.
   */
  public static async getDeveloperByName(name: string): Promise<DeveloperNode | null> {
    const devQuery = `
      MATCH (d:Developer)
      WHERE toLower(d.name) = toLower($name)
      OPTIONAL MATCH (d)-[:WORKS_AT]->(c:Company)
      OPTIONAL MATCH (d)-[:HAS_ROLE]->(r:Role)
      RETURN d.name AS name,
             d.email AS email,
             d.experienceYears AS experienceYears,
             d.bio AS bio,
             c.name AS company,
             r.title AS role
      LIMIT 1;
    `;

    const skillsQuery = `
      MATCH (d:Developer)
      WHERE toLower(d.name) = toLower($name)
      MATCH (d)-[ks:KNOWS_SKILL]->(s:Skill)
      RETURN s.name AS name,
             s.category AS category,
             ks.proficiency AS proficiency,
             ks.yearsOfExperience AS yearsOfExperience;
    `;

    const projectsQuery = `
      MATCH (d:Developer)
      WHERE toLower(d.name) = toLower($name)
      MATCH (d)-[wo:WORKED_ON]->(p:Project)
      OPTIONAL MATCH (p)-[:USES_SKILL]->(ps:Skill)
      RETURN p.name AS name,
             p.description AS description,
             wo.role AS roleOnProject,
             ps.name AS skillUsed;
    `;

    const [devRecords, skillRecords, projectRecords] = await Promise.all([
      runReadQuery<any>(devQuery, { name }),
      runReadQuery<any>(skillsQuery, { name }),
      runReadQuery<any>(projectsQuery, { name }),
    ]);

    if (devRecords.length === 0) {
      return null;
    }

    const dev = devRecords[0];

    // Deduplicate and map skills
    const skillsMap = new Map<string, {
      name: string;
      category?: string;
      proficiency?: 'Beginner' | 'Intermediate' | 'Expert';
      yearsOfExperience?: number;
    }>();

    for (const s of skillRecords) {
      if (s.name && !skillsMap.has(s.name)) {
        skillsMap.set(s.name, {
          name: s.name,
          category: s.category || undefined,
          proficiency: s.proficiency || undefined,
          yearsOfExperience: s.yearsOfExperience !== null && s.yearsOfExperience !== undefined ? s.yearsOfExperience : undefined,
        });
      }
    }

    // Group projects and deduplicate skillsUsed
    const projectsMap = new Map<string, {
      name: string;
      description?: string;
      roleOnProject?: string;
      skillsUsed: Set<string>;
    }>();

    for (const p of projectRecords) {
      if (!p.name) continue;
      if (!projectsMap.has(p.name)) {
        projectsMap.set(p.name, {
          name: p.name,
          description: p.description || undefined,
          roleOnProject: p.roleOnProject || undefined,
          skillsUsed: new Set<string>(),
        });
      }
      if (p.skillUsed) {
        projectsMap.get(p.name)!.skillsUsed.add(p.skillUsed);
      }
    }

    const projects = Array.from(projectsMap.values()).map((p) => ({
      name: p.name,
      description: p.description,
      roleOnProject: p.roleOnProject,
      skillsUsed: Array.from(p.skillsUsed),
    }));

    return {
      name: dev.name,
      email: dev.email || undefined,
      experienceYears: dev.experienceYears !== null && dev.experienceYears !== undefined ? dev.experienceYears : undefined,
      bio: dev.bio || undefined,
      company: dev.company || undefined,
      role: dev.role || undefined,
      skills: Array.from(skillsMap.values()),
      projects,
    };
  }

  /**
   * QUERY 2: Skill Full Profile Lookup
   * Traverses Skill -> Related Skills, Prerequisites, and computes usage counts
   * Without using collect() to maintain CognoDB Cypher compatibility.
   */
  public static async getSkillByName(name: string): Promise<SkillNode | null> {
    const skillQuery = `
      MATCH (s:Skill)
      WHERE toLower(s.name) = toLower($name)
      RETURN s.name AS name,
             s.category AS category,
             s.difficulty AS difficulty,
             s.description AS description
      LIMIT 1;
    `;

    const relatedQuery = `
      MATCH (s:Skill)
      WHERE toLower(s.name) = toLower($name)
      MATCH (s)-[rel:RELATED_TO]-(related:Skill)
      RETURN DISTINCT related.name AS name,
             related.category AS category,
             rel.strength AS strength;
    `;

    const prereqsQuery = `
      MATCH (s:Skill)
      WHERE toLower(s.name) = toLower($name)
      MATCH (s)-[req:REQUIRES]->(prereq:Skill)
      RETURN DISTINCT prereq.name AS name;
    `;

    const devCountQuery = `
      MATCH (d:Developer)-[:KNOWS_SKILL]->(s:Skill)
      WHERE toLower(s.name) = toLower($name)
      RETURN DISTINCT d.name AS devName;
    `;

    const projCountQuery = `
      MATCH (p:Project)-[:USES_SKILL]->(s:Skill)
      WHERE toLower(s.name) = toLower($name)
      RETURN DISTINCT p.name AS projName;
    `;

    const [skillRecords, relatedRecords, prereqRecords, devRecords, projRecords] = await Promise.all([
      runReadQuery<any>(skillQuery, { name }),
      runReadQuery<any>(relatedQuery, { name }),
      runReadQuery<any>(prereqsQuery, { name }),
      runReadQuery<any>(devCountQuery, { name }),
      runReadQuery<any>(projCountQuery, { name }),
    ]);

    if (skillRecords.length === 0) {
      return null;
    }

    const s = skillRecords[0];

    const relatedSkillsMap = new Map<string, { name: string; category: string; strength?: number }>();
    for (const r of relatedRecords) {
      if (r.name && !relatedSkillsMap.has(r.name)) {
        relatedSkillsMap.set(r.name, {
          name: r.name,
          category: r.category,
          strength: r.strength !== null && r.strength !== undefined ? r.strength : undefined,
        });
      }
    }

    const directPrerequisites = Array.from(
      new Set(prereqRecords.map((p) => p.name).filter(Boolean))
    );

    return {
      name: s.name,
      category: s.category,
      difficulty: s.difficulty || undefined,
      description: s.description || undefined,
      relatedSkills: Array.from(relatedSkillsMap.values()),
      directPrerequisites,
      developersCount: devRecords.length,
      projectsCount: projRecords.length,
    };
  }

  /**
   * QUERY 3: Related Developers via Shared Skills
   * Tripartite co-occurrence traversal: (:Developer)-[:KNOWS_SKILL]->(:Skill)<-[:KNOWS_SKILL]-(:Developer)
   * Calculates shared skills list and Jaccard similarity index in TypeScript.
   */
  public static async getRelatedDevelopers(name: string): Promise<RelatedDeveloper[]> {
    // 1. Get target developer's skills
    const targetSkillsQuery = `
      MATCH (target:Developer)-[:KNOWS_SKILL]->(s:Skill)
      WHERE toLower(target.name) = toLower($name)
      RETURN DISTINCT s.name AS skillName;
    `;

    const targetRecords = await runReadQuery<{ skillName: string }>(targetSkillsQuery, { name });
    const targetSkillNames = new Set(targetRecords.map((r) => r.skillName).filter(Boolean));
    const targetSkillCount = targetSkillNames.size;

    if (targetSkillCount === 0) {
      return [];
    }

    // 2. Get all other developers and all skills they know
    const otherDevsQuery = `
      MATCH (other:Developer)-[:KNOWS_SKILL]->(s:Skill)
      WHERE toLower(other.name) <> toLower($name)
      OPTIONAL MATCH (other)-[:WORKS_AT]->(c:Company)
      OPTIONAL MATCH (other)-[:HAS_ROLE]->(r:Role)
      RETURN other.name AS developerName,
             c.name AS company,
             r.title AS role,
             s.name AS skillName;
    `;

    const otherRecords = await runReadQuery<{
      developerName: string;
      company: string | null;
      role: string | null;
      skillName: string;
    }>(otherDevsQuery, { name });

    // 3. Group by other developer and calculate Jaccard similarity
    interface DevData {
      developerName: string;
      role: string;
      company: string;
      allSkills: Set<string>;
      sharedSkills: Set<string>;
    }

    const devMap = new Map<string, DevData>();

    for (const row of otherRecords) {
      if (!row.developerName) continue;
      if (!devMap.has(row.developerName)) {
        devMap.set(row.developerName, {
          developerName: row.developerName,
          role: row.role || 'Developer',
          company: row.company || 'Independent',
          allSkills: new Set<string>(),
          sharedSkills: new Set<string>(),
        });
      }

      const devData = devMap.get(row.developerName)!;
      if (row.skillName) {
        devData.allSkills.add(row.skillName);
        if (targetSkillNames.has(row.skillName)) {
          devData.sharedSkills.add(row.skillName);
        }
      }
    }

    const related: RelatedDeveloper[] = [];

    for (const dev of devMap.values()) {
      if (dev.sharedSkills.size === 0) continue;

      const sharedSkills = Array.from(dev.sharedSkills);
      const sharedSkillsCount = sharedSkills.length;
      const otherSkillCount = dev.allSkills.size;
      const union = targetSkillCount + otherSkillCount - sharedSkillsCount;
      const jaccardSimilarity = union > 0 ? Math.round((sharedSkillsCount / union) * 100) / 100 : 0;

      related.push({
        developerName: dev.developerName,
        role: dev.role,
        company: dev.company,
        sharedSkills,
        sharedSkillsCount,
        jaccardSimilarity,
      });
    }

    related.sort((a, b) => {
      if (b.sharedSkillsCount !== a.sharedSkillsCount) {
        return b.sharedSkillsCount - a.sharedSkillsCount;
      }
      return b.jaccardSimilarity - a.jaccardSimilarity;
    });

    return related.slice(0, 10);
  }

  /**
   * QUERY 4: Developers Who Know or Have Used a Specific Skill
   * Traverses direct proficiency (KNOWS_SKILL) and project applications (WORKED_ON -> Project -> USES_SKILL)
   */
  public static async getDevelopersBySkill(skillName: string): Promise<any[]> {
    const cypher = `
      MATCH (s:Skill)
      WHERE toLower(s.name) = toLower($skillName)
      
      MATCH (d:Developer)
      OPTIONAL MATCH (d)-[ks:KNOWS_SKILL]->(s)
      OPTIONAL MATCH (d)-[wo:WORKED_ON]->(p:Project)-[:USES_SKILL]->(s)
      WHERE ks IS NOT NULL OR p IS NOT NULL
      
      OPTIONAL MATCH (d)-[:WORKS_AT]->(c:Company)
      OPTIONAL MATCH (d)-[:HAS_ROLE]->(r:Role)
      
      RETURN d.name AS name,
             d.email AS email,
             d.experienceYears AS experienceYears,
             c.name AS company,
             r.title AS role,
             ks.proficiency AS proficiencyLevel,
             ks.yearsOfExperience AS yearsWithSkill,
             p.name AS projectName
      ORDER BY d.experienceYears DESC;
    `;

    const records = await runReadQuery<any>(cypher, { skillName });

    interface SkillDevData {
      name: string;
      email?: string;
      experienceYears?: number;
      company: string;
      role: string;
      proficiencyLevel?: string;
      yearsWithSkill?: number;
      projectsUsedIn: Set<string>;
    }

    const devMap = new Map<string, SkillDevData>();

    for (const r of records) {
      if (!r.name) continue;
      if (!devMap.has(r.name)) {
        devMap.set(r.name, {
          name: r.name,
          email: r.email || undefined,
          experienceYears: r.experienceYears !== null && r.experienceYears !== undefined ? r.experienceYears : undefined,
          company: r.company || 'Independent',
          role: r.role || 'Engineer',
          proficiencyLevel: r.proficiencyLevel || undefined,
          yearsWithSkill: r.yearsWithSkill !== null && r.yearsWithSkill !== undefined ? r.yearsWithSkill : undefined,
          projectsUsedIn: new Set<string>(),
        });
      }

      if (r.projectName) {
        devMap.get(r.name)!.projectsUsedIn.add(r.projectName);
      }
    }

    const result = Array.from(devMap.values()).map((d) => ({
      name: d.name,
      email: d.email,
      experienceYears: d.experienceYears,
      company: d.company,
      role: d.role,
      proficiencyLevel: d.proficiencyLevel,
      yearsWithSkill: d.yearsWithSkill,
      projectsUsedIn: Array.from(d.projectsUsedIn),
    }));

    result.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));

    return result;
  }

  /**
   * QUERY 5: Global Fuzzy Search Across All Graph Entities
   * Case-insensitive parameter matching across Developers, Skills, Projects, and Companies
   */
  public static async searchAll(searchTerm: string): Promise<SearchResult[]> {
    const cypher = `
      CALL {
        // 1. Search Developers
        MATCH (d:Developer)
        WHERE toLower(d.name) CONTAINS toLower($q) OR toLower(d.bio) CONTAINS toLower($q)
        OPTIONAL MATCH (d)-[:HAS_ROLE]->(r:Role)
        OPTIONAL MATCH (d)-[:WORKS_AT]->(c:Company)
        RETURN 'Developer' AS type,
               d.name AS name,
               coalesce(r.title, 'Engineer') + ' at ' + coalesce(c.name, 'Tech Co') AS subtitle,
               { email: d.email, experienceYears: d.experienceYears } AS details
        LIMIT 5
        
        UNION ALL
        
        // 2. Search Skills
        MATCH (s:Skill)
        WHERE toLower(s.name) CONTAINS toLower($q) OR toLower(s.category) CONTAINS toLower($q) OR toLower(s.description) CONTAINS toLower($q)
        RETURN 'Skill' AS type,
        s.name AS name,
               s.category + ' (' + s.difficulty + ')' AS subtitle,
               { description: s.description, difficulty: s.difficulty, category: s.category } AS details
        LIMIT 5
        
        UNION ALL
        
        // 3. Search Projects
        MATCH (p:Project)
        WHERE toLower(p.name) CONTAINS toLower($q) OR toLower(p.description) CONTAINS toLower($q)
        RETURN 'Project' AS type,
               p.name AS name,
               coalesce(p.status, 'Active') + ' Project' AS subtitle,
               { description: p.description, status: p.status } AS details
        LIMIT 5
        
        UNION ALL
        
        // 4. Search Companies
        MATCH (c:Company)
        WHERE toLower(c.name) CONTAINS toLower($q) OR toLower(c.industry) CONTAINS toLower($q)
        RETURN 'Company' AS type,
               c.name AS name,
               coalesce(c.industry, 'Technology') + ' • ' + coalesce(c.location, 'Global') AS subtitle,
               { industry: c.industry, location: c.location } AS details
        LIMIT 5
      }
      RETURN type, name, subtitle, details
      ORDER BY type, name;
    `;

    return runReadQuery<SearchResult>(cypher, { q: searchTerm });
  }

  /**
   * QUERY 6: Multi-Hop Traversal: Developer -> Project -> Skill -> Prerequisite Tree
   * Demonstrates graph-native power: discovers all tech stacks applied by a developer on projects
   * and resolves transitive prerequisite dependencies up to 3 hops deep.
   */
  public static async getDeveloperProjectSkillsTraversal(name: string): Promise<DeveloperSkillTraversal[]> {
    const cypher = `
      MATCH (d:Developer)
      WHERE toLower(d.name) = toLower($name)
      MATCH (d)-[wo:WORKED_ON]->(p:Project)-[:USES_SKILL]->(s:Skill)
      OPTIONAL MATCH (s)-[:REQUIRES*1..3]->(prereq:Skill)
      RETURN d.name AS developerName,
             p.name AS projectName,
             wo.role AS roleOnProject,
             s.name AS skillName,
             s.category AS skillCategory,
             s.difficulty AS skillDifficulty,
             prereq.name AS prereqName;
    `;

    const records = await runReadQuery<any>(cypher, { name });

    if (records.length === 0) {
      return [];
    }

    const developerName = records[0].developerName;

    // Group by projectName -> skillName -> prerequisites
    interface SkillInfo {
      name: string;
      category: string;
      difficulty: string;
      prerequisites: Set<string>;
    }

    interface ProjectGroup {
      name: string;
      roleOnProject: string;
      skills: Map<string, SkillInfo>;
    }

    const projectMap = new Map<string, ProjectGroup>();

    for (const r of records) {
      if (!r.projectName) continue;
      if (!projectMap.has(r.projectName)) {
        projectMap.set(r.projectName, {
          name: r.projectName,
          roleOnProject: r.roleOnProject || 'Contributor',
          skills: new Map<string, SkillInfo>(),
        });
      }

      const proj = projectMap.get(r.projectName)!;
      if (r.skillName) {
        if (!proj.skills.has(r.skillName)) {
          proj.skills.set(r.skillName, {
            name: r.skillName,
            category: r.skillCategory || 'Technology',
            difficulty: r.skillDifficulty || 'Intermediate',
            prerequisites: new Set<string>(),
          });
        }

        if (r.prereqName) {
          proj.skills.get(r.skillName)!.prerequisites.add(r.prereqName);
        }
      }
    }

    const traversals: DeveloperSkillTraversal[] = [];

    for (const proj of projectMap.values()) {
      traversals.push({
        developerName,
        project: {
          name: proj.name,
          roleOnProject: proj.roleOnProject,
        },
        skillsUsed: Array.from(proj.skills.values()).map((s) => ({
          name: s.name,
          category: s.category,
          difficulty: s.difficulty,
          prerequisites: Array.from(s.prerequisites),
        })),
      });
    }

    return traversals;
  }
}
