import { Router } from 'express';
import { listLanguages } from '../controllers/languageController.js';
const router = Router();
router.get('/', listLanguages);
export default router;
