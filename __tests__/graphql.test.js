import supertest from 'supertest';

import { buildExpressApp } from '../server.js';
import { jest } from '@jest/globals';

const resetMocks = () => {
  jest.clearAllMocks();
};

describe('data tests', () => {
  const db = {
    query: jest.fn(),
    connected: true,
  };
  const app = buildExpressApp(db, true);
  const server = app.listen(process.env.PORT);
  const request = supertest(app);

  it('fetch data', async () => {
    expect.assertions(2);

    db.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const response = await request
      .post('/graphql')
      .send({
        query: '{ data { id, } }',
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body.data.data).toHaveProperty('id', 1);
    resetMocks();
  });

  server.close();
});
