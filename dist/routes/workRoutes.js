import { Router } from 'express';
import { listWorkExperiences } from '../controllers/workController.js';
const router = Router();
router.get('/', listWorkExperiences);
export default router;
