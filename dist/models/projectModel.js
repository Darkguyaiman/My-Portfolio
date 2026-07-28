import { pool } from '../config/db.js';
export async function getProjects() {
    const [projectRows] = await pool.query('SELECT id, project_name, description, deployed_link, github_link FROM projects ORDER BY display_order ASC, id ASC');
    const [technologyRows] = await pool.query('SELECT project_id, technology AS value FROM project_technologies ORDER BY display_order ASC, id ASC');
    const [imageRows] = await pool.query('SELECT project_id, image_path AS value FROM project_images ORDER BY display_order ASC, id ASC');
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
    }));
}
export async function getProjectByName(projectName) {
    const projects = await getProjects();
    return projects.find((project) => project.projectName === projectName) || null;
}
export async function getProjectBySlug(slug) {
    const projects = await getProjects();
    return projects.find((project) => project.slug === slug) || null;
}
export function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function normalizeAssetPath(value) {
    return value
        .replace(/^\/+/, '')
        .replace(/^Public[\\/]/i, '')
        .replace(/^Projects[\\/]/i, 'projects/')
        .replace(/^Assets[\\/]/i, 'assets/')
        .replace(/^Companies[\\/]/i, 'companies/')
        .replace(/^Education Institution[\\/]/i, 'education-institutions/');
}
function groupByProjectId(rows) {
    return rows.reduce((map, row) => {
        const values = map.get(row.project_id) || [];
        values.push(row.value);
        map.set(row.project_id, values);
        return map;
    }, new Map());
}
