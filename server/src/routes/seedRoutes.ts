import { Router } from 'express';
import { getHealth, seedDatabase } from '../controllers/seedController';

const router = Router();

router.get('/health', getHealth);
router.post('/seed', seedDatabase);

export default router;

