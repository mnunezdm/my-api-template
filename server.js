const fs = require('fs');
const https = require('https');

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { Pool } = require('./src/models/database');

const { getDbConfig } = require('./src/config');
const { schema } = require('./src/graphql');
const labels = require('./src/labels');

const cors = require('cors');

const rootValue = {
  ip: (_, request) => request.ip,
};

const initializePassport = require('./src/passport');
const User = require('./src/models/user');

const assureDbConnected = (_, response, next, db) => {
  if (!db.connected) {
    response
      .status(500)
      .set('Content-Type', 'application/json')
      .send({
        errors: [{ message: labels.errorNoDbConnection }],
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

const assureConntected = (request, response, next) => {
  if (request.isAuthenticated()) {
    next();
  } else {
    response.status(403).json({ error: { message: 'NO_AUTHENTICATED' } });
  }
};

const buildExpressApp = db => {
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

  app.get('/me', assureConntected, (req, res) => {
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

  app.delete('/logout', assureConntected, (request, response) => {
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
          message: 'An error occured while registering the user',
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

if (require.main === module) {
  const db = new Pool(getDbConfig());

  db.connect();

  const portNumber = Number(process.env.PORT);

  const app = buildExpressApp(db);

  app.listen(portNumber, () => {
    console.log(
      `[server] ${labels.startGraphqlMessage} http://localhost:${portNumber}/graphql`,
    );
  });

  try {
    https
      .createServer(
        {
          key: fs.readFileSync('server.key'),
          cert: fs.readFileSync('server.cert'),
        },
        app,
      )
      .listen(portNumber + 1, () => {
        console.log(
          `[server] ${
            labels.startGraphqlMessage
          } https://localhost:${portNumber + 1}/graphql`,
        );
      });
  } catch (e) {
    console.warn('[server] Could not start https server', e);
  }
}

module.exports = {
  buildExpressApp,
};
