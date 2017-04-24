import supertest from 'supertest';
import { server, mongoConnect } from '../../src/server/server';

import userModel from '../../src/server/models/user/db';

describe('Users', () => {
  let disconnect;
  beforeAll(async () => (disconnect = await mongoConnect()));
  afterAll(() => disconnect());

  const mockUserBody = {
    username: 'eric',
    email: 'eric@eric.com',
    password: 'hunter1',
  };

  it('should POST to create', async () => {
    const res = await supertest(server())
      .post('/api/users')
      .send(mockUserBody);

    // Check that id exists, and then delete it before testing snapshot,
    // since it'll always be unique.
    expect(res.body._id);
    delete res.body._id;
    expect(res.body).toMatchSnapshot();
  });

  it('should GET to read', async () => {
    const testUser = await userModel.create(mockUserBody);

    const res = await supertest(server())
      .get(`/api/users/${testUser.id}`);


    // _id in this case is an ObjectId, not just the string like returned
    // in the response... so we have toString it to make our comparision?  Lame.
    const expected = testUser.toJSON();
    expected._id = expected._id.toString();
    delete expected.password;

    expect(res.body).toEqual(expected);
  });
});
