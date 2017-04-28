import jwt from 'jsonwebtoken';
import middleware, { requiresAdmin } from '../../src/server/models/auth/middleware';

jest.mock('jsonwebtoken');

describe('Auth middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = jest.fn();
    res = {
      sendStatus: jest.fn(),
    };
    next = jest.fn();
  });

  it('should 401 if there\'s no token on the request', () => {
    middleware(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  it('should call next if the token is valid', () => {
    req.token = 'Fake Token';
    const fakeTokenPayload = 'blahblah';
    jwt.verify.mockImplementation(() => fakeTokenPayload);

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(jwt.verify.toHaveBeenCalled);
    expect(req.viewer).toEqual(fakeTokenPayload);
  });

  it('should 401 if the token is invalid or expired', () => {
    req.token = 'Fake Token';
    jwt.verify.mockImplementation(() => { throw new Error('Bad Token!'); });

    middleware(req, res, next);
    expect(jwt.verify.toHaveBeenCalled);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });
  describe('requiresAdmin', () => {
    it('should call next if the users is an admin', () => {
      req.viewer = { admin: true };
      requiresAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should 401 if they\'re not', () => {
      req.viewer = { admin: false };
      requiresAdmin(req, res, next);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
    });
  });
});

