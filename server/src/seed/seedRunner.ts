import { getDriver, verifyConnection, runWriteQuery, closeDriver } from '../config/database';
import seedData from './seedData.json';

export async function runDatabaseSeed(): Promise<{ success: boolean; stats: Record<string, number>; message: string }> {
  console.log('🌱 Starting CognoDB Database Seeding Process...');

  const conn = await verifyConnection();
  if (!conn.connected) {
    throw new Error(`Cannot seed CognoDB: ${conn.error}`);
  }

  console.log(`Connected to CognoDB at ${conn.uri}`);

  // 1. Create unique constraints if they don't already exist
  console.log('🔒 Applying unique constraints...');
  const constraints = [
    'CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE',
    'CREATE CONSTRAINT domain_id_unique IF NOT EXISTS FOR (d:Domain) REQUIRE d.id IS UNIQUE',
    'CREATE CONSTRAINT dev_id_unique IF NOT EXISTS FOR (dev:Developer) REQUIRE dev.id IS UNIQUE',
    'CREATE CONSTRAINT role_id_unique IF NOT EXISTS FOR (r:JobRole) REQUIRE r.id IS UNIQUE',
  ];

  for (const query of constraints) {
    try {
      await runWriteQuery(query);
    } catch (e: any) {
      console.warn(`Constraint notice: ${e.message}`);
    }
  }

  // 2. Safely wipe existing demo nodes and relationships
  console.log('🧹 Clearing existing demo data...');
  await runWriteQuery(`
    MATCH (n)
    WHERE n:Skill OR n:Domain OR n:Developer OR n:JobRole
    DETACH DELETE n;
  `);

  // 3. Populate Domains
  console.log(`📁 Merging ${seedData.domains.length} Domains...`);
  for (const d of seedData.domains) {
    await runWriteQuery(
      `
      MERGE (domain:Domain {id: $id})
      SET domain.name = $name,
          domain.description = $description,
          domain.color = $color
    `,
      d
    );
  }

  // 4. Populate Skills and BELONGS_TO Domain relationships
  console.log(`⚡ Merging ${seedData.skills.length} Skills...`);
  for (const s of seedData.skills) {
    await runWriteQuery(
      `
      MERGE (skill:Skill {id: $id})
      SET skill.name = $name,
          skill.category = $category,
          skill.description = $description,
          skill.difficulty = $difficulty,
          skill.popularity = $popularity
      WITH skill
      MATCH (d:Domain {id: $domainId})
      MERGE (skill)-[:BELONGS_TO]->(d)
    `,
      s
    );
  }

  // 5. Populate Prerequisite REQUIRES relationships
  console.log(`🔗 Creating ${seedData.prerequisites.length} Prerequisite relationships...`);
  for (const p of seedData.prerequisites) {
    await runWriteQuery(
      `
      MATCH (source:Skill {id: $source})
      MATCH (target:Skill {id: $target})
      MERGE (source)-[r:REQUIRES]->(target)
      SET r.isMandatory = $isMandatory,
          r.weight = $weight
    `,
      p
    );
  }

  // 6. Populate RELATED_TO relationships
  console.log(`🔄 Creating ${seedData.related.length} Co-occurrence relationships...`);
  for (const r of seedData.related) {
    await runWriteQuery(
      `
      MATCH (source:Skill {id: $source})
      MATCH (target:Skill {id: $target})
      MERGE (source)-[rel:RELATED_TO]->(target)
      SET rel.strength = $strength
    `,
      r
    );
  }

  // 7. Populate Developers and PROFICIENT_IN relationships
  console.log(`👤 Merging ${seedData.developers.length} Developers...`);
  for (const dev of seedData.developers) {
    await runWriteQuery(
      `
      MERGE (d:Developer {id: $id})
      SET d.name = $name,
          d.title = $title,
          d.experienceYears = $experienceYears,
          d.avatar = $avatar
    `,
      {
        id: dev.id,
        name: dev.name,
        title: dev.title,
        experienceYears: dev.experienceYears,
        avatar: dev.avatar,
      }
    );

    for (const sk of dev.skills) {
      await runWriteQuery(
        `
        MATCH (d:Developer {id: $devId})
        MATCH (s:Skill {id: $skillId})
        MERGE (d)-[p:PROFICIENT_IN]->(s)
        SET p.level = $level,
            p.years = $years
      `,
        {
          devId: dev.id,
          skillId: sk.skillId,
          level: sk.level,
          years: sk.years,
        }
      );
    }
  }

  // 8. Populate Job Roles and NEEDS_SKILL relationships
  console.log(`💼 Merging ${seedData.jobRoles.length} Job Roles...`);
  for (const role of seedData.jobRoles) {
    await runWriteQuery(
      `
      MERGE (r:JobRole {id: $id})
      SET r.title = $title,
          r.department = $department,
          r.targetLevel = $targetLevel
    `,
      {
        id: role.id,
        title: role.title,
        department: role.department,
        targetLevel: role.targetLevel,
      }
    );

    for (const req of role.requiredSkills) {
      await runWriteQuery(
        `
        MATCH (r:JobRole {id: $roleId})
        MATCH (s:Skill {id: $skillId})
        MERGE (r)-[n:NEEDS_SKILL]->(s)
        SET n.importance = $importance
      `,
        {
          roleId: role.id,
          skillId: req.skillId,
          importance: req.importance,
        }
      );
    }
  }

  const stats = {
    domains: seedData.domains.length,
    skills: seedData.skills.length,
    prerequisites: seedData.prerequisites.length,
    relatedLinks: seedData.related.length,
    developers: seedData.developers.length,
    jobRoles: seedData.jobRoles.length,
  };

  console.log('✅ CognoDB Seed Completed Successfully!');
  console.table(stats);

  return {
    success: true,
    stats,
    message: 'CognoDB seeded successfully with full developer skill graph.',
  };
}

// Standalone execution support
if (require.main === module) {
  runDatabaseSeed()
    .then(async (res) => {
      console.log('Seeding finished:', res.message);
      await closeDriver();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Seeding failed:', err.message);
      await closeDriver();
      process.exit(1);
    });
}

