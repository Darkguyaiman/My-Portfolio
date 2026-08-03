import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { getCached } from '../utils/cache.js';

export interface Project {
  id: number;
  slug: string;
  projectName: string;
  description: string;
  techUsed: string[];
  images?: string[];
  deployedLink?: string;
  githubLink?: string;
  updatedAt: Date;
}

interface ProjectRow extends RowDataPacket {
  id: number;
  project_name: string;
  description: string;
  deployed_link: string | null;
  github_link: string | null;
  updated_at: Date;
}

interface ChildRow extends RowDataPacket {
  project_id: number;
  value: string;
}

export async function getProjects(): Promise<Project[]> {
  return getCached('public:projects', loadProjects, { tags: ['projects'] });
}

async function loadProjects(): Promise<Project[]> {
  const [projectRows] = await pool.query<ProjectRow[]>(
    'SELECT id, project_name, description, deployed_link, github_link, updated_at FROM projects ORDER BY display_order ASC, id ASC',
  );

  const [technologyRows] = await pool.query<ChildRow[]>(
    'SELECT project_id, technology AS value FROM project_technologies ORDER BY display_order ASC, id ASC',
  );

  const [imageRows] = await pool.query<ChildRow[]>(
    'SELECT project_id, image_path AS value FROM project_images ORDER BY display_order ASC, id ASC',
  );

  const technologiesByProject = groupByProjectId(technologyRows);
  const imagesByProject = groupByProjectId(imageRows);

  return projectRows.map((project) => ({
    id: project.id,
    slug: slugify(project.project_name),
    projectName: project.project_name,
    description: project.description,
    techUsed: technologiesByProject.get(project.id) || [],
    images: imagesByProject.get(project.id)?.map(normalizeAssetPath),
    deployedLink: project.deployed_link || undefined,
    githubLink: project.github_link || undefined,
    updatedAt: project.updated_at,
  }));
}

export async function getProjectByName(projectName: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((project) => project.projectName === projectName) || null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) || null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeAssetPath(value: string): string {
  return value
    .replace(/^\/+/, '')
    .replace(/^Public[\\/]/i, '')
    .replace(/^Projects[\\/]/i, 'projects/')
    .replace(/^Assets[\\/]/i, 'assets/')
    .replace(/^Companies[\\/]/i, 'companies/')
    .replace(/^Education Institution[\\/]/i, 'education-institutions/');
}

function groupByProjectId(rows: ChildRow[]): Map<number, string[]> {
  return rows.reduce((map, row) => {
    const values = map.get(row.project_id) || [];
    values.push(row.value);
    map.set(row.project_id, values);
    return map;
  }, new Map<number, string[]>());
}
