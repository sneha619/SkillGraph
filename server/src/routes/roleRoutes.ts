import { Router } from 'express';
import { listRoles, getRoleById } from '../controllers/roleController';

const router = Router();

router.get('/', listRoles);
router.get('/:id', getRoleById);

export default router;

