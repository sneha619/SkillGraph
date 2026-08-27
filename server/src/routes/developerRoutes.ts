import { Router } from 'express';
import {
  listDevelopers,
  getDeveloperByName,
  getRelatedDevelopers,
  getDeveloperProjectSkills,
} from '../controllers/developerController';

const router = Router();

// GET /api/developers
router.get('/', listDevelopers);

// GET /api/developers/:name
router.get('/:name', getDeveloperByName);

// GET /api/developers/:name/related
router.get('/:name/related', getRelatedDevelopers);

// GET /api/developers/:name/project-skills
router.get('/:name/project-skills', getDeveloperProjectSkills);

export default router;
