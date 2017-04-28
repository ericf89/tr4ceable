import Router from 'express-promise-router';
import User from './db';
import packageRoutes from '../package/routes';
import requiresAuth, { requiresAdmin } from '../auth/middleware';

const router = Router();

// Creates a user.
router.post('/', async (req, res) => {
  const { email, password, name, phone } = req.body;
  try {
    const newUser = new User({ email, name, phone });
    await newUser.setPassword(password);
    await newUser.save();

    // We look the user up again so that the default selections are what's returned to the user. See the schema.
    // (i.e.  don't send the password hash by in the response.)
    return res.status(201).json((await User.findById(newUser.id)).toJSON());
  } catch (error) {
    return res.status(400).json({ error: error.message, message: 'Invalid data for user' });
  }
});


// We optionally accept an email address in the query here, to meet the requirements.  Without, it's a full list of users.
router.get('/', requiresAuth, requiresAdmin, async ({ query: { email } }, res) => {
  const users = await User.find(email ? { email } : undefined);
  return res.status(users.length ? 200 : 404).json({
    users: users.map(u => u.toJSON()),
  });
});

router.use('/:userId*', requiresAuth, async (req, res, next) => {
  req.fetchedUser = await User.findById(req.params.userId);
  // A slightly more complicated admin check than above:
  // Users are allowed to view all resources belonging to themselves. (The user from the route matches the user in the token)
  // Admins can do whatever though, so we exclude them.  Since this route handler is above all of the individual user resources,
  // and all of the sub package resources, it provides auth for them all. Neat. :``)
  // eslint-disable-next-line no-underscore-dangle
  if (req.fetchedUser._id.toString() !== req.viewer._id && req.viewer.admin !== true) {
    return res.sendStatus(401);
  }
  return req.fetchedUser ? next() : res.sendStatus(404);
});

router.get('/:userId', (req, res) => res.status(200).json(req.fetchedUser.toJSON()));
router.delete('/:userId', async (req, res) => {
  await req.fetchedUser.remove();
  return res.sendStatus(200);
});

router.use('/:userid/packages', packageRoutes);

export default router;
