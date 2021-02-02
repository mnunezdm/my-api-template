/**
 *
 * @param {import('pg').Client} db
 */
async function wipeDb(db) {
  await db.query(`
    TRUNCATE TABLE $DBNAME RESTART IDENTITY CASCADE;
  `);
}

module.exports = {
  wipeDb,
};
