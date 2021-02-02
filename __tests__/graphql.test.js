const { Pool } = require('../src/models/database');
const supertest = require('supertest');

const { buildExpressApp } = require('../server');

const resetMocks = () => {
  jest.clearAllMocks();
};

jest.mock('../src/models/database', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    connected: true,
  })),
}));

describe('data tests', () => {
  const db = new Pool();
  const app = buildExpressApp(db, true);
  const server = app.listen(process.env.PORT);
  const request = supertest(app);

  it('fetch data', async () => {
    expect.assertions(2);

    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

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
