const chalk = require('chalk');

class BaseObject {
  static HEADERS = [];
  static TABLE = '';

  /**
   * @type {String[]}
   */
  get insertFields() {
    return Object.keys(this.constructor.fields)
      .filter(field => this.constructor.fields[field].insertable)
      .map(field => this.constructor.fields[field].sqlField || field);
  }

  /**
   * @type {String[]}
   */
  get queryFields() {
    return Object.keys(this.constructor.fields).map(
      field => this.constructor.fields[field].sqlField || field,
    );
  }

  /**
   * @type {String}
   */
  get insertString() {
    return `INSERT INTO ${this.constructor.TABLE} (${this.insertFields.join(
      ', ',
    )}) VALUES (${this.insertFields
      .map((_, index) => `$${index + 1}`)
      .join(', ')}) RETURNING id;`;
  }

  toRow() {
    return Object.keys(this.constructor.fields)
      .filter(field => this.constructor.fields[field].insertable)
      .map(field => this[field]);
  }

  /**
   * @type {String}
   */
  get queryString() {
    return `SELECT ${this.queryFields.join(', ')} FROM ${
      this.constructor.TABLE
    };`;
  }

  insertSync(db) {
    const row = this.toRow();
    console.info(
      chalk`{dim [FINE] Inserting to ${this.constructor.TABLE} with '${this.insertString}'}`,
    );
    const { id } = db.querySync(this.insertString, row)[0];
    this.id = id;
  }

  async insert(db) {
    const row = this.toRow();
    console.info(
      chalk`{dim [FINE] Inserting to ${this.constructor.TABLE} with '${this.insertString}'}`,
    );
    const { id } = (await db.query(this.insertString, row)).rows[0];
    this.id = id;
  }
}

module.exports = {
  BaseObject,
};
