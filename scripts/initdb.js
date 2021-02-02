const Client = require('pg-native');
const csvParser = require('csv-parser');
const fs = require('fs');
const chalk = require('chalk');
const yargs = require('yargs');

const { getDbConfig, buildDbUri } = require('../src/config');
const { BaseObject } = require('../src/models/dbs/base');

const argv = yargs
  .option('wipe', {
    alias: 'w',
    description:
      'Reinitializes the entire database, reloading the schema and loading the entire dataset',
    type: 'boolean',
  })
  .option('schema', {
    alias: 's',
    description:
      'Specifies the sql schema to be used, need to pass the -w/--wipe option',
    type: 'string',
    implies: 'wipe',
    default: 'schema.sql',
  })
  .option('dataFile', {
    alias: 'd',
    description: 'CSV file containing the data to be loaded',
    type: 'string',
  })
  .check(argv => fs.accessSync(argv.schema, fs.constants.R_OK) || true)
  .help()
  .alias('help', 'h').argv;

const client = new Client();

const connectionUri = buildDbUri(getDbConfig());
console.log(chalk`{yellow [INFO]} Connecting to ${connectionUri}`);

client.connectSync(connectionUri);

if (argv.wipe) {
  console.log(chalk`{yellow [INFO]} Wiping db`);
  client.querySync(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);

  const schema = fs.readFileSync(argv.schema, { encoding: 'utf8', flag: 'r' });

  client.querySync(schema);
} else {
  console.log(chalk`{yellow [INFO]} Truncating db`);

  client.querySync(
    `TRUNCATE TABLE ${BaseObject.TABLE} RESTART IDENTITY CASCADE;`,
  );
}

if (argv.dataFile) {
  const data = [];
  fs.createReadStream(`data/${argv.dataFile}`)
    .pipe(
      csvParser({
        separator: ',',
        mapValues: BaseObject.getValue,
      }),
    )
    .on('data', row => {
      data.push(BaseObject.fromCsvRow(row));
    })
    .on('end', () => {
      console.log(data[0].toRow());
      try {
        data.forEach(item => {
          try {
            item.insertSync(client);
          } catch (error) {
            const errorMessage = error.stack.split('\n')[0];
            console.error(chalk.red.bold(errorMessage));
          }
        });
      } finally {
        client.end();
      }
    });
}
