import jwt from 'jsonwebtoken';
import config from 'config';
import Router from 'express-promise-router';
import User from '../user/db';

const router = new Router();
router.post('/', async (req, res) => {
  const { email, password } = req.body;
  if (!(email && password)) return res.sendStatus(400);
  try {
    // Select admin and password hash in addition to basic user data because they don't come back by default on queries.
    const user = await User.findOne({ email }).select('admin passwordHash');
    if (!(await user.verifyPass(password))) throw new Error('Invalid password');

    // Don't want to encode the password hash in the token, so we remove it
    const toEncode = user.toJSON();
    delete toEncode.passwordHash;
    const token = jwt.sign(toEncode, config.get('jwtSecret'), {
      expiresIn: config.get('tokenExpiration'),
    });
    return res.status(200).json({ token });
  } catch (e) {
    return res.sendStatus(401);
  }
});

export default router;
