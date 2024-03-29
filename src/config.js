import { existsSync } from 'fs';
import dotenv from 'dotenv';
import Logger from './utils/logger.js';

if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_ACTIONS) {
  Logger.log('[server] Loading configuration from .env');
  if (!existsSync('.env')) {
    throw new Error('Missing .env file at the root of the workspace');
  }

  dotenv.config();
}

export const getDbConfig = () =>
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

export const buildDbUri = config =>
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
