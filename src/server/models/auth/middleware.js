import jwt from 'jsonwebtoken';
import config from 'config';

export default (req, res, next) => {
  if (!req.token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(req.token, config.get('jwtSecret'));
    req.viewer = decoded;
    return next();
  } catch (e) {
    return res.sendStatus(401);
  }
};
