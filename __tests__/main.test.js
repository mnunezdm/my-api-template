import { Pool } from '../src/models/database.js';
import supertest from 'supertest';

import { getDbConfig } from '../src/config.js';
import { buildExpressApp } from '../server.js';

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
