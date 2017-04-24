import { Router } from 'express';
import userModel from './db';

const router = Router();

// Creates a User
router.post('/', async ({ body }, res) => {
  // @TODO: Validation (Email..., username uniqueness, etc)
  try {
    const newUser = await userModel.create(body);
    return res.status(201).json(newUser.toJSON());
  } catch (error) {
    return res.status(401).json({ error, message: 'Invalid data for user' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const user = await userModel.findById(req.params.userId);
    return res.status(200).json(user.toJSON());
  } catch (e) {
    return res.sendStatus(404);
  }
});

export default router;
