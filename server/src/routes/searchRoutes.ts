import { Router } from 'express';
import { search } from '../controllers/searchController';

const router = Router();

// GET /api/search?q=
router.get('/', search);

export default router;

