import supertest from 'supertest';
import startServer, { server } from '../src/server/server';

describe('basic server', () => {
  it('should return 404', async () => {
    const resp = await supertest(server()).get('/');
    expect(resp.status).toBe(404);
    expect(resp.text).toMatchSnapshot();
  });

  it('should connect to the db on start', () => {
    const mockDb = jest.fn();
    const expressMock = { listen: jest.fn(), use: jest.fn(), locals: {} };
    const mockServer = jest.fn(() => expressMock);

    startServer(mockDb, mockServer);
    expect(mockDb).toHaveBeenCalled();
    expect(mockServer).toHaveBeenCalled();
    expect(expressMock.listen).toHaveBeenCalled();
  });
});

