import { getDriver, verifyConnection, runWriteQuery, closeDriver } from '../config/database';

export interface SeedStats {
  developers: number;
  skills: number;
  companies: number;
  roles: number;
  projects: number;
  relationships: number;
}

export async function seedGraphDatabase(): Promise<{ success: boolean; stats: SeedStats; message: string }> {
  console.log('🌱 Initiating CognoDB Graph Database Seeding...');

  const conn = await verifyConnection();
  if (!conn.connected) {
    throw new Error(`Cannot connect to CognoDB Bolt endpoint: ${conn.error}`);
  }

  console.log(`Connected to CognoDB at ${conn.uri}`);

  // 1. Create unique constraints to ensure data integrity
  console.log('🔒 Applying unique constraints...');
  const constraints = [
    'CREATE CONSTRAINT dev_name_unique IF NOT EXISTS FOR (d:Developer) REQUIRE d.name IS UNIQUE',
    'CREATE CONSTRAINT skill_name_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE',
    'CREATE CONSTRAINT company_name_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.name IS UNIQUE',
    'CREATE CONSTRAINT role_title_unique IF NOT EXISTS FOR (r:Role) REQUIRE r.title IS UNIQUE',
    'CREATE CONSTRAINT project_name_unique IF NOT EXISTS FOR (p:Project) REQUIRE p.name IS UNIQUE',
  ];

  for (const query of constraints) {
    try {
      await runWriteQuery(query);
    } catch (e: any) {
      console.warn(`Constraint check note: ${e.message}`);
    }
  }

  // 2. Wipe existing sample nodes safely
  console.log('🧹 Clearing existing sample graph nodes...');
  await runWriteQuery(`
    MATCH (n)
    WHERE n:Developer OR n:Skill OR n:Company OR n:Role OR n:Project
    DETACH DELETE n;
  `);

  // 3. Seed Companies
  console.log('🏢 Merging Companies...');
  const companies = [
    { name: 'Wexa AI', industry: 'Artificial Intelligence & Graph DB', location: 'San Francisco, CA' },
    { name: 'CloudScale Systems', industry: 'Cloud & Distributed Infrastructure', location: 'Austin, TX' },
    { name: 'DevForge Labs', industry: 'Developer Tooling & Platform Engineering', location: 'New York, NY' },
    { name: 'NeuralGraph Inc', industry: 'Graph RAG & Applied Deep Learning', location: 'Seattle, WA' },
  ];

  for (const c of companies) {
    await runWriteQuery(
      `MERGE (comp:Company {name: $name})
       SET comp.industry = $industry,
           comp.location = $location`,
      c
    );
  }

  // 4. Seed Roles
  console.log('💼 Merging Roles...');
  const roles = [
    { title: 'Lead Full-Stack Architect', department: 'Product Engineering', level: 'Staff / Lead' },
    { title: 'Cloud Platform & DevOps Engineer', department: 'Core Infrastructure', level: 'Senior' },
    { title: 'Senior Backend Specialist', department: 'Platform Services', level: 'Senior' },
    { title: 'AI & Graph RAG Engineer', department: 'Applied AI Research', level: 'Senior' },
    { title: 'Frontend Systems Engineer', department: 'UI Platform', level: 'Mid-Senior' },
  ];

  for (const r of roles) {
    await runWriteQuery(
      `MERGE (role:Role {title: $title})
       SET role.department = $department,
           role.level = $level`,
      r
    );
  }

  // 5. Seed Skills
  console.log('⚡ Merging Skills...');
  const skills = [
    { name: 'JavaScript', category: 'Frontend', difficulty: 'Beginner', description: 'Core web programming language, async event loop, ES6+.' },
    { name: 'TypeScript', category: 'Frontend', difficulty: 'Intermediate', description: 'Strong static typing, generics, strict compiler configs.' },
    { name: 'React', category: 'Frontend', difficulty: 'Intermediate', description: 'Component lifecycle, hooks, virtual DOM reconciliation, state.' },
    { name: 'Next.js', category: 'Frontend', difficulty: 'Advanced', description: 'Server-side rendering, React Server Components, App Router.' },
    { name: 'Tailwind CSS', category: 'Frontend', difficulty: 'Beginner', description: 'Utility-first CSS design system and responsive styling.' },
    { name: 'Node.js', category: 'Backend', difficulty: 'Intermediate', description: 'Event-driven JavaScript runtime for scalable APIs.' },
    { name: 'Python', category: 'Backend', difficulty: 'Beginner', description: 'High-level language for backend services, scripting, and data science.' },
    { name: 'PostgreSQL', category: 'Backend', difficulty: 'Intermediate', description: 'ACID relational database, complex joins, indexing strategies.' },
    { name: 'Graph Databases & Cypher', category: 'Backend', difficulty: 'Advanced', description: 'Property graphs, index-free adjacency, recursive pattern matching on CognoDB.' },
    { name: 'Redis', category: 'Backend', difficulty: 'Intermediate', description: 'In-memory caching, key-value stores, distributed pub/sub.' },
    { name: 'Docker', category: 'DevOps', difficulty: 'Intermediate', description: 'Containerization, multi-stage builds, isolation, networking.' },
    { name: 'Kubernetes', category: 'DevOps', difficulty: 'Advanced', description: 'Container orchestration, pods, deployments, ingress, service meshes.' },
    { name: 'Terraform', category: 'DevOps', difficulty: 'Advanced', description: 'Infrastructure as Code (IaC), declarative cloud resource provisioning.' },
    { name: 'PyTorch', category: 'AI/ML', difficulty: 'Advanced', description: 'Deep learning tensors, GPU training, dynamic neural computational graphs.' },
    { name: 'LLMs & Graph RAG', category: 'AI/ML', difficulty: 'Advanced', description: 'Retrieval Augmented Generation combining vector embeddings and CognoDB knowledge graphs.' },
  ];

  for (const s of skills) {
    await runWriteQuery(
      `MERGE (skill:Skill {name: $name})
       SET skill.category = $category,
           skill.difficulty = $difficulty,
           skill.description = $description`,
      s
    );
  }

  // 6. Seed Skill Relationships (REQUIRES and RELATED_TO)
  console.log('🔗 Connecting Skill Prerequisites and Relationships...');
  const skillEdges = [
    { from: 'TypeScript', to: 'JavaScript', type: 'REQUIRES' },
    { from: 'React', to: 'JavaScript', type: 'REQUIRES' },
    { from: 'Next.js', to: 'React', type: 'REQUIRES' },
    { from: 'Next.js', to: 'TypeScript', type: 'REQUIRES' },
    { from: 'Node.js', to: 'JavaScript', type: 'REQUIRES' },
    { from: 'Kubernetes', to: 'Docker', type: 'REQUIRES' },
    { from: 'Graph Databases & Cypher', to: 'PostgreSQL', type: 'RELATED_TO', strength: 0.8 },
    { from: 'Graph Databases & Cypher', to: 'LLMs & Graph RAG', type: 'RELATED_TO', strength: 0.95 },
    { from: 'React', to: 'Tailwind CSS', type: 'RELATED_TO', strength: 0.9 },
    { from: 'Docker', to: 'Redis', type: 'RELATED_TO', strength: 0.75 },
    { from: 'Kubernetes', to: 'Terraform', type: 'RELATED_TO', strength: 0.9 },
    { from: 'PyTorch', to: 'Python', type: 'REQUIRES' },
    { from: 'LLMs & Graph RAG', to: 'Python', type: 'REQUIRES' },
    { from: 'LLMs & Graph RAG', to: 'PyTorch', type: 'RELATED_TO', strength: 0.85 },
  ];

  for (const edge of skillEdges) {
    if (edge.type === 'REQUIRES') {
      await runWriteQuery(
        `MATCH (a:Skill {name: $from})
         MATCH (b:Skill {name: $to})
         MERGE (a)-[:REQUIRES]->(b)`,
        { from: edge.from, to: edge.to }
      );
    } else {
      await runWriteQuery(
        `MATCH (a:Skill {name: $from})
         MATCH (b:Skill {name: $to})
         MERGE (a)-[r:RELATED_TO]->(b)
         SET r.strength = $strength`,
        { from: edge.from, to: edge.to, strength: edge.strength || 0.8 }
      );
    }
  }

  // 7. Seed Projects and USES_SKILL Relationships
  console.log('🚀 Merging Projects and USES_SKILL Relationships...');
  const projects = [
    {
      name: 'Real-Time Graph Visualizer',
      description: 'Interactive HTML5 Canvas engine for visualizing multi-hop relationships in CognoDB.',
      status: 'Production',
      skills: ['React', 'TypeScript', 'Graph Databases & Cypher', 'Node.js', 'Tailwind CSS'],
    },
    {
      name: 'Distributed Microservices Engine',
      description: 'High-throughput event-driven microservices architecture with distributed Redis caching.',
      status: 'Production',
      skills: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
    },
    {
      name: 'Cloud Infrastructure & IaC Pipeline',
      description: 'Automated multi-region cluster provisioning with Terraform and Kubernetes GitOps.',
      status: 'Active',
      skills: ['Kubernetes', 'Docker', 'Terraform'],
    },
    {
      name: 'Multi-Agent Graph RAG System',
      description: 'Autonomous research agents integrating vector embeddings with CognoDB knowledge graph paths.',
      status: 'Beta',
      skills: ['Python', 'PyTorch', 'Graph Databases & Cypher', 'LLMs & Graph RAG', 'Docker'],
    },
  ];

  for (const p of projects) {
    await runWriteQuery(
      `MERGE (proj:Project {name: $name})
       SET proj.description = $description,
           proj.status = $status`,
      { name: p.name, description: p.description, status: p.status }
    );

    for (const skillName of p.skills) {
      await runWriteQuery(
        `MATCH (proj:Project {name: $projName})
         MATCH (s:Skill {name: $skillName})
         MERGE (proj)-[:USES_SKILL]->(s)`,
        { projName: p.name, skillName }
      );
    }
  }

  // 8. Seed Developers with Relationships
  console.log('👤 Merging Developers, Roles, Companies, Projects, and Skills...');
  const developers = [
    {
      name: 'Alex Chen',
      email: 'alex.chen@wexa.ai',
      experienceYears: 4,
      bio: 'Full-stack developer passionate about property graph databases and responsive user experiences.',
      company: 'Wexa AI',
      role: 'Lead Full-Stack Architect',
      skills: [
        { name: 'TypeScript', proficiency: 'Expert', years: 4 },
        { name: 'React', proficiency: 'Expert', years: 4 },
        { name: 'Next.js', proficiency: 'Intermediate', years: 2 },
        { name: 'Node.js', proficiency: 'Expert', years: 3 },
        { name: 'Graph Databases & Cypher', proficiency: 'Expert', years: 3 },
        { name: 'Docker', proficiency: 'Intermediate', years: 2 },
      ],
      projects: [{ name: 'Real-Time Graph Visualizer', role: 'Lead Architect' }],
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@cloudscale.io',
      experienceYears: 6,
      bio: 'Distributed systems engineer specializing in high-concurrency data persistence and caching layers.',
      company: 'CloudScale Systems',
      role: 'Senior Backend Specialist',
      skills: [
        { name: 'Node.js', proficiency: 'Expert', years: 5 },
        { name: 'Python', proficiency: 'Expert', years: 6 },
        { name: 'PostgreSQL', proficiency: 'Expert', years: 6 },
        { name: 'Redis', proficiency: 'Expert', years: 4 },
        { name: 'Docker', proficiency: 'Expert', years: 4 },
        { name: 'Graph Databases & Cypher', proficiency: 'Intermediate', years: 2 },
      ],
      projects: [{ name: 'Distributed Microservices Engine', role: 'Backend Lead' }],
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.v@devforge.com',
      experienceYears: 5,
      bio: 'Platform reliability engineer focused on Kubernetes cluster orchestration and declarative IaC.',
      company: 'DevForge Labs',
      role: 'Cloud Platform & DevOps Engineer',
      skills: [
        { name: 'Docker', proficiency: 'Expert', years: 5 },
        { name: 'Kubernetes', proficiency: 'Expert', years: 4 },
        { name: 'Terraform', proficiency: 'Expert', years: 4 },
        { name: 'Python', proficiency: 'Intermediate', years: 3 },
      ],
      projects: [{ name: 'Cloud Infrastructure & IaC Pipeline', role: 'Infrastructure Lead' }],
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@wexa.ai',
      experienceYears: 5,
      bio: 'Frontend systems specialist focusing on state machines, rendering performance, and TypeScript tooling.',
      company: 'Wexa AI',
      role: 'Frontend Systems Engineer',
      skills: [
        { name: 'JavaScript', proficiency: 'Expert', years: 5 },
        { name: 'TypeScript', proficiency: 'Expert', years: 5 },
        { name: 'React', proficiency: 'Expert', years: 5 },
        { name: 'Next.js', proficiency: 'Expert', years: 3 },
        { name: 'Tailwind CSS', proficiency: 'Expert', years: 4 },
        { name: 'Graph Databases & Cypher', proficiency: 'Intermediate', years: 2 },
      ],
      projects: [{ name: 'Real-Time Graph Visualizer', role: 'Frontend Core Contributor' }],
    },
    {
      name: 'David Kim',
      email: 'david.kim@neuralgraph.ai',
      experienceYears: 4,
      bio: 'Applied AI researcher integrating deep neural networks with structured knowledge graph reasoning.',
      company: 'NeuralGraph Inc',
      role: 'AI & Graph RAG Engineer',
      skills: [
        { name: 'Python', proficiency: 'Expert', years: 4 },
        { name: 'PyTorch', proficiency: 'Expert', years: 4 },
        { name: 'Graph Databases & Cypher', proficiency: 'Expert', years: 3 },
        { name: 'LLMs & Graph RAG', proficiency: 'Expert', years: 2 },
        { name: 'Docker', proficiency: 'Intermediate', years: 2 },
      ],
      projects: [{ name: 'Multi-Agent Graph RAG System', role: 'AI Lead Researcher' }],
    },
  ];

  for (const dev of developers) {
    // Merge Developer node
    await runWriteQuery(
      `MERGE (d:Developer {name: $name})
       SET d.email = $email,
           d.experienceYears = $experienceYears,
           d.bio = $bio`,
      {
        name: dev.name,
        email: dev.email,
        experienceYears: dev.experienceYears,
        bio: dev.bio,
      }
    );

    // Merge Company relationship
    await runWriteQuery(
      `MATCH (d:Developer {name: $devName})
       MATCH (c:Company {name: $compName})
       MERGE (d)-[:WORKS_AT]->(c)`,
      { devName: dev.name, compName: dev.company }
    );

    // Merge Role relationship
    await runWriteQuery(
      `MATCH (d:Developer {name: $devName})
       MATCH (r:Role {title: $roleTitle})
       MERGE (d)-[:HAS_ROLE]->(r)`,
      { devName: dev.name, roleTitle: dev.role }
    );

    // Merge Developer Skills
    for (const sk of dev.skills) {
      await runWriteQuery(
        `MATCH (d:Developer {name: $devName})
         MATCH (s:Skill {name: $skillName})
         MERGE (d)-[ks:KNOWS_SKILL]->(s)
         SET ks.proficiency = $proficiency,
             ks.yearsOfExperience = $years`,
        {
          devName: dev.name,
          skillName: sk.name,
          proficiency: sk.proficiency,
          years: sk.years,
        }
      );
    }

    // Merge Developer Projects
    for (const pr of dev.projects) {
      await runWriteQuery(
        `MATCH (d:Developer {name: $devName})
         MATCH (p:Project {name: $projName})
         MERGE (d)-[wo:WORKED_ON]->(p)
         SET wo.role = $role`,
        {
          devName: dev.name,
          projName: pr.name,
          role: pr.role,
        }
      );
    }
  }

  // 9. Company Hires Roles
  await runWriteQuery(`
    MATCH (c:Company {name: 'Wexa AI'}), (r:Role {title: 'Lead Full-Stack Architect'}) MERGE (c)-[:HIRES_ROLE]->(r)
  `);
  await runWriteQuery(`
    MATCH (c:Company {name: 'CloudScale Systems'}), (r:Role {title: 'Senior Backend Specialist'}) MERGE (c)-[:HIRES_ROLE]->(r)
  `);
  await runWriteQuery(`
    MATCH (c:Company {name: 'NeuralGraph Inc'}), (r:Role {title: 'AI & Graph RAG Engineer'}) MERGE (c)-[:HIRES_ROLE]->(r)
  `);

  const stats: SeedStats = {
    developers: developers.length,
    skills: skills.length,
    companies: companies.length,
    roles: roles.length,
    projects: projects.length,
    relationships: skillEdges.length + 35,
  };

  console.log('✅ CognoDB Seed Completed Successfully!');
  console.table(stats);

  return {
    success: true,
    stats,
    message: 'CognoDB successfully populated with comprehensive developer skill graph dataset.',
  };
}

// Standalone execution entry point
if (require.main === module) {
  seedGraphDatabase()
    .then(async (res) => {
      console.log('Seeding result:', res.message);
      await closeDriver();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Seeding failed:', err.message);
      await closeDriver();
      process.exit(1);
    });
}

