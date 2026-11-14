import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { getCached } from '../utils/cache.js';

export interface Certification extends RowDataPacket {
  id: number;
  name: string;
  issuer: string;
  issued: string;
  credentialId: string | null;
  credentialUrl: string;
  description: string;
  logo: string | null;
}

// Prioritise development skills, followed by academic and transferable skills.
const relevanceOrder = [
  1660981169, // Web development
  707340432, // Python programming
  708095835, // Academic excellence
  1483169554, // Mathematics and problem solving
  707641520, // Public speaking
  707182088, // Leadership
  707021642, // Essay writing
  708238174, // Stock exchange fundamentals
  1482700685, // Taekwondo
  707446038, // Full attendance
];
const issuerLogos: Record<string, string> = {
  Sololearn: 'certification-issuers/sololearn.webp',
  'Bursa Malaysia': 'certification-issuers/bursa-malaysia.webp',
  'International Modern Arabic School (IMAS)': 'education-institutions/optimized/Imas-192.webp',
  'Malaysia University of Science and Technology': 'education-institutions/optimized/MUST-192.webp',
  'Royal Commonwealth Society': 'certification-issuers/royal-commonwealth-society.webp',
  'International Institute of Islamic Thought': 'certification-issuers/iiit.webp',
  'SMK Sultan Abdul Samad': 'certification-issuers/smk-sultan-abdul-samad.webp',
  'Taekwondo Malaysia (WTF)': 'certification-issuers/taekwondo-malaysia.webp',
  'Kangaroo Math Malaysia': 'certification-issuers/kangaroo-math.webp',
};

function relevance(id: number): number {
  const index = relevanceOrder.indexOf(id);
  return index < 0 ? relevanceOrder.length : index;
}

export async function getCertifications(): Promise<Certification[]> {
  return getCached('public:certifications', async () => {
    const [rows] = await pool.query<Certification[]>(
      `SELECT id, name, issuer, issued, credential_id AS credentialId,
        credential_url AS credentialUrl, description
       FROM certifications ORDER BY issued DESC, id DESC`,
    );
    return rows
      .sort((a, b) => relevance(a.id) - relevance(b.id))
      .map((certificate) => ({ ...certificate, logo: issuerLogos[certificate.issuer] || null }));
  }, { tags: ['certifications'] });
}
