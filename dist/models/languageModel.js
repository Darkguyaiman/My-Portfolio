import { pool } from '../config/db.js';
import { getCached } from '../utils/cache.js';
export async function getLanguages() {
    return getCached('public:languages', loadLanguages, { tags: ['languages'] });
}
async function loadLanguages() {
    const [rows] = await pool.query('SELECT name, level FROM languages ORDER BY display_order ASC, id ASC');
    return { languages: rows };
}
