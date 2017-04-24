import supertest from 'supertest';
import { server } from '../src/server/server';

describe('basic server', () => {
  it('should return 404', async () => {
    const resp = await supertest(server({ connect: jest.genMockFn() })).get('/');
    expect(resp.status).toBe(404);
    expect(resp.text).toMatchSnapshot();
  });
});

