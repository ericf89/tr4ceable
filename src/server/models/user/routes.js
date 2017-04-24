import { Router } from 'express';
import User from './db';

const router = Router();

// Creates a User
router.post('/', async ({ body: { email, password } }, res) => {
  try {
    const newUser = new User({ email });
    await newUser.setPassword(password);
    await newUser.save();

    return res.status(201).json((await User.findById(newUser.id)).toJSON());
  } catch (error) {
    return res.status(401).json({ error, message: 'Invalid data for user' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    return res.status(200).json(user.toJSON());
  } catch (e) {
    return res.sendStatus(404);
  }
});

export default router;
