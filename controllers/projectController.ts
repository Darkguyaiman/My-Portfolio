import { Request, Response } from 'express';
import { getProjectByName, getProjectBySlug, getProjects } from '../models/projectModel.js';

export async function listProjects(_req: Request, res: Response) {
  try {
    res.json(await getProjects());
  } catch (error) {
    console.error('Error loading projects:', error);
    res.status(500).json({ error: 'Failed to load projects' });
  }
}

export async function showProject(req: Request, res: Response) {
  try {
    const projectName = req.query.project as string | undefined;
    const projectSlug = req.params.slug;
    const project = projectSlug
      ? await getProjectBySlug(projectSlug)
      : projectName
        ? await getProjectByName(projectName)
        : null;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error loading project:', error);
    res.status(500).json({ error: 'Failed to load project' });
  }
}
