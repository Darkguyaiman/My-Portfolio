import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { getCached } from '../utils/cache.js';

interface LanguageRow extends RowDataPacket {
  name: string;
  level: string;
}

export async function getLanguages() {
  return getCached('public:languages', loadLanguages, { tags: ['languages'] });
}

async function loadLanguages() {
  const [rows] = await pool.query<LanguageRow[]>(
    'SELECT name, level FROM languages ORDER BY display_order ASC, id ASC',
  );

  return { languages: rows };
}
