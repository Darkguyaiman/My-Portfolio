import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';

// Never import schema.sql here: that file rebuilds tables for fresh installs.
const migrations = [
  '0002_add_certifications_and_projects.sql',
  '0003_rank_projects_and_add_screenshots.sql',
  '0004_whatsappsharp_launch_gallery.sql',
];
const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'darkguyaiman-com',
  charset: 'utf8mb4',
  multipleStatements: true,
  connectTimeout: 4_000,
});

try {
  for (const migration of migrations) {
    const sql = await fs.readFile(new URL('../database/migrations/' + migration, import.meta.url), 'utf8');
    await db.query(sql);
  }
  const [[{ certificates }]] = await db.query('SELECT COUNT(*) AS certificates FROM certifications');
  console.log(`Portfolio updated: projects ranked, screenshots added, and ${certificates} certificates available. Restart the app to refresh cached content.`);
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
