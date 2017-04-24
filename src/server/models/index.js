import { Router } from 'express';
import userRoutes from './user/routes';

const router = Router();
// router.all('*', requireAuth);
router.use('/users', userRoutes);

export default router;

