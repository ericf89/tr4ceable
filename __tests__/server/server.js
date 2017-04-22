import supertest from 'supertest';
import { server } from '../../src/server/server';

describe('basic server', () => {
  it('should return empty json', async () => {
    const resp = await supertest(server()).get('/');
    expect(resp.status).toBe(200);
    expect(resp.text).toMatchSnapshot();
  });
});
