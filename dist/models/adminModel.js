import { pool } from '../config/db.js';
import { slugify } from './projectModel.js';
export const defaultSiteContent = {
    heroTitlePrefix: "Hellow, I'm",
    heroName: 'Mohamed Aiman',
    heroSubtitle: '<span class="age" id="age">17</span> yo web developer in <span class="location">Malaysia</span>, from <span class="location">Myanmar</span> & <span class="location">Sudan</span> <span class="blasian-note">(yes, that makes me blasian)</span>',
    heroDescription: 'I specialise in server-side development, that makes me more of a backend developer however I am proficient on the frontend as well such as making responsive UIs.',
    resumePath: '/resume/resume.pdf',
    contactText: "I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions.",
    linkedinUrl: 'https://www.linkedin.com/in/mohamed-aiman-7365701ba/',
    githubUrl: 'https://github.com/Darkguyaiman',
    xUrl: 'https://x.com/MohamedAiman103',
    instagramUrl: 'https://www.instagram.com/darkguyaiman/',
    facebookUrl: 'https://www.facebook.com/darkguyaiman',
    email: 'mohamedaiman103@gmail.com',
};
export async function ensureCmsSchema() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      content_key VARCHAR(120) NOT NULL,
      content_value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (content_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
    const entries = Object.entries(defaultSiteContent);
    for (const [key, value] of entries) {
        await pool.query('INSERT IGNORE INTO site_content (content_key, content_value) VALUES (?, ?)', [key, value]);
    }
}
export async function getDashboardStats() {
    const [[projects]] = await pool.query('SELECT COUNT(*) AS total FROM projects');
    const [[work]] = await pool.query('SELECT COUNT(*) AS total FROM work_experiences');
    const [[education]] = await pool.query('SELECT COUNT(*) AS total FROM education');
    const [[languages]] = await pool.query('SELECT COUNT(*) AS total FROM languages');
    return {
        projects: Number(projects.total),
        work: Number(work.total),
        education: Number(education.total),
        languages: Number(languages.total),
    };
}
export async function getSiteContent() {
    try {
        await ensureCmsSchema();
        const [rows] = await pool.query('SELECT content_key, content_value FROM site_content');
        return rows.reduce((content, row) => {
            if (row.content_key in content) {
                content[row.content_key] = row.content_value;
            }
            return content;
        }, { ...defaultSiteContent });
    }
    catch (error) {
        console.error('Error loading site content:', error);
        return { ...defaultSiteContent };
    }
}
export async function saveSiteContent(content) {
    await ensureCmsSchema();
    const entries = Object.entries(content);
    for (const [key, value] of entries) {
        await pool.query('INSERT INTO site_content (content_key, content_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)', [key, value]);
    }
}
export async function listAdminProjects() {
    const [rows] = await pool.query('SELECT id, project_name, description, deployed_link, github_link, display_order, updated_at FROM projects ORDER BY display_order ASC, id ASC');
    return rows.map((row) => ({ ...row, slug: slugify(row.project_name) }));
}
export async function getAdminProject(id) {
    const [rows] = await pool.query('SELECT id, project_name, description, deployed_link, github_link, display_order, updated_at FROM projects WHERE id = ?', [id]);
    const project = rows[0];
    if (!project)
        return null;
    const [technologies] = await pool.query('SELECT project_id AS parent_id, technology AS value FROM project_technologies WHERE project_id = ? ORDER BY display_order ASC, id ASC', [id]);
    const [images] = await pool.query('SELECT project_id AS parent_id, image_path AS value FROM project_images WHERE project_id = ? ORDER BY display_order ASC, id ASC', [id]);
    return {
        id: project.id,
        projectName: project.project_name,
        description: project.description,
        deployedLink: project.deployed_link || '',
        githubLink: project.github_link || '',
        displayOrder: project.display_order,
        technologies: technologies.map((row) => row.value),
        images: images.map((row) => row.value),
    };
}
export async function createProject(input) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query('INSERT INTO projects (project_name, description, deployed_link, github_link, display_order) VALUES (?, ?, ?, ?, ?)', [input.projectName, input.description, input.deployedLink, input.githubLink, input.displayOrder]);
        await replaceProjectChildren(connection, result.insertId, input);
        await connection.commit();
        return result.insertId;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function updateProject(id, input) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE projects SET project_name = ?, description = ?, deployed_link = ?, github_link = ?, display_order = ? WHERE id = ?', [input.projectName, input.description, input.deployedLink, input.githubLink, input.displayOrder, id]);
        await replaceProjectChildren(connection, id, input);
        await connection.commit();
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function deleteProject(id) {
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
}
export async function getNextProjectDisplayOrder() {
    return nextDisplayOrder('projects');
}
export async function reorderProjects(ids) {
    await reorderDisplayOrder('projects', ids);
}
export async function listAdminWork() {
    const [rows] = await pool.query('SELECT id, company, role, start_date, end_date, logo, display_order FROM work_experiences ORDER BY display_order ASC, id ASC');
    return rows;
}
export async function getAdminWork(id) {
    const [rows] = await pool.query('SELECT id, company, role, start_date, end_date, logo, display_order FROM work_experiences WHERE id = ?', [id]);
    const work = rows[0];
    if (!work)
        return null;
    const [descriptions] = await pool.query('SELECT work_experience_id AS parent_id, description AS value FROM work_experience_descriptions WHERE work_experience_id = ? ORDER BY display_order ASC, id ASC', [id]);
    return {
        id: work.id,
        company: work.company,
        role: work.role,
        startDate: work.start_date,
        endDate: work.end_date,
        logo: work.logo || '',
        displayOrder: work.display_order,
        descriptions: descriptions.map((row) => row.value),
    };
}
export async function createWork(input) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query('INSERT INTO work_experiences (company, role, start_date, end_date, logo, display_order) VALUES (?, ?, ?, ?, ?, ?)', [input.company, input.role, input.startDate, input.endDate, input.logo, input.displayOrder]);
        await replaceWorkDescriptions(connection, result.insertId, input.descriptions);
        await connection.commit();
        return result.insertId;
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function updateWork(id, input) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE work_experiences SET company = ?, role = ?, start_date = ?, end_date = ?, logo = ?, display_order = ? WHERE id = ?', [input.company, input.role, input.startDate, input.endDate, input.logo, input.displayOrder, id]);
        await replaceWorkDescriptions(connection, id, input.descriptions);
        await connection.commit();
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
export async function deleteWork(id) {
    await pool.query('DELETE FROM work_experiences WHERE id = ?', [id]);
}
export async function getNextWorkDisplayOrder() {
    return nextDisplayOrder('work_experiences');
}
export async function reorderWork(ids) {
    await reorderDisplayOrder('work_experiences', ids);
}
export async function listAdminEducation() {
    const [rows] = await pool.query('SELECT id, qualification, institution, field, duration_start, duration_end, results, description, display_order FROM education ORDER BY display_order ASC, id ASC');
    return rows;
}
export async function getAdminEducation(id) {
    const [rows] = await pool.query('SELECT id, qualification, institution, field, duration_start, duration_end, results, description, display_order FROM education WHERE id = ?', [id]);
    const education = rows[0];
    if (!education)
        return null;
    return {
        id: education.id,
        qualification: education.qualification,
        institution: education.institution,
        field: education.field,
        durationStart: education.duration_start,
        durationEnd: education.duration_end,
        results: typeof education.results === 'string' ? education.results : JSON.stringify(education.results || {}, null, 2),
        description: education.description,
        displayOrder: education.display_order,
    };
}
export async function createEducation(input) {
    const [result] = await pool.query('INSERT INTO education (qualification, institution, field, duration_start, duration_end, results, description, display_order) VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?)', [input.qualification, input.institution, input.field, input.durationStart, input.durationEnd, input.results, input.description, input.displayOrder]);
    return result.insertId;
}
export async function updateEducation(id, input) {
    await pool.query('UPDATE education SET qualification = ?, institution = ?, field = ?, duration_start = ?, duration_end = ?, results = CAST(? AS JSON), description = ?, display_order = ? WHERE id = ?', [input.qualification, input.institution, input.field, input.durationStart, input.durationEnd, input.results, input.description, input.displayOrder, id]);
}
export async function getNextEducationDisplayOrder() {
    return nextDisplayOrder('education');
}
export async function reorderEducation(ids) {
    await reorderDisplayOrder('education', ids);
}
export async function deleteEducation(id) {
    await pool.query('DELETE FROM education WHERE id = ?', [id]);
}
export async function listAdminLanguages() {
    const [rows] = await pool.query('SELECT id, name, level, display_order FROM languages ORDER BY display_order ASC, id ASC');
    return rows;
}
export async function getAdminLanguage(id) {
    const [rows] = await pool.query('SELECT id, name, level, display_order FROM languages WHERE id = ?', [id]);
    return rows[0] || null;
}
export async function createLanguage(input) {
    const [result] = await pool.query('INSERT INTO languages (name, level, display_order) VALUES (?, ?, ?)', [input.name, input.level, input.displayOrder]);
    return result.insertId;
}
export async function updateLanguage(id, input) {
    await pool.query('UPDATE languages SET name = ?, level = ?, display_order = ? WHERE id = ?', [input.name, input.level, input.displayOrder, id]);
}
export async function deleteLanguage(id) {
    await pool.query('DELETE FROM languages WHERE id = ?', [id]);
}
export async function getNextLanguageDisplayOrder() {
    return nextDisplayOrder('languages');
}
export async function reorderLanguages(ids) {
    await reorderDisplayOrder('languages', ids);
}
async function nextDisplayOrder(table) {
    const [rows] = await pool.query(`SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM ${table}`);
    return Number(rows[0]?.next_order ?? 1);
}
async function reorderDisplayOrder(table, ids) {
    if (!ids.length)
        return;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const [index, id] of ids.entries()) {
            await connection.query(`UPDATE ${table} SET display_order = ? WHERE id = ?`, [index + 1, id]);
        }
        await connection.commit();
    }
    catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
}
async function replaceProjectChildren(connection, projectId, input) {
    await connection.query('DELETE FROM project_technologies WHERE project_id = ?', [projectId]);
    await connection.query('DELETE FROM project_images WHERE project_id = ?', [projectId]);
    for (const [index, technology] of input.technologies.entries()) {
        await connection.query('INSERT INTO project_technologies (project_id, technology, display_order) VALUES (?, ?, ?)', [projectId, technology, index + 1]);
    }
    for (const [index, image] of input.images.entries()) {
        await connection.query('INSERT INTO project_images (project_id, image_path, display_order) VALUES (?, ?, ?)', [projectId, image, index + 1]);
    }
}
async function replaceWorkDescriptions(connection, workId, descriptions) {
    await connection.query('DELETE FROM work_experience_descriptions WHERE work_experience_id = ?', [workId]);
    for (const [index, description] of descriptions.entries()) {
        await connection.query('INSERT INTO work_experience_descriptions (work_experience_id, description, display_order) VALUES (?, ?, ?)', [workId, description, index + 1]);
    }
}
