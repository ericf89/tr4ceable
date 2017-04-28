// promise router makes handling our async routes much nicer,
// otherwise we'd have to wrap each route handler to catch promise rejections.
import Router from 'express-promise-router';
import userRoutes from './user/routes';
import authRoutes from './auth/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;

