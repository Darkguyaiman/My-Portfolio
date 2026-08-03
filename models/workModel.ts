import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { getCached } from '../utils/cache.js';

interface WorkRow extends RowDataPacket {
  id: number;
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  logo: string | null;
}

interface DescriptionRow extends RowDataPacket {
  work_experience_id: number;
  description: string;
}

export async function getWorkExperiences() {
  return getCached('public:work', loadWorkExperiences, { tags: ['work'] });
}

async function loadWorkExperiences() {
  const [workRows] = await pool.query<WorkRow[]>(
    'SELECT id, company, role, start_date, end_date, logo FROM work_experiences ORDER BY display_order ASC, id ASC',
  );

  const [descriptionRows] = await pool.query<DescriptionRow[]>(
    'SELECT work_experience_id, description FROM work_experience_descriptions ORDER BY display_order ASC, id ASC',
  );

  const descriptionsByWork = descriptionRows.reduce((map, row) => {
    const descriptions = map.get(row.work_experience_id) || [];
    descriptions.push(row.description);
    map.set(row.work_experience_id, descriptions);
    return map;
  }, new Map<number, string[]>());

  return workRows.map((row) => ({
    company: row.company,
    role: row.role,
    startDate: row.start_date,
    endDate: row.end_date,
    logo: row.logo,
    description: descriptionsByWork.get(row.id) || [],
  }));
}
