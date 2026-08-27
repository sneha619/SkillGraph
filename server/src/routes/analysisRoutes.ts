import { Router } from 'express';
import { analyzeSkillGap } from '../controllers/analysisController';

const router = Router();

router.get('/gap', analyzeSkillGap);

export default router;

