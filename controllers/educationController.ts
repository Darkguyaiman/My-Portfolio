import { Request, Response } from 'express';
import { getEducation } from '../models/educationModel.js';

export async function listEducation(_req: Request, res: Response) {
  try {
    res.json(await getEducation());
  } catch (error) {
    console.error('Error loading education:', error);
    res.status(500).json({ error: 'Failed to load education' });
  }
}
