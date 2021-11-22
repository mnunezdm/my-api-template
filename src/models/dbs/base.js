const chalk = require('chalk');

class BaseObject {
  static TABLE = '';

  static get fields() {
    return {};
  }

  static get sqlFields() {
    return Object.fromEntries(
      Object.keys(this.fields).map(field => [
        this.fields[field].sqlField || field,
        field,
      ]),
    );
  }

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
    }`;
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

  static async fromId(db, id) {
    const object = new this();
    object.id = id;
    await object.fetch(db);
    return object;
  }

  async fetch(db) {
    const response = await db.query(
      `${this.queryString} WHERE id = ${this.id};`,
    );

    if (!response.rows.length) {
      throw new ResourceNotFoundError(
        `${this.constructor.TABLE} with id ${this.id} not found`,
      );
    }

    this.fromRow(response.rows[0]);

    this._dbStatus = 'queried';
  }

  fromRow(payload) {
    const sqlFieldsMapper = this.constructor.sqlFields;
    Object.keys(payload).forEach(
      key => (this[sqlFieldsMapper[key]] = payload[key]),
    );
  }

  getDbValue(field) {
    let value;

    if (this.constructor.fields[field].type === Date) {
      value = `'${this[field].toISOString()}'`;
    } else if (this.constructor.fields[field].type === String) {
      value = `'${this[field]}'`;
    }
    return value;
  }

  async update(db, fields) {
    await db.query(
      `UPDATE ${this.constructor.TABLE} SET ${fields
        .map(
          field =>
            `${this.constructor.fields[field].sqlField ||
              field} = ${this.getDbValue(field)}`,
        )
        .join(', ')} WHERE id = ${this.id}`,
    );
  }
}

class ResourceNotFoundError extends Error {}

module.exports = {
  BaseObject,
};
