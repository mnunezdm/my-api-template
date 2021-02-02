const PgPool = require('pg').Pool;

class Pool extends PgPool {
  get connected() {
    return Boolean(
      this._clients.filter(client => client._connected || client._connecting)
        .length,
    );
  }
}

module.exports = {
  Pool,
};
