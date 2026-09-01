import { Router } from 'express';
import { getGraphOverview, listDomains, listCompanies, listProjects } from '../controllers/graphController';

const router = Router();

router.get('/overview', getGraphOverview);
router.get('/domains', listDomains);
router.get('/companies', listCompanies);
router.get('/projects', listProjects);

export default router;

