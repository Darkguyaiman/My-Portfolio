import { Request, Response } from 'express';
import { getLanguages } from '../models/languageModel.js';

export async function listLanguages(_req: Request, res: Response) {
  try {
    res.json(await getLanguages());
  } catch (error) {
    console.error('Error loading languages:', error);
    res.status(500).json({ error: 'Failed to load languages' });
  }
}
