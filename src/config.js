if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_ACTIONS) {
  console.log('[server] Loading configuration from .env');
  const fs = require('fs');
  if (!fs.existsSync('.env')) {
    throw new Error('Missing .env file at the root of the workspace');
  }
  require('dotenv').config();
}

const getDbConfig = () =>
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
          requestCert: false,
        },
      }
    : {
        host: process.env.DB_HOST,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT,
        database: process.env.PG_DB,
        ssl: false,
        pgOptions: {
          ssl: {
            rejectUnauthorized: false,
            requestCert: false,
          },
        },
      };

const buildDbUri = config =>
  config.connectionString
    ? config.connectionString
    : `postgresql://${buildUserUri(config)}${config.host}/${config.database}`;

const buildUserUri = config => {
  let result = '';
  if (config.user || config.password) {
    result = `${config.user || ''}:${config.password || ''}@`;
  }
  return result;
};

module.exports = {
  buildDbUri,
  getDbConfig,
};
