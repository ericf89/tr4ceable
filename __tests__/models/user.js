import supertest from 'supertest';
import { server, mongoConnect } from '../../src/server/server';

import User from '../../src/server/models/user/db';


describe('Users', () => {
  let disconnect;
  beforeAll(async () => (disconnect = await mongoConnect(__filename)));
  beforeEach(async () => { await User.find().remove(); });
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
  });

  it('should 400 if you try to create a user with a taken email', async () => {
    await supertest(server())
      .post('/api/users')
      .send(mockUserBody);

    const { body, statusCode } = await supertest(server())
      .post('/api/users')
      .send(mockUserBody);

    // Check that id exists, and then delete it before testing snapshot,
    // since it'll always be unique.
    expect(statusCode).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it('should 200 when GETing by id', async () => {
    const testUser = await User.create(mockUserBody);

    const { body, statusCode } = await supertest(server())
      .get(`/api/users/${testUser.id}`);

    expect(statusCode).toBe(200);
    expect(body._id).toEqual(testUser.id);
    expect(body.email).toEqual(mockUserBody.email);
    expect(body.admin).toBeFalsy();
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
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
  });

  it('should 404 when GETing by email if the email hasn\'t registered', async () => {
    const { body, statusCode } = await supertest(server())
      .get('/api/users/?email=nope@nope.com');

    expect(statusCode).toBe(404);
    expect(body).toMatchSnapshot();
  });
});
