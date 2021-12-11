import Client from 'pg-native';
import csvParser from 'csv-parser';
import { accessSync, constants, readFileSync, createReadStream } from 'fs';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getDbConfig, buildDbUri } from '../src/config.js';
import { BaseObject } from '../src/models/dbs/base.js';
import Logger from '../src/utils/logger.js';

const argv = yargs(hideBin(process.argv))
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
  .check(argv => accessSync(argv.schema, constants.R_OK) || true)
  .help()
  .alias('help', 'h').argv;

const client = new Client();

const connectionUri = buildDbUri(getDbConfig());
Logger.log(chalk`{yellow [INFO]} Connecting to ${connectionUri}`);

client.connectSync(connectionUri);

if (argv.wipe) {
  Logger.log(chalk`{yellow [INFO]} Wiping db`);
  client.querySync(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);

  const schema = readFileSync(argv.schema, { encoding: 'utf8', flag: 'r' });

  client.querySync(schema);
} else {
  Logger.log(chalk`{yellow [INFO]} Truncating db`);

  client.querySync(
    `TRUNCATE TABLE ${BaseObject.TABLE} RESTART IDENTITY CASCADE;`,
  );
}

if (argv.dataFile) {
  const data = [];
  createReadStream(`data/${argv.dataFile}`)
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
      try {
        data.forEach(item => {
          try {
            item.insertSync(client);
          } catch (error) {
            const errorMessage = error.stack.split('\n')[0];
            Logger.error(chalk.red.bold(errorMessage));
          }
        });
      } finally {
        client.end();
      }
    });
}
