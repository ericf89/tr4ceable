import Router from 'express-promise-router';
import User from './db';
import packageRoutes from '../package/routes';
import requiresAuth from '../auth/middleware';

const router = Router();

router.post('/', async ({ body: { email, password } }, res) => {
  try {
    const newUser = new User({ email });
    await newUser.setPassword(password);
    await newUser.save();

    return res.status(201).json((await User.findById(newUser.id)).toJSON());
  } catch (error) {
    return res.status(400).json({ error: error.message, message: 'Invalid data for user' });
  }
});

router.get('/', requiresAuth, async ({ query: { email } }, res) => {
  const users = await User.find(email ? { email } : undefined);
  return res.status(users.length ? 200 : 404).json({
    users: users.map(u => u.toJSON()),
  });
});

router.use('/:userId*', requiresAuth, async (req, res, next) => {
  req.fetchedUser = await User.findById(req.params.userId);
  // eslint-disable-next-line no-underscore-dangle
  if (req.fetchedUser._id.toString() !== req.viewer._id && req.viewer.isAdmin !== true) {
    return res.sendStatus(401);
  }
  return req.fetchedUser ? next() : res.sendStatus(404);
});

router.get('/:userId', (req, res) => res.status(200).json(req.fetchedUser.toJSON()));
router.use('/:userid/packages', packageRoutes);

export default router;
