import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

interface LanguageRow extends RowDataPacket {
  name: string;
  level: string;
}

export async function getLanguages() {
  const [rows] = await pool.query<LanguageRow[]>(
    'SELECT name, level FROM languages ORDER BY display_order ASC, id ASC',
  );

  return { languages: rows };
}
