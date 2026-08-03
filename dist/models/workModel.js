import { pool } from '../config/db.js';
import { getCached } from '../utils/cache.js';
export async function getWorkExperiences() {
    return getCached('public:work', loadWorkExperiences, { tags: ['work'] });
}
async function loadWorkExperiences() {
    const [workRows] = await pool.query('SELECT id, company, role, start_date, end_date, logo FROM work_experiences ORDER BY display_order ASC, id ASC');
    const [descriptionRows] = await pool.query('SELECT work_experience_id, description FROM work_experience_descriptions ORDER BY display_order ASC, id ASC');
    const descriptionsByWork = descriptionRows.reduce((map, row) => {
        const descriptions = map.get(row.work_experience_id) || [];
        descriptions.push(row.description);
        map.set(row.work_experience_id, descriptions);
        return map;
    }, new Map());
    return workRows.map((row) => ({
        company: row.company,
        role: row.role,
        startDate: row.start_date,
        endDate: row.end_date,
        logo: row.logo,
        description: descriptionsByWork.get(row.id) || [],
    }));
}
