import { pool } from '../config/db.js';
export async function getLanguages() {
    const [rows] = await pool.query('SELECT name, level FROM languages ORDER BY display_order ASC, id ASC');
    return { languages: rows };
}
