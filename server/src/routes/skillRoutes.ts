import { Router } from 'express';
import {
  listSkills,
  getSkillByName,
  getSkillDevelopers,
} from '../controllers/skillController';

const router = Router();

// GET /api/skills
router.get('/', listSkills);

// GET /api/skills/:name
router.get('/:name', getSkillByName);

// GET /api/skills/:name/developers
router.get('/:name/developers', getSkillDevelopers);

export default router;
