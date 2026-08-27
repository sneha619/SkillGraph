import { Router } from 'express';
import { getGraphOverview, listDomains } from '../controllers/graphController';

const router = Router();

router.get('/overview', getGraphOverview);
router.get('/domains', listDomains);

export default router;

