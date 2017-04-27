import Router from 'express-promise-router';
import userRoutes from './user/routes';
import authRoutes from './auth/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;

