import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import config from 'config';
import { server, mongoConnect } from '../../src/server/server';

import User from '../../src/server/models/user/db';

describe('Auth', () => {
  let disconnect;
  beforeAll(async () => {
    disconnect = await mongoConnect();
    // Setup a fake mock admin user;
    await User.create({
      email: 'admin@admin.com',
      admin: true,
      passwordHash: '$2a$10$T2xq.cxyuAvwqOVyEXIN3ua3EEfJ6oHIKuHOc8xnzIJXlpoLemvBy',
    });
    // Setup a mock basic user
    await User.create({
      email: 'user@user.com',
      passwordHash: '$2a$10$T2xq.cxyuAvwqOVyEXIN3ua3EEfJ6oHIKuHOc8xnzIJXlpoLemvBy',
    });
  });

  afterAll(() => disconnect());

  it('should 400 if post body is empty', async () => {
    const empty = await supertest(server())
      .post('/api/auth');

    expect(empty.status).toBe(400);
  });

  it('should 400 if password isn\'t supplied', async () => {
    const noPass = await supertest(server())
      .post('/api/auth')
      .send({ email: 'no pass here' });


    expect(noPass.status).toBe(400);
  });

  it('should 400 if email isn\'t supplied', async () => {
    const noEmail = await supertest(server())
      .post('/api/auth')
      .send({ password: 'no email' });
    expect(noEmail.status).toBe(400);
  });

  it('should 401 if the password is incorrect', async () => {
    const res = await supertest(server())
      .post('/api/auth')
      .send({ email: 'admin@admin.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('should should 401 if the password is incorrect', async () => {
    const res = await supertest(server())
      .post('/api/auth')
      .send({ email: 'admin@admin.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('should should 401 if the user doesn\'t exist', async () => {
    const res = await supertest(server())
      .post('/api/auth')
      .send({ email: 'blah@blah.com', password: 'blah' });

    expect(res.status).toBe(401);
  });

  it('should return a valid token if the email and password match', async () => {
    const res = await supertest(server())
      .post('/api/auth')
      .send({ email: 'admin@admin.com', password: 'hunter1' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('should have admin set based on the user', async () => {
    const { body: { token: adminToken } } = await supertest(server())
      .post('/api/auth')
      .send({ email: 'admin@admin.com', password: 'hunter1' });
    let decoded = jwt.verify(adminToken, config.get('jwtSecret'));
    expect(decoded.admin).toBe(true);

    const { body: { token: basicToken } } = await supertest(server())
      .post('/api/auth')
      .send({ email: 'user@user.com', password: 'hunter1' });
    decoded = jwt.verify(basicToken, config.get('jwtSecret'));
    expect(decoded.admin).toBe(false);
  });
});
