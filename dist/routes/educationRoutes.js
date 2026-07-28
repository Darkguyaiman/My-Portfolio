import { Router } from 'express';
import { listEducation } from '../controllers/educationController.js';
const router = Router();
router.get('/', listEducation);
export default router;
