import supertest from 'supertest';
import { server, mongoConnect } from '../../src/server/server';
import User from '../../src/server/models/user/db';
import authMiddleware from '../../src/server/models/auth/middleware';

jest.mock('../../src/server/models/auth/middleware');

describe('Users', () => {
  let disconnect;
  beforeAll(async () => (disconnect = await mongoConnect(__filename)));
  beforeEach(async () => { await User.find().remove(); authMiddleware.mockClear(); });
  afterAll(() => disconnect());

  const mockUserBody = {
    email: 'eric@eric.com',
    password: 'hunter1',
  };

  it('should 201 when POSTing to create', async () => {
    const { body, statusCode } = await supertest(server())
      .post('/api/users')
      .send(mockUserBody);

    expect(body._id);
    expect(body.email).toEqual(mockUserBody.email);
    expect(body.admin).toBeFalsy();
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
    expect(statusCode).toBe(201);
    expect(authMiddleware).not.toHaveBeenCalled();
  });

  it('should 400 if you try to create a user with a taken email', async () => {
    await supertest(server())
      .post('/api/users')
      .send(mockUserBody);

    const { body, statusCode } = await supertest(server())
      .post('/api/users')
      .send(mockUserBody);

    expect(statusCode).toBe(400);
    expect(body).toMatchSnapshot();
    expect(authMiddleware).not.toHaveBeenCalled();
  });

  it('should 200 when GETing self by id', async () => {
    const testUser = await User.create(mockUserBody);
    authMiddleware.mockImplementation((req, res, next) => {
      req.viewer = { _id: testUser.id };
      return next();
    });
    const { body, statusCode } = await supertest(server())
      .get(`/api/users/${testUser.id}`);

    expect(statusCode).toBe(200);
    expect(body._id).toEqual(testUser.id);
    expect(body.email).toEqual(mockUserBody.email);
    expect(body.admin).toBeFalsy();
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('should 401 if user doesn\'t have privileges to view the user', async () => {
    const testUser = await User.create(mockUserBody);
    authMiddleware.mockImplementation((req, res, next) => {
      req.viewer = { _id: 'someOtherid' };
      return next();
    });
    const { body, statusCode } = await supertest(server())
      .get(`/api/users/${testUser.id}`);

    expect(statusCode).toBe(401);
    expect(body).toMatchSnapshot();
  });

  it('should 200 if viewer is admin', async () => {
    const testUser = await User.create(mockUserBody);
    authMiddleware.mockImplementation((req, res, next) => {
      req.viewer = { _id: 'someOtherid', isAdmin: true };
      return next();
    });
    const { body, statusCode } = await supertest(server())
      .get(`/api/users/${testUser.id}`);

    expect(statusCode).toBe(200);
    expect(body._id).toEqual(testUser.id);
    expect(body.email).toEqual(mockUserBody.email);
    expect(body.admin).toBeFalsy();
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('should 404 if fetched user doesn\'t exist', async () => {
    const { body, statusCode } = await supertest(server())
      .get('/api/users/notAnId');
    expect(statusCode).toBe(404);
    expect(body).toMatchSnapshot();
  });

  it('should 200 when GETing by email', async () => {
    const testUser = await User.create(mockUserBody);
    const { body, statusCode } = await supertest(server())
      .get(`/api/users/?email=${mockUserBody.email}`);

    expect(statusCode).toBe(200);
    expect(body.users.length).toBe(1);
    const { users: [user] } = body;
    expect(user._id).toEqual(testUser.id);
    expect(user.email).toEqual(mockUserBody.email);
    expect(user.admin).toBeFalsy();
    expect(user.createdAt).toBeTruthy();
    expect(user.updatedAt).toBeTruthy();
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('should 404 when GETing by email if the email hasn\'t registered', async () => {
    const { body, statusCode } = await supertest(server())
      .get('/api/users/?email=nope@nope.com');

    expect(statusCode).toBe(404);
    expect(body).toMatchSnapshot();
    expect(authMiddleware).toHaveBeenCalled();
  });
});
