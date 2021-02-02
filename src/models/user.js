const bcrypt = require('bcrypt');

class User {
  static get table() {
    return 'user_';
  }

  static get fields() {
    return {
      id: {
        type: Number,
        serializable: true,
      },
      username: {
        type: String,
        insertable: true,
        serializable: true,
      },
      password: {
        type: String,
        insertable: true,
      },
      firstName: {
        type: String,
        sqlField: 'first_name',
        insertable: true,
        serializable: true,
      },
      lastName: {
        type: String,
        sqlField: 'last_name',
        insertable: true,
        serializable: true,
      },
    };
  }

  /**
   * @type {Number}
   */
  get id() {
    return this._id;
  }
  set id(id) {
    this._id = id;
  }

  /**
   * @type {Boolean}
   */
  get isInserted() {
    return Boolean(this.id);
  }

  /**
   * @type {String}
   */
  get username() {
    return this._username;
  }
  set username(username) {
    this._username = username;
  }

  /**
   * @type {String}
   */
  get password() {
    return this._password;
  }
  set password(password) {
    this._password = password;
  }

  /**
   * @type {String}
   */
  get firstName() {
    return this._firstName;
  }
  set firstName(firstName) {
    this._firstName = firstName;
  }

  /**
   * @type {String}
   */
  get lastName() {
    return this._lastName;
  }
  set lastName(lastName) {
    this._lastName = lastName;
  }

  /**
   *
   * @param {Boolean} isInsert
   */
  fieldValues(isInsert) {
    return ((!isInsert && this.constructor.FIELDS) || this.insertFields).map(
      field => this[field],
    );
  }

  toJson() {
    const serialized = {};
    Object.keys(this.constructor.fields)
      .filter(field => this.constructor.fields[field].serializable)
      .forEach(field => (serialized[field] = this[field]));
    return serialized;
  }

  async create(db) {
    if (this.isInserted) {
      throw Error('INSERTED_USER_ERROR');
    }

    try {
      const response = await db.query(...this.insertQuery);
      this.id = response.rows[0].id;

      return this;
    } catch (e) {
      if (e.code === '23505') {
        throw 'ERROR_USER_DUPLICATE';
      }
      throw e;
    }
  }

  async checkPassword(password) {
    if (!(await bcrypt.compare(password, this.password))) {
      throw new Error('INVALID_PASSWORD');
    }
  }

  /**
   * @type {String[]}
   */
  get insertFields() {
    return Object.keys(this.constructor.fields).filter(
      field => this.constructor.fields[field].insertable,
    );
  }

  /**
   * @type {String[]}
   */
  static get queryFields() {
    return Object.keys(User.fields).map(
      field => User.fields[field].sqlField || field,
    );
  }

  /**
   * @type {String}
   */
  get insertQuery() {
    const fields = this.insertFields;
    const fieldValues = fields.map(field => this[field]);

    const query = `INSERT INTO ${this.constructor.table} (${fields
      .map(field => this.constructor.fields[field].sqlField || field)
      .join(', ')}) VALUES (${this.insertFields
      .map((_, index) => `$${index + 1}`)
      .join(', ')}) RETURNING id;`;

    return [query, fieldValues];
  }

  /**
   *
   * @param {String} username
   * @param {import('pg').Client} db
   * @returns {Promise<User>}
   */
  static async getByUsername(username, db) {
    let dbResponse;
    try {
      dbResponse = await db.query(
        `SELECT ${User.queryFields.join(
          ', ',
        )} FROM user_ WHERE username = '${username}'`,
      );
    } catch (error) {
      console.error('An error occured while fetching data');
      console.error(error);
      throw error;
    }

    if (!dbResponse.rows.length) {
      throw new Error('USER_NOT_FOUND');
    }

    return User.fromDb(dbResponse.rows[0]);
  }

  /**
   *
   * @param {String} id
   * @param {import('pg').Client} db
   * @returns {Promise<User>}
   */
  static async getById(id, db) {
    const dbData = await db.query(
      `SELECT ${User.queryFields.join(', ')} FROM user_ WHERE id = ${id}`,
    );
    if (dbData && dbData.rows && dbData.rows.length) {
      return User.fromDb(dbData.rows[0]);
    } else {
      throw 'COULD_NOT_FIND_USER';
    }
  }

  static async register(userData, db) {
    const user = new User();
    user.firstName = userData.firstName;
    user.lastName = userData.lastName;
    user.password = await User.hashPassword(userData.password);
    user.username = userData.username;
    await user.create(db);

    return user;
  }

  /**
   *
   * @param {User} dbData
   */
  static fromDb(dbData) {
    const user = new User();
    user.id = dbData.id;
    user.username = dbData.username;
    user.password = dbData.password;
    user.firstName = dbData.first_name;
    user.lastName = dbData.last_name;
    return user;
  }

  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }
}

module.exports = User;
