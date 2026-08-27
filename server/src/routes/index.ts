import { Router } from 'express';
import searchRoutes from './searchRoutes';
import developerRoutes from './developerRoutes';
import skillRoutes from './skillRoutes';
import graphRoutes from './graphRoutes';
import roleRoutes from './roleRoutes';
import analysisRoutes from './analysisRoutes';
import healthRoutes from './healthRoutes';

const apiRouter = Router();

apiRouter.use('/search', searchRoutes);
apiRouter.use('/developers', developerRoutes);
apiRouter.use('/skills', skillRoutes);
apiRouter.use('/graph', graphRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/analysis', analysisRoutes);
apiRouter.use('/', healthRoutes);

export default apiRouter;
