const { Pool } = require('../src/models/database');
const supertest = require('supertest');

const { getDbConfig } = require('../src/config');
const { buildExpressApp } = require('../server');

describe('general tests', () => {
  const db = new Pool(getDbConfig());
  const app = buildExpressApp(db);
  const server = app.listen(process.env.PORT);
  const request = supertest(app);

  it('service available', async () => {
    expect.assertions(1);
    const response = await request.get('/status');
    expect(response.status).toBe(200);
  });

  it('database connection', async () => {
    expect.assertions(3);
    await db.connect();
    const response = await request
      .get('/status')
      .expect('Content-Type', /json/);
    expect(response.status).toBe(200);
    expect(response.body.server).toBe(true);
    expect(response.body.db).toBe(true);
  });

  server.close();
});
