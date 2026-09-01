export interface SearchResult {
  type: 'Developer' | 'Skill' | 'Project' | 'Company' | 'Role';
  name: string;
  subtitle: string;
  details: Record<string, any>;
}

export interface DeveloperSkill {
  name: string;
  category?: string;
  proficiency?: 'Beginner' | 'Intermediate' | 'Expert';
  yearsOfExperience?: number;
}

export interface DeveloperProject {
  name: string;
  description?: string;
  roleOnProject?: string;
  skillsUsed?: string[];
}

export interface DeveloperDetail {
  name: string;
  email?: string;
  experienceYears?: number;
  bio?: string;
  company?: string;
  role?: string;
  skills: DeveloperSkill[];
  projects: DeveloperProject[];
}

export interface RelatedDeveloper {
  developerName: string;
  role: string;
  company: string;
  sharedSkills: string[];
  sharedSkillsCount: number;
  jaccardSimilarity: number;
}

export interface SkillDetail {
  name: string;
  category: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  description?: string;
  relatedSkills?: Array<{
    name: string;
    category: string;
    strength?: number;
  }>;
  directPrerequisites?: string[];
  developersCount: number;
  projectsCount: number;
}

export interface SkillDeveloper {
  name: string;
  email?: string;
  experienceYears?: number;
  company?: string;
  role?: string;
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  yearsWithSkill?: number;
  projectsUsedIn?: string[];
}

export interface DeveloperProjectSkillTraversal {
  developerName: string;
  project: {
    name: string;
    roleOnProject: string;
  };
  skillsUsed: Array<{
    name: string;
    category: string;
    difficulty: string;
    prerequisites: string[];
  }>;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  category?: string;
  difficulty?: string;
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  label?: string;
}

export interface GraphOverviewData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface DomainItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  skillCount?: number;
}

export interface RoleItem {
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

export interface SkillGapAnalysisData {
  developer: {
    id: string;
    name: string;
    title?: string;
  };
  role: {
    id: string;
    title: string;
    department?: string;
  };
  stats: {
    totalRequired: number;
    skillsPossessedCount: number;
    skillsMissingCount: number;
    matchPercentage: number;
  };
  possessedSkills: Array<{
    id: string;
    name: string;
    category?: string;
    difficulty?: string;
    level?: string;
  }>;
  missingSkillsWithRoadmap: Array<{
    targetSkillId: string;
    targetSkillName: string;
    category?: string;
    difficulty?: string;
    importance?: string;
    missingPrerequisites: Array<{
      id: string;
      name: string;
      category?: string;
      difficulty?: string;
    }>;
    blockerCount: number;
  }>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unreachable';
  database: string;
  connected: boolean;
  uri?: string;
  serverAgent?: string;
  error?: string;
}

export interface CompanyItem {
  name: string;
  industry?: string;
  location?: string;
  employeesCount?: number;
  rolesCount?: number;
}

export interface ProjectItem {
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

export interface SkillListItem {
  id: string;
  name: string;
  category: string;
  difficulty?: string;
  description?: string;
  popularity?: number;
  domain?: string;
  domainColor?: string;
}

export interface DeveloperListItem {
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
