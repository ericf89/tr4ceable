import jwt from 'jsonwebtoken';
import config from 'config';

// Basic middleware for ensuring you have a token, and that the token is valid.
// We set the decoded token on the request as 'viewer' so other handlers can use it downstream.
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

// Basic-er middleware for admin check.  Dependent on the previous.  Probably a better way to compose'em together.
export const requiresAdmin = (req, res, next) => {
  if (req.viewer && req.viewer.admin) return next();
  return res.sendStatus(401);
};
