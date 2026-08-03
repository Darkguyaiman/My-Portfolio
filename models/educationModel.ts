import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { getCached } from '../utils/cache.js';

interface EducationRow extends RowDataPacket {
  qualification: string;
  institution: string;
  field: string;
  duration_start: string;
  duration_end: string;
  results: unknown;
  description: string;
}

export async function getEducation() {
  return getCached('public:education', loadEducation, { tags: ['education'] });
}

async function loadEducation() {
  const [rows] = await pool.query<EducationRow[]>(
    'SELECT qualification, institution, field, duration_start, duration_end, results, description FROM education ORDER BY display_order ASC, id ASC',
  );

  return {
    education: rows.map((row) => ({
      qualification: row.qualification,
      institution: row.institution,
      field: row.field,
      duration: {
        start: row.duration_start,
        end: row.duration_end,
      },
      results: typeof row.results === 'string' ? JSON.parse(row.results) : row.results,
      description: row.description,
    })),
  };
}
