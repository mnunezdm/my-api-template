# My API Template

This template repository allows to create quickly a express server prepared for graphql and with passport local authentication

## Running the server

1. Install dependencies
   ```
   $ npm i
   ```
1. Configure DB following this tutorial [Configure DB](docs/CONFIGURE_DB.md)
1. Configure .env file (for example for local development)
   ```shell
   DB_HOST=localhost
   PG_PORT=5432
   PG_DB=$DBNAME
   PG_USER=postgres
   PG_PASSWORD=postgres
   SESSION_SECRET=somesecret
   PORT=3000
   COOKIE_DOMAIN=
   ```
1. Run server
   ```shell
   $ npm start
   ```

## Configure HTTPS

In order to run server over https, it is necessary to include a `server.cert` and `server.key` in your root workspace. Automatically the server will run an HTTPS server in `env.PORT + 1`

These two files can be created with the following script

```shell
$ openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

## Running server with Heroku PSQL

1. List heroku apps

```shell
$ heroku apps
```

1. Run script using

```shell
$ DATABASE_URL=$heroku config:get -a $APP_NAME DATABASE_URL)
```
