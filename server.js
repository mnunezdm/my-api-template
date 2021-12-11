import { readFileSync } from 'fs';
import { createServer } from 'https';
import esMain from 'es-main';
import cors from 'cors';
import chalk from 'chalk';

import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import passport from 'passport';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import { Pool } from './src/models/database.js';

import { getDbConfig } from './src/config.js';
import { schema } from './src/graphql/schema.js';
import { errorNoDbConnection, startGraphqlMessage } from './src/labels.js';

import initializePassport from './src/passport.js';
import User from './src/models/user.js';

const pgSession = connectPgSimple(session);
const rootValue = {
  ip: (_, request) => request.ip,
};

const assureDbConnected = (_, response, next, db) => {
  if (!db.connected) {
    response
      .status(500)
      .set('Content-Type', 'application/json')
      .send({
        errors: [{ message: errorNoDbConnection }],
      });
  } else {
    next();
  }
};

const notConnected = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.status(200).json({
      message: `Already logged as ${req.user.username}`,
    });
  } else {
    next();
  }
};

const assureConnected = (request, response, next) => {
  if (request.isAuthenticated()) {
    next();
  } else {
    response.status(403).json({ error: { message: 'NO_AUTHENTICATED' } });
  }
};

export const buildExpressApp = db => {
  const app = express();

  initializePassport(passport, db);

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.enable('trust proxy');
  app.use(express.json());
  app.use(passport.initialize());
  app.use(passport.session());

  let store;
  if (process.env.SESSION_STORE === 'PG') {
    store = new pgSession({
      pool: db,
    });
  }

  app.use(
    session({
      store,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        sameSite: 'None',
        domain: process.env.COOKIE_DOMAIN,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/me', assureConnected, (req, res) => {
    res.status(200).json({
      data: req.user.toJson(),
    });
  });

  app.get('/status', (req, res) => {
    res.status(200).send({
      server: true,
      db: db.connected,
      auth: req.isAuthenticated(),
    });
  });

  app.post('/login', notConnected, (request, response) =>
    passport.authenticate('local', (error, user, info) => {
      if (error) {
        response.status(403).json({
          error: {
            message: error.message,
          },
        });
      } else if (!user) {
        response.status(403).json(info);
      } else {
        request.login(user, error => {
          if (error) {
            return response.status(404).json({
              error: { message: error },
            });
          }
          response.status(200).json({
            data: request.user.toJson(),
          });
        });
      }
    })(request, response),
  );

  app.delete('/logout', assureConnected, (request, response) => {
    request.logout(), response.status(204).send();
  });

  app.post('/register', async (request, response) => {
    try {
      const user = await User.register(request.body, db);
      request.login(user, () => {
        response.status(201).send({
          message: 'Created!',
          data: request.user.toJson(),
        });
      });
    } catch (e) {
      if (e === 'ERROR_USER_DUPLICATE') {
        response.status(409).send({ message: 'User already exist' });
      } else {
        console.error(e);
        response.status(500).send({
          message: 'An error occurred while registering the user',
          error: e,
        });
      }
    }
  });

  app.use(
    '/graphql',
    (...args) => assureDbConnected(...args, db),
    graphqlHTTP({
      schema: schema(db),
      rootValue,
      graphiql: true,
    }),
  );

  return app;
};

if (esMain(import.meta)) {
  const db = new Pool(getDbConfig());

  db.connect()
    .then(() => console.log('[server] db connected'))
    .catch(error =>
      console.error(chalk.red`[fatal] Could not connect to db: ${error}`),
    );

  const portNumber = Number(process.env.PORT);

  const app = buildExpressApp(db);

  app.listen(portNumber, () => {
    console.log(
      `[server] ${startGraphqlMessage} http://localhost:${portNumber}/graphql`,
    );
  });

  try {
    createServer(
      {
        key: readFileSync('server.key'),
        cert: readFileSync('server.cert'),
      },
      app,
    ).listen(portNumber + 1, () => {
      console.log(
        `[server] ${startGraphqlMessage} https://localhost:${portNumber +
          1}/graphql`,
      );
    });
  } catch (e) {
    console.warn(
      chalk.magenta`[warning] Could not start https server: ${e.message}`,
    );
  }
}
