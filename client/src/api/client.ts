import {
  SearchResult,
  DeveloperDetail,
  RelatedDeveloper,
  SkillDetail,
  SkillDeveloper,
  DeveloperProjectSkillTraversal,
  GraphOverviewData,
  DomainItem,
  RoleItem,
  SkillGapAnalysisData,
  SystemHealth,
  CompanyItem,
  ProjectItem,
  SkillListItem,
  DeveloperListItem,
} from '../types';

const API_BASE = (() => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
  // Strip any trailing slash so endpoints always join cleanly.
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
})();

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const json = await response.json();

    if (!response.ok || json.success === false) {
      throw new Error(json.error || `Request failed with status ${response.status}`);
    }

    return json.data !== undefined ? json.data : json;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Unable to reach backend server. Please verify the server is running on ' + API_BASE
      );
    }
    throw error;
  }
}

export const api = {
  // 1. Global Search
  search: (q: string): Promise<SearchResult[]> =>
    request<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),

  // 2. Developer Details
  getDeveloper: (name: string): Promise<DeveloperDetail> =>
    request<DeveloperDetail>(`/developers/${encodeURIComponent(name)}`),

  // 3. Related Developers via Shared Skills
  getRelatedDevelopers: (name: string): Promise<RelatedDeveloper[]> =>
    request<RelatedDeveloper[]>(`/developers/${encodeURIComponent(name)}/related`),

  // 4. Developer -> Project -> Skills Multi-Hop Traversal
  getDeveloperProjectSkills: (name: string): Promise<DeveloperProjectSkillTraversal[]> =>
    request<DeveloperProjectSkillTraversal[]>(
      `/developers/${encodeURIComponent(name)}/project-skills`
    ),

  // 5. Skill Details
  getSkill: (name: string): Promise<SkillDetail> =>
    request<SkillDetail>(`/skills/${encodeURIComponent(name)}`),

  // 6. Developers By Skill
  getSkillDevelopers: (name: string): Promise<SkillDeveloper[]> =>
    request<SkillDeveloper[]>(`/skills/${encodeURIComponent(name)}/developers`),

  // 7. Graph Overview & Domains
  getGraphOverview: (domain?: string): Promise<GraphOverviewData> =>
    request<GraphOverviewData>(`/graph/overview${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`),

  getDomains: (): Promise<DomainItem[]> =>
    request<DomainItem[]>('/graph/domains'),

  // 8. Roles & Skill Gap Analysis
  getRoles: (): Promise<RoleItem[]> =>
    request<RoleItem[]>('/roles'),

  getRoleById: (id: string): Promise<RoleItem> =>
    request<RoleItem>(`/roles/${encodeURIComponent(id)}`),

  analyzeSkillGap: (developerId: string, roleId: string): Promise<SkillGapAnalysisData> =>
    request<SkillGapAnalysisData>(
      `/analysis/gap?developerId=${encodeURIComponent(developerId)}&roleId=${encodeURIComponent(roleId)}`
    ),

  // 9. System Health
  getHealth: async (): Promise<SystemHealth> => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.json();
    } catch {
      return {
        status: 'unreachable',
        database: 'CognoDB',
        connected: false,
        error: 'Backend API is currently offline',
      };
    }
  },

  // 10. Seed Database
  seedDatabase: (): Promise<{ success: boolean; stats: any; message: string }> =>
    request<{ success: boolean; stats: any; message: string }>('/seed', {
      method: 'POST',
    }),

  // 11. Dashboard / Listing endpoints
  listDevelopers: (): Promise<DeveloperListItem[]> =>
    request<DeveloperListItem[]>('/developers'),

  listSkills: (): Promise<SkillListItem[]> =>
    request<SkillListItem[]>('/skills'),

  listCompanies: (): Promise<CompanyItem[]> =>
    request<CompanyItem[]>('/graph/companies'),

  listProjects: (): Promise<ProjectItem[]> =>
    request<ProjectItem[]>('/graph/projects'),
};
