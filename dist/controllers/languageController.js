import { getLanguages } from '../models/languageModel.js';
export async function listLanguages(_req, res) {
    try {
        res.json(await getLanguages());
    }
    catch (error) {
        console.error('Error loading languages:', error);
        res.status(500).json({ error: 'Failed to load languages' });
    }
}
