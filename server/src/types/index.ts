export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  message?: string;
}

export interface DeveloperNode {
  name: string;
  email?: string;
  experienceYears?: number;
  bio?: string;
  company?: string;
  role?: string;
  skills?: Array<{
    name: string;
    category?: string;
    proficiency?: 'Beginner' | 'Intermediate' | 'Expert';
    yearsOfExperience?: number;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    roleOnProject?: string;
    skillsUsed?: string[];
  }>;
}

export interface SkillNode {
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
  developersCount?: number;
  projectsCount?: number;
}

export interface CompanyNode {
  name: string;
  industry?: string;
  location?: string;
}

export interface RoleNode {
  title: string;
  department?: string;
  level?: string;
}

export interface ProjectNode {
  name: string;
  description?: string;
  status?: string;
  skillsUsed?: string[];
  contributors?: Array<{
    developerName: string;
    roleOnProject: string;
  }>;
}

export interface SearchResult {
  type: 'Developer' | 'Skill' | 'Project' | 'Company' | 'Role';
  name: string;
  subtitle: string;
  details: Record<string, any>;
}

export interface RelatedDeveloper {
  developerName: string;
  role: string;
  company: string;
  sharedSkills: string[];
  sharedSkillsCount: number;
  jaccardSimilarity: number;
}

export interface DeveloperSkillTraversal {
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

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unreachable';
  database: string;
  connected: boolean;
  uri: string;
  serverAgent?: string;
  protocolVersion?: number;
  timestamp: string;
  error?: string;
}
