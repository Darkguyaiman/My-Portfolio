import { getWorkExperiences } from '../models/workModel.js';
export async function listWorkExperiences(_req, res) {
    try {
        res.json(await getWorkExperiences());
    }
    catch (error) {
        console.error('Error loading work experience:', error);
        res.status(500).json({ error: 'Failed to load work experience' });
    }
}
