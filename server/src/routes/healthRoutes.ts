import { Router } from 'express';
import { getHealth, seedDatabase } from '../controllers/healthController';

const router = Router();

// GET /api/health
router.get('/health', getHealth);

// POST /api/seed
router.post('/seed', seedDatabase);

export default router;

