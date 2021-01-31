# Configuring DB

1. Install required dependencies
   ```shell
   $ sudo apt install postgresql postgresql-contrib libpq-dev g++ make -y
   ```
1. Initialize postgres service
   ```shell
   $ sudo service postgresql start
   ```
1. Connect to the postgres user, in case of error try the
   ```shell
   $ psql -U postgres -w
   ```
1. Set password
   ```shell
   postgres=# \password postgres
   ```
1. Create database
   ```shell
   postgres=# CREATE DATABASE $DBNAME;
   ```
1. Initialize database schema, copy all the content of the (SCHEMA)[./schema.sql]
1. Initialize data runing the init-db npm script
   ```shell
   $ npm run init-db
   ```

## Troubleshooting

### Peer authentication failed

1. Allow local connections from any user for postgres default user, replacing the XX with your currently installed postgres
   ```shell
   $ sudo vim /etc/postgresql/XX/main/pg_hba.conf
   ```
1. Replace the line containing local `all postgres peer` with `all postgres trust`
1. Restart the postgres service
   ```shell
   $ sudo service postgresql restart
   ```
