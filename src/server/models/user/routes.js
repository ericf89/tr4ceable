import Router from 'express-promise-router';
import User from './db';
import packageRoutes from '../package/routes';

const router = Router();

// Creates a User
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

router.get('/', async ({ query: { email } }, res) => {
  const users = await User.find(email ? { email } : undefined);
  return res.status(users.length ? 200 : 404).json({
    users: users.map(u => u.toJSON()),
  });
});

router.use('/:userId*', async (req, res, next) => {
  try {
    req.fetchedUser = await User.findById(req.params.userId);
    return req.fetchedUser ? next() : res.sendStatus(404);
  } catch (e) {
    return res.sendStatus(500);
  }
});

router.get('/:userId', (req, res) => res.status(200).json(req.fetchedUser.toJSON()));
router.use('/:userid/packages', packageRoutes);

export default router;
